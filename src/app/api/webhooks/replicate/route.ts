/**
 * POST /api/webhooks/replicate
 *
 * Receives completion notifications from the AI provider when using the async
 * path (upscaler.runAsync). The current MVP uses sync `upscaler.run`, so this
 * endpoint is here to support the eventual migration to async — needed when
 * processing volume grows beyond what fits in a serverless request timeout.
 *
 * The handler is idempotent and uses external_job_id to find the job.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { commitCredits, releaseCredits } from "@/lib/credits/transactions";
import { uploadBuffer, buildObjectKey } from "@/lib/storage/r2";
import { sendJobCompletedEmail, sendJobFailedEmail } from "@/lib/email/resend";

type ReplicateWebhookPayload = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: string | null;
  metrics?: { predict_time?: number };
};

export async function POST(req: Request) {
  let payload: ReplicateWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!payload.id) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createAdminClient();

  const { data: job } = await admin
    .from("image_jobs")
    .select("*")
    .eq("external_job_id", payload.id)
    .single();

  if (!job) {
    // Could be a stale webhook or a job we don't track — accept silently
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Idempotency: already finalized
  if (job.status === "completed" || job.status === "failed") {
    return NextResponse.json({ ok: true, alreadyFinalized: true });
  }

  if (payload.status === "succeeded") {
    try {
      const resultUrl = extractUrl(payload.output);
      if (!resultUrl) throw new Error("Provider returned no URL");

      const resp = await fetch(resultUrl);
      if (!resp.ok) throw new Error("Failed to fetch result");
      const buf = Buffer.from(await resp.arrayBuffer());
      const ct = resp.headers.get("content-type") ?? "image/jpeg";
      const ext = (ct.split("/")[1] ?? "jpg").split(";")[0];
      const key = buildObjectKey(job.user_id, "result", ext || "jpg");
      await uploadBuffer(key, buf, ct);

      await commitCredits({ userId: job.user_id, amount: job.credits_planned, jobId: job.id });

      await admin
        .from("image_jobs")
        .update({
          status: "completed",
          result_url: key,
          credits_consumed: job.credits_planned,
          processing_time_ms: payload.metrics?.predict_time ? Math.round(payload.metrics.predict_time * 1000) : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", job.user_id)
        .single();
      if (profile?.email) {
        sendJobCompletedEmail({ to: profile.email, jobId: job.id, resultUrl: key }).catch(console.error);
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "post-processing failed";
      await releaseCredits({
        userId: job.user_id,
        amount: job.credits_planned,
        jobId: job.id,
        reason: `Falha pós-processamento: ${message}`,
      }).catch(console.error);
      await admin
        .from("image_jobs")
        .update({ status: "failed", error_message: message, error_code: "POST_PROCESS" })
        .eq("id", job.id);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  if (payload.status === "failed" || payload.status === "canceled") {
    const reason = payload.error ?? "Falha no provedor de IA";
    await releaseCredits({
      userId: job.user_id,
      amount: job.credits_planned,
      jobId: job.id,
      reason,
    }).catch(console.error);
    await admin
      .from("image_jobs")
      .update({ status: "failed", error_message: reason, error_code: "PROVIDER" })
      .eq("id", job.id);

    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", job.user_id)
      .single();
    if (profile?.email) {
      sendJobFailedEmail({ to: profile.email, jobId: job.id, reason }).catch(console.error);
    }
  }

  return NextResponse.json({ ok: true });
}

function extractUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  return null;
}
