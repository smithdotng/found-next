import { readFile, stat } from "fs/promises";
import path from "path";
import { uploadRoot } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

/**
 * Serves user uploads from the shared uploads folder at request time
 * (Next.js only serves files that were in /public at build time).
 * Also repairs the old "/uploads/properties/<file>" URLs the Express realtor
 * form wrote while saving the file to /uploads/<file>.
 */
export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await ctx.params;
  const root = uploadRoot();
  const candidates = [path.join(/*turbopackIgnore: true*/ root, ...parts)];
  if (parts.length > 1) candidates.push(path.join(/*turbopackIgnore: true*/ root, parts[parts.length - 1]));

  for (const file of candidates) {
    const resolved = path.resolve(file);
    if (!resolved.startsWith(root)) continue;
    try {
      const info = await stat(resolved);
      if (!info.isFile()) continue;
      const body = await readFile(resolved);
      return new Response(new Uint8Array(body), {
        headers: {
          "Content-Type": TYPES[path.extname(resolved).toLowerCase()] ?? "application/octet-stream",
          "Content-Length": String(info.size),
          "Cache-Control": "public, max-age=2592000, immutable",
        },
      });
    } catch {
      /* try next */
    }
  }
  return new Response("Not found", { status: 404 });
}
