/**
 * POST /api/upload-url
 * Body: { filename: string, contentType: string }
 *
 * Issues a presigned PUT URL the browser uses to upload directly to R2.
 * Returns { uploadUrl, key } — the key is then sent to /api/process.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServer } from "@/lib/supabase/server";
import { buildObjectKey, getPresignedUploadUrl } from "@/lib/storage/r2";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const BodySchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().refine((c) => ACCEPTED.includes(c), {
    message: "Content type não suportado",
  }),
});

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const ext = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = buildObjectKey(auth.user.id, "original", ext);
  const uploadUrl = await getPresignedUploadUrl(key, parsed.data.contentType, 600);

  return NextResponse.json({ uploadUrl, key });
}
