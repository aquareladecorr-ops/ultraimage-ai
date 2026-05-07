/**
 * Supabase Storage adapter — replaces Cloudflare R2.
 * Uses Supabase service role to upload/download files.
 * Buckets: "images" (private) — stores originals and results.
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = "images";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type UploadKind = "original" | "result";

export function buildObjectKey(userId: string, kind: UploadKind, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `users/${userId}/${kind}/${ts}-${rand}.${safeExt}`;
}

/**
 * Returns a presigned URL the browser can PUT to (upload directly to Supabase Storage).
 */
export async function getPresignedUploadUrl(
  key: string,
  _contentType: string,
  expiresInSeconds = 600
): Promise<string> {
  const supabase = adminClient();
  
  // Ensure bucket exists
  await ensureBucket();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(key);

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Returns a presigned GET URL for a stored object.
 */
export async function getPresignedReadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = adminClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Failed to create read URL: ${error?.message}`);
  }

  return data.signedUrl;
}

export async function deleteObject(key: string): Promise<void> {
  const supabase = adminClient();
  await supabase.storage.from(BUCKET).remove([key]);
}

/**
 * Upload a Buffer directly from the server.
 */
export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const supabase = adminClient();
  await ensureBucket();
  
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload buffer: ${error.message}`);
  }
}

// Ensure the bucket exists — creates it if not
let _bucketEnsured = false;
async function ensureBucket(): Promise<void> {
  if (_bucketEnsured) return;
  const supabase = adminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
    if (error && !error.message.includes("already exists")) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
  }
  _bucketEnsured = true;
}
