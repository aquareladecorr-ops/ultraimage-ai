/**
 * POST /api/upload-url
 * Body: { filename: string, contentType: string }
 *
 * Uploads the file through the server to Supabase Storage.
 * Returns { key } — the storage key sent to /api/process.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServer } from "@/lib/supabase/server";
import { buildObjectKey, uploadBuffer } from "@/lib/storage/r2";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 25 * 1024 * 1024;

const QuerySchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().refine((c) => ACCEPTED.includes(c), {
    message: "Content type não suportado",
  }),
});

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Parse query params for metadata
  const url = new URL(req.url);
  const filename = url.searchParams.get("filename") ?? "upload";
  const contentType = req.headers.get("content-type") ?? "image/jpeg";

  const parsed = QuerySchema.safeParse({ filename, contentType });
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  // Read the raw body (the image file)
  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: "empty_file" }, { status: 400 });
  }
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const ext = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = buildObjectKey(auth.user.id, "original", ext);

  await uploadBuffer(key, buffer, parsed.data.contentType);

  return NextResponse.json({ key });
}
