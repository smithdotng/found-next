import { readFile, stat } from "fs/promises";
import path from "path";
import { uploadRoot } from "@/lib/uploads";
import { MEDIA_BASE_URL } from "@/lib/media";

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
 * Serves user uploads from the shared uploads folder at request time, or redirects to the
 * media host (NEXT_PUBLIC_MEDIA_BASE_URL) when the file isn't on this server
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
  // Not on this server's disk: send the browser to the media host (Cloudflare R2), where
  // uploads live once storage is configured. Old "/uploads/properties/<file>" links map to "/uploads/<file>".
  if (MEDIA_BASE_URL) {
    const rel = parts.length > 1 && parts[0] === "properties" ? parts.slice(1) : parts;
    return Response.redirect(`${MEDIA_BASE_URL}/uploads/${rel.map(encodeURIComponent).join("/")}`, 308);
  }
  return new Response("Not found", { status: 404 });
}
