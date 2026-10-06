import { MEDIA_BASE_URL, mediaUrl } from "./media";
import type { Metadata } from "next";

export const SITE_NAME = "Found Properties";
export const COMPANY = "Found Projects & Realty Limited";
export const DEFAULT_TITLE = "Found Projects & Realty Limited - Nigeria's Premier Property Platform";
export const DEFAULT_DESCRIPTION =
  "Find your dream property in Nigeria. Browse thousands of verified listings including shortlets, land, buildings, shops, and business complexes. Fair commissions capped at 10%.";
export const DEFAULT_KEYWORDS =
  "property, real estate, nigeria, lagos, abuja, port harcourt, rent, sale, shortlet, land, building, shop, business complex, realtor, agent";
export const DEFAULT_OG_IMAGE = "/assets/images/og-1200x630.jpg";

/**
 * Public site address. Accepts BASE_URL with or without a scheme ("found.ng" or
 * "https://found.ng"); falls back to the Vercel deployment URL, then https://found.ng.
 */
export function siteUrl() {
  const raw = (process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "found.ng").trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `${/^(localhost|127\.|\[::1\])/.test(raw) ? "http" : "https"}://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return "https://found.ng";
  }
}

export function absoluteUrl(path = "/") {
  path = mediaUrl(path);
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

interface PageSeo {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  keywords?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  /** Use the title verbatim instead of applying the "| Found Properties" template. */
  absoluteTitle?: boolean;
}

/**
 * Every page builds its metadata through this helper so the same Open Graph and
 * Twitter tags the EJS header emitted (og:type, og:url, og:title, og:description,
 * og:image + 1200x630 dims, og:site_name, og:locale=en_NG, twitter:card=summary_large_image …)
 * appear on every route. Next.js merges metadata shallowly, so openGraph/twitter
 * are always returned in full rather than relying on the root layout.
 */
/**
 * The share image for a page. User uploads (listing, blog and project photos) go through
 * /og/uploads/..., which serves a 1200x630 JPEG from our own domain; site assets are used as-is.
 */
const OG_VERSION = 2;

export function ogImageUrl(src?: string | null) {
  const img = src || DEFAULT_OG_IMAGE;
  const uploads = img.match(/\/uploads\/(?:properties\/)?(.+)$/);
  const isUpload = img.startsWith("/uploads/") || Boolean(MEDIA_BASE_URL && img.startsWith(MEDIA_BASE_URL + "/uploads/"));
  // Bump OG_VERSION whenever /og rendering changes: the images are cached long-term by URL.
  if (isUpload && uploads) return `${siteUrl()}/og/uploads/${uploads[1]}?v=${OG_VERSION}`;
  return absoluteUrl(img);
}

export function pageMetadata(seo: PageSeo): Metadata {
  const description = seo.description || DEFAULT_DESCRIPTION;
  const image = ogImageUrl(seo.image);
  const url = absoluteUrl(seo.path);
  const isDefaultImage = !seo.image || seo.image === DEFAULT_OG_IMAGE;
  const images = [
    {
      url: image,
      width: 1200,
      height: 630,
      alt: seo.imageAlt || seo.title,
      type: isDefaultImage || image.includes("/og/uploads/") ? "image/jpeg" : undefined,
    },
  ];

  return {
    title: seo.absoluteTitle ? { absolute: seo.title } : seo.title,
    description,
    keywords: seo.keywords || DEFAULT_KEYWORDS,
    alternates: { canonical: url },
    robots: seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: seo.type || "website",
      url,
      title: seo.title,
      description,
      siteName: SITE_NAME,
      locale: "en_NG",
      images,
      ...(seo.type === "article" && seo.publishedTime ? { publishedTime: seo.publishedTime } : {}),
      ...(seo.type === "article" && seo.modifiedTime ? { modifiedTime: seo.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description,
      images: [image],
      site: "@foundproperties",
      creator: "@foundproperties",
    },
  };
}
