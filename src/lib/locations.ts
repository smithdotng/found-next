import { NIGERIAN_STATES } from "./format";

/** URL-safe slug: "Wuse 2" -> "wuse-2", "Port Harcourt" -> "port-harcourt". */
export const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const STATE_BY_SLUG = new Map(NIGERIAN_STATES.map((s) => [slugify(s), s] as const));

/** Canonical state name for a URL slug ("abuja" -> "Abuja"), or undefined if unknown. */
export const stateFromSlug = (slug: string) => STATE_BY_SLUG.get(slugify(slug));

/** The /<state>/<area> path for a listing's location. */
export const areaPath = (state?: string, city?: string) =>
  state && city ? `/${slugify(state)}/${slugify(city)}` : undefined;
