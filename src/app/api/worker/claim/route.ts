import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTierById } from "@/config/credits";
import { createAdminClient } from "@/lib/supabase/server";
import { buildObjectKey, getPresignedReadUrl, getPresignedUploadUrl } from "@/lib/storage/r2";
import { isAuthorizedLocalWorker } from "@/lib/local-worker-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ClaimSchema = z.object({
  workerId: z.string().regex(/^[A-Za-z0-9._-]{1,100}$/),
});

export async function POST(request: Request) {
  if (!isAuthorizedLocalWorker(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = ClaimSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_worker" }, { status: 400 });

  const claimToken = randomBytes(32).toString("base64url");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_local_image_job", {
    p_worker_id: parsed.data.workerId,
    p_claim_token: claimToken,
    p_lease_seconds: 7200,
  });
  if (error) {
    console.error("Local worker claim failed:", error.message);
    return NextResponse.json({ error: "queue_unavailable" }, { status: 503 });
  }

  const job = Array.isArray(data) ? data[0] : data;
  if (!job) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

  try {
    const tier = getTierById(job.target_resolution_tier);
    if (!tier) throw new Error("Plano de resolução inválido no trabalho.");
    const inputUrl = await getPresignedReadUrl(job.original_url, 3600);
    const resultKey = buildObjectKey(job.user_id, "result", "jpg");
    const resultUploadUrl = await getPresignedUploadUrl(resultKey, "image/jpeg", 3600);
    return NextResponse.json(
      {
        jobId: job.job_id,
        claimToken,
        inputUrl,
        resultUploadUrl,
        resultKey,
        originalWidth: job.original_width,
        originalHeight: job.original_height,
        maxDimension: tier.maxDimension,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Falha ao preparar o trabalho.";
    await admin.rpc("fail_local_image_job", {
      p_job_id: job.job_id,
      p_claim_token: claimToken,
      p_error_code: "LOCAL_JOB_SETUP_FAILED",
      p_error_message: message,
    });
    console.error("Local worker setup failed:", message);
    return NextResponse.json({ error: "job_setup_failed" }, { status: 503 });
  }
}
