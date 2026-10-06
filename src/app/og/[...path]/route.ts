import { readFile } from "fs/promises";
import path from "path";
import sharp, { type Sharp } from "sharp";
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
    const jpeg = await toShareImage(source);
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

const W = 1200;
const H = 630;

/**
 * Wide photos are cropped to fill 1200x630. Tall or square images aren't cropped (that cuts
 * off heads): the whole image is shown, over a blurred copy of itself for photos, or over a
 * light background for cut-outs with transparency (trimmed of empty space first).
 */
async function toShareImage(source: Buffer) {
  const img = sharp(source).rotate();
  const meta = await img.metadata();
  const width = meta.autoOrient?.width ?? meta.width ?? W;
  const height = meta.autoOrient?.height ?? meta.height ?? H;
  const jpeg = (s: Sharp) => s.jpeg({ quality: 82, mozjpeg: true }).toBuffer();

  if (meta.hasAlpha) {
    const trimmed = await sharp(source).rotate().trim().toBuffer();
    const fg = await sharp(trimmed).resize(W - 160, H - 60, { fit: "inside" }).toBuffer();
    return jpeg(sharp({ create: { width: W, height: H, channels: 3, background: "#eef4f9" } }).composite([{ input: fg, gravity: "center" }]));
  }
  if (width / height >= 1.3) {
    return jpeg(img.resize(W, H, { fit: "cover", position: "attention" }));
  }
  const [bg, fg] = await Promise.all([
    sharp(source).rotate().resize(W, H, { fit: "cover" }).blur(28).modulate({ brightness: 0.75 }).toBuffer(),
    sharp(source).rotate().resize(W - 80, H, { fit: "inside" }).toBuffer(),
  ]);
  return jpeg(sharp(bg).composite([{ input: fg, gravity: "center" }]));
}
