import Image, { type ImageProps } from "next/image";
import { MEDIA_BASE_URL, mediaUrl } from "@/lib/media";

/**
 * next/image that serves uploads from the media host (Cloudflare R2) when configured,
 * and falls back to unoptimized loading for other absolute (external) URLs.
 */
export function SmartImage({ src, alt, ...rest }: Omit<ImageProps, "src"> & { src?: string | null }) {
  const url = mediaUrl(src || "/assets/images/og-1200x630.jpg");
  const external = /^https?:\/\//i.test(url) && !(MEDIA_BASE_URL && url.startsWith(MEDIA_BASE_URL));
  return <Image src={url} alt={alt} unoptimized={external || url.endsWith(".gif")} {...rest} />;
}
