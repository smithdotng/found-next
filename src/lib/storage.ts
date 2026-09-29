import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Object storage for uploads — Cloudflare R2 (or any S3-compatible bucket).
 * Enabled when S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are set;
 * otherwise uploads stay on the local disk.
 *
 * Objects are keyed exactly like the public path minus the leading slash:
 *   "/uploads/property-123.jpeg"  →  key "uploads/property-123.jpeg"
 * so URLs already stored in MongoDB keep working.
 */
let client: S3Client | null | undefined;

export function storageEnabled() {
  return !!(process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

function s3() {
  if (client !== undefined) return client;
  client = storageEnabled()
    ? new S3Client({
        region: process.env.S3_REGION || "auto",
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        endpoint: process.env.S3_ENDPOINT,
        credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
      })
    : null;
  return client;
}

export function keyFor(publicPath: string) {
  return publicPath.replace(/^\/+/, "");
}

export async function putObject(publicPath: string, body: Uint8Array, contentType: string) {
  const c = s3();
  if (!c) throw new Error("Object storage is not configured");
  await c.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: keyFor(publicPath),
      Body: body,
      ContentType: contentType,
      // File names are unique per upload, so they can be cached for a year.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteObject(publicPath: string) {
  const c = s3();
  if (!c) return;
  try {
    await c.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: keyFor(publicPath) }));
  } catch (e) {
    console.error("[storage] delete failed", publicPath, e instanceof Error ? e.message : e);
  }
}
