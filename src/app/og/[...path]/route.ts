import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { uploadRoot } from "@/lib/uploads";
import { MEDIA_BASE_URL } from "@/lib/media";

/**
 * Social-preview images: /og/uploads/<file> returns that upload as a 1200x630 JPEG served
 * from our own domain. Facebook, WhatsApp, LinkedIn and X fetch this instead of the
 * original photo, so previews get the exact size they expect and never depend on the
 * rate-limited r2.dev host.
 */
export async function GET(_req: Request, ctx: RouteContext<"/og/[...path]">) {
  const { path: parts } = await ctx.params;
  if (parts[0] !== "uploads" || parts.some((p) => p === ".." || p.includes("\\"))) return new Response("Not found", { status: 404 });
  const rel = parts.slice(1).join("/");

  let source: Buffer | null = null;
  try {
    const root = uploadRoot();
    const file = path.resolve(/*turbopackIgnore: true*/ root, rel);
    if (file.startsWith(root)) source = await readFile(file);
  } catch {
    /* not on this server's disk */
  }
  if (!source && MEDIA_BASE_URL) {
    const res = await fetch(`${MEDIA_BASE_URL}/uploads/${parts.slice(1).map(encodeURIComponent).join("/")}`, { cache: "force-cache" });
    if (res.ok) source = Buffer.from(await res.arrayBuffer());
  }
  if (!source) return new Response("Not found", { status: 404 });

  try {
    const jpeg = await sharp(source).rotate().resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.length),
        "Cache-Control": "public, max-age=604800, s-maxage=31536000, immutable",
      },
    });
  } catch {
    return new Response("Unsupported image", { status: 415 });
  }
}
