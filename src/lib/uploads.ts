import "server-only";
import { existsSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomInt } from "crypto";
import { deleteObject, putObject, storageEnabled } from "./storage";

const ALLOWED = /^(image\/(jpeg|jpg|png|gif|webp))$/;
const EXT: Record<string, string> = {
  "image/jpeg": ".jpeg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

/**
 * Where uploaded images live. By default this points at the Express app's
 * public/uploads folder (one level up), so both apps read and write the same
 * files and every existing /uploads/... URL in MongoDB keeps working.
 */
export function uploadRoot() {
  if (process.env.UPLOAD_DIR) return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR);
  const shared = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "..", "public", "uploads");
  if (existsSync(shared)) return shared;
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), "uploads");
}

export class UploadError extends Error {}

type Kind = "property" | "profile" | "blog" | "project" | "receipt";

const SUBDIR: Record<Kind, string> = { property: "", profile: "profiles", blog: "blogs", project: "", receipt: "receipts" };
const MAX_BYTES: Record<Kind, number> = {
  property: 5 * 1024 * 1024,
  profile: 2 * 1024 * 1024,
  blog: 5 * 1024 * 1024,
  project: 5 * 1024 * 1024,
  receipt: 5 * 1024 * 1024,
};

/**
 * Saves one uploaded image and returns its public path (e.g. /uploads/property-123.jpeg).
 * Goes to Cloudflare R2 when storage is configured, otherwise to the local uploads folder.
 */
export async function saveImage(file: File, kind: Kind): Promise<string> {
  if (!ALLOWED.test(file.type)) throw new UploadError("Only image files are allowed (jpeg, jpg, png, gif, webp)");
  if (file.size > MAX_BYTES[kind]) throw new UploadError(`File too large. Maximum size is ${MAX_BYTES[kind] / 1024 / 1024}MB.`);
  const name = `${kind}-${Date.now()}-${randomInt(1e9)}${EXT[file.type] ?? ".jpg"}`;
  const publicPath = `/uploads/${SUBDIR[kind] ? `${SUBDIR[kind]}/` : ""}${name}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (storageEnabled()) {
    // Cloudflare R2 / S3
    try {
      await putObject(publicPath, bytes, file.type);
    } catch (e) {
      console.error("[storage] upload failed", e instanceof Error ? e.message : e);
      throw new UploadError("Couldn't store the photo right now. Please try again.");
    }
    return publicPath;
  }
  const dir = path.join(/*turbopackIgnore: true*/ uploadRoot(), SUBDIR[kind]);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return publicPath;
}

export async function saveImages(files: File[], kind: Kind) {
  const real = files.filter((f) => f && typeof f === "object" && f.size > 0);
  const urls: string[] = [];
  for (const f of real) urls.push(await saveImage(f, kind));
  return urls;
}

/** Best-effort delete of a file we previously stored under /uploads. */
export async function removeUpload(url?: string) {
  if (!url || !url.startsWith("/uploads/")) return;
  if (storageEnabled()) await deleteObject(url);
  const rel = url.replace(/^\/uploads\//, "");
  const full = path.join(/*turbopackIgnore: true*/ uploadRoot(), rel);
  if (!full.startsWith(uploadRoot())) return;
  try {
    await unlink(full);
  } catch {
    /* already gone */
  }
}

export function filesFrom(form: FormData, key: string): File[] {
  return form.getAll(key).filter((v): v is File => typeof v === "object" && v !== null && "size" in v && (v as File).size > 0);
}
