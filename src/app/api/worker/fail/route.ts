import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthorizedLocalWorker } from "@/lib/local-worker-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FailSchema = z.object({
  jobId: z.string().uuid(),
  claimToken: z.string().min(32).max(128),
  code: z.string().min(1).max(80).default("LOCAL_WORKER_FAILED"),
  message: z.string().min(1).max(1500),
});

export async function POST(request: Request) {
  if (!isAuthorizedLocalWorker(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = FailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_failure" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("fail_local_image_job", {
    p_job_id: parsed.data.jobId,
    p_claim_token: parsed.data.claimToken,
    p_error_code: parsed.data.code,
    p_error_message: parsed.data.message,
  });
  if (error) {
    console.error("Local worker failure update rejected:", error.message);
    return NextResponse.json({ error: "failure_rejected" }, { status: 409 });
  }
  if (data !== true) return NextResponse.json({ error: "failure_rejected" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
