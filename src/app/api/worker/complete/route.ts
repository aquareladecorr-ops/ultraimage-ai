import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthorizedLocalWorker } from "@/lib/local-worker-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CompleteSchema = z.object({
  jobId: z.string().uuid(),
  claimToken: z.string().min(32).max(128),
  resultKey: z.string().min(1).max(500),
  width: z.number().int().positive().max(12000),
  height: z.number().int().positive().max(12000),
  processingTimeMs: z.number().int().nonnegative().max(86_400_000),
});

export async function POST(request: Request) {
  if (!isAuthorizedLocalWorker(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = CompleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_result" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("complete_local_image_job", {
    p_job_id: parsed.data.jobId,
    p_claim_token: parsed.data.claimToken,
    p_result_key: parsed.data.resultKey,
    p_result_width: parsed.data.width,
    p_result_height: parsed.data.height,
    p_processing_time_ms: parsed.data.processingTimeMs,
  });
  if (error) {
    console.error("Local worker completion failed:", error.message);
    return NextResponse.json({ error: "completion_rejected" }, { status: 409 });
  }
  if (data !== true) return NextResponse.json({ error: "completion_rejected" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
