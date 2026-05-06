/**
 * POST /api/process
 *
 * Trigger upscale processing for an uploaded image.
 *
 * Flow:
 *   1. Validate user and input
 *   2. Resolve cost from tier
 *   3. Create image_job row (status=pending)
 *   4. Reserve credits (RPC)
 *   5. Call Ultra Engine (synchronous for MVP — async later)
 *   6. On success: persist result, commit credits, send email
 *   7. On failure: release credits, mark job failed, send email
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServer, createAdminClient } from "@/lib/supabase/server";
import { getTierById } from "@/config/credits";
import { reserveCredits, commitCredits, releaseCredits, InsufficientCreditsError } from "@/lib/credits/transactions";
import { upscaler, UpscaleError } from "@/lib/ai/upscaler";
import { getPresignedReadUrl, uploadBuffer, buildObjectKey } from "@/lib/storage/r2";
import { sendJobCompletedEmail, sendJobFailedEmail } from "@/lib/email/resend";

const BodySchema = z.object({
  originalKey: z.string().min(1),
  originalFilename: z.string().min(1),
  originalSizeBytes: z.number().int().positive(),
  originalWidth: z.number().int().positive(),
  originalHeight: z.number().int().positive(),
  tierId: z.string().min(1),
});

export async function POST(req: Request) {
  // 1. Authenticate
  const supabase = createServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = auth.user.id;
  const userEmail = auth.user.email!;

  // 2. Validate input
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  // 3. Resolve tier
  const tier = getTierById(parsed.data.tierId);
  if (!tier) return NextResponse.json({ error: "invalid_tier" }, { status: 400 });

  const admin = createAdminClient();

  // 4. Create job row
  const { data: job, error: jobErr } = await admin
    .from("image_jobs")
    .insert({
      user_id: userId,
      original_filename: parsed.data.originalFilename,
      original_url: parsed.data.originalKey,
      original_size_bytes: parsed.data.originalSizeBytes,
      original_width: parsed.data.originalWidth,
      original_height: parsed.data.originalHeight,
      target_resolution_tier: tier.id,
      credits_planned: tier.credits,
      credits_consumed: null,
      result_url: null,
      result_width: null,
      result_height: null,
      processing_time_ms: null,
      status: "pending",
      external_job_id: null,
      error_message: null,
      error_code: null,
      completed_at: null,
    })
    .select()
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "job_create_failed", detail: jobErr?.message }, { status: 500 });
  }

  // 5. Reserve credits
  try {
    await reserveCredits({ userId, amount: tier.credits, jobId: job.id });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      await admin
        .from("image_jobs")
        .update({ status: "canceled", error_message: err.message, error_code: "INSUFFICIENT_CREDITS" })
        .eq("id", job.id);
      return NextResponse.json(
        { error: "insufficient_credits", required: err.required, available: err.available },
        { status: 402 }
      );
    }
    throw err;
  }

  // 6. Mark processing + call IA
  await admin.from("image_jobs").update({ status: "processing" }).eq("id", job.id);

  try {
    const inputUrl = await getPresignedReadUrl(parsed.data.originalKey, 3600);
    const result = await upscaler.run({
      imageUrl: inputUrl,
      originalWidth: parsed.data.originalWidth,
      originalHeight: parsed.data.originalHeight,
      tier,
    });

    // 7. Download the IA's result and re-host on our R2 (so we control the URL/lifetime)
    const resp = await fetch(result.resultUrl);
    if (!resp.ok) throw new UpscaleError("Failed to fetch result from provider", "FETCH_RESULT", true);
    const arrayBuf = await resp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    const ext = (resp.headers.get("content-type")?.split("/")[1] ?? "jpg").split(";")[0];
    const resultKey = buildObjectKey(userId, "result", ext || "jpg");
    await uploadBuffer(resultKey, buf, resp.headers.get("content-type") ?? "image/jpeg");

    // 8. Commit credits + finalize job
    await commitCredits({ userId, amount: tier.credits, jobId: job.id });

    await admin
      .from("image_jobs")
      .update({
        status: "completed",
        result_url: resultKey,
        credits_consumed: tier.credits,
        processing_time_ms: result.processingTimeMs,
        external_job_id: result.externalJobId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // 9. Notify
    sendJobCompletedEmail({ to: userEmail, jobId: job.id, resultUrl: resultKey }).catch(console.error);

    return NextResponse.json({ jobId: job.id, status: "completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    const code = err instanceof UpscaleError ? err.code : "UNKNOWN_ERROR";

    // Release reserved credits
    await releaseCredits({
      userId,
      amount: tier.credits,
      jobId: job.id,
      reason: `Falha: ${message}`,
    }).catch(console.error);

    await admin
      .from("image_jobs")
      .update({ status: "failed", error_message: message, error_code: code })
      .eq("id", job.id);

    sendJobFailedEmail({ to: userEmail, jobId: job.id, reason: message }).catch(console.error);

    return NextResponse.json({ error: "processing_failed", detail: message, code }, { status: 500 });
  }
}
