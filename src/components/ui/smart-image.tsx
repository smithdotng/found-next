import Image, { type ImageProps } from "next/image";

/** next/image that falls back to unoptimized loading for absolute (external) URLs. */
export function SmartImage({ src, alt, ...rest }: Omit<ImageProps, "src"> & { src?: string | null }) {
  const url = src || "/assets/images/og-1200x630.jpg";
  const external = /^https?:\/\//i.test(url);
  return <Image src={url} alt={alt} unoptimized={external || url.endsWith(".gif")} {...rest} />;
}
