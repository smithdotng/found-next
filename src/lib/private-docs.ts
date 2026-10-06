import "server-only";
import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { deleteKey, getObjectBytes, putPrivateObject, storageEnabled } from "./storage";

/**
 * Private documents (title copies, survey plans, authority letters). Stored under
 * random, unguessable keys and only ever served through an authenticated route,
 * never linked publicly.
 */
const TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

export class DocumentError extends Error {}

const localRoot = () => path.resolve(/*turbopackIgnore: true*/ process.env.PRIVATE_DOCS_DIR || path.join(process.cwd(), "private-uploads"));

export async function saveDocument(file: File) {
  const ext = TYPES[file.type];
  if (!ext) throw new DocumentError(`${file.name}: upload a PDF or an image (JPG, PNG, WebP).`);
  if (file.size > MAX_DOC_BYTES) throw new DocumentError(`${file.name} is larger than 10MB.`);
  const key = `private/docs/${randomUUID()}${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (storageEnabled()) {
    await putPrivateObject(key, bytes, file.type);
  } else {
    const full = path.join(localRoot(), path.basename(key));
    await mkdir(localRoot(), { recursive: true });
    await writeFile(full, bytes);
  }
  return { key, name: file.name.slice(0, 160), contentType: file.type, size: file.size };
}

export async function readDocument(key: string) {
  if (!/^private\/docs\/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/.test(key)) return null;
  if (storageEnabled()) return getObjectBytes(key);
  try {
    return new Uint8Array(await readFile(path.join(localRoot(), path.basename(key))));
  } catch {
    return null;
  }
}

export async function removeDocument(key: string) {
  if (storageEnabled()) return deleteKey(key);
  await unlink(path.join(localRoot(), path.basename(key))).catch(() => {});
}
