/**
 * Cloudflare R2 storage adapter.
 * R2 is S3-compatible, so we use the AWS SDK pointed at R2's endpoint.
 *
 * - Uploads use presigned URLs (signed by the server, used by the browser)
 * - Reads use presigned GET URLs that expire (LGPD-friendly)
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REQUIRED_ENVS = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"] as const;

function ensureEnv() {
  for (const key of REQUIRED_ENVS) {
    if (!process.env[key]) throw new Error(`${key} is not set`);
  }
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  ensureEnv();
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return _client;
}

const BUCKET = () => process.env.R2_BUCKET_NAME!;

export type UploadKind = "original" | "result";

export function buildObjectKey(userId: string, kind: UploadKind, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `users/${userId}/${kind}/${ts}-${rand}.${safeExt}`;
}

/**
 * Returns a presigned URL the browser can PUT to (direct-to-R2 upload).
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
}

/**
 * Returns a presigned GET URL for a stored object (download / IA fetch).
 */
export async function getPresignedReadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: BUCKET(),
    Key: key,
  });
  return getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}

/**
 * Upload a Buffer directly from the server (used when fetching the IA result).
 */
export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}
