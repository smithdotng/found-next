import "server-only";
import { existsSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomInt } from "crypto";

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

type Kind = "property" | "profile" | "blog" | "project";

const SUBDIR: Record<Kind, string> = { property: "", profile: "profiles", blog: "blogs", project: "" };
const MAX_BYTES: Record<Kind, number> = {
  property: 5 * 1024 * 1024,
  profile: 2 * 1024 * 1024,
  blog: 5 * 1024 * 1024,
  project: 5 * 1024 * 1024,
};

/** Saves one uploaded image and returns its public URL (e.g. /uploads/property-123.jpeg). */
export async function saveImage(file: File, kind: Kind): Promise<string> {
  if (!ALLOWED.test(file.type)) throw new UploadError("Only image files are allowed (jpeg, jpg, png, gif, webp)");
  if (file.size > MAX_BYTES[kind]) throw new UploadError(`File too large. Maximum size is ${MAX_BYTES[kind] / 1024 / 1024}MB.`);
  const dir = path.join(/*turbopackIgnore: true*/ uploadRoot(), SUBDIR[kind]);
  await mkdir(dir, { recursive: true });
  const name = `${kind}-${Date.now()}-${randomInt(1e9)}${EXT[file.type] ?? ".jpg"}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${SUBDIR[kind] ? `${SUBDIR[kind]}/` : ""}${name}`;
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
