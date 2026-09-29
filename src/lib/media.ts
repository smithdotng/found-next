/**
 * Where uploaded photos are served from.
 *
 * Photo URLs are stored in MongoDB as "/uploads/<file>" (shared with the Express app).
 * When NEXT_PUBLIC_MEDIA_BASE_URL is set (e.g. https://media.found.ng or a pub-xxxx.r2.dev URL),
 * those paths are served from Cloudflare R2 instead of the app server. Client-safe.
 */
export const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").trim().replace(/\/+$/, "");

/** Maps a stored "/uploads/..." path to its public URL; leaves every other URL untouched. */
export function mediaUrl<T extends string | null | undefined>(url: T): T {
  if (!url || !MEDIA_BASE_URL || !url.startsWith("/uploads/")) return url;
  // The Express realtor form stored "/uploads/properties/<file>" but saved the file as "/uploads/<file>".
  const path = url.startsWith("/uploads/properties/") ? url.replace("/uploads/properties/", "/uploads/") : url;
  return `${MEDIA_BASE_URL}${path}` as T;
}
