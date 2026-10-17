import type { PropertyDoc, PropertyStatus, PropertyType, TransactionType } from "./types";

export const PROPERTY_TYPES: { value: PropertyType; label: string; plural: string }[] = [
  { value: "shortlet", label: "Shortlet", plural: "Shortlets" },
  { value: "land", label: "Land", plural: "Land" },
  { value: "building", label: "Home", plural: "Homes" },
  { value: "shop", label: "Shop", plural: "Shops" },
  { value: "business_complex", label: "Business Complex", plural: "Business Complexes" },
];

/** Home sub-types for buildings (what people actually search for). */
export const SUBTYPES = [
  { value: "duplex", label: "Duplex" },
  { value: "detached", label: "Detached duplex" },
  { value: "semi_detached", label: "Semi-detached duplex" },
  { value: "terrace", label: "Terrace" },
  { value: "bungalow", label: "Bungalow" },
  { value: "house", label: "House" },
  { value: "flat", label: "Flat / Apartment" },
  { value: "mini_flat", label: "Mini flat" },
  { value: "self_contain", label: "Self-contain" },
  { value: "penthouse", label: "Penthouse" },
  { value: "maisonette", label: "Maisonette" },
] as const;

export const subtypeLabel = (v?: string) => SUBTYPES.find((s) => s.value === v)?.label ?? "";

/** The shared building amenities shown on the listing form and the property page. */
export const PROPERTY_AMENITIES = [
  { key: "furnished", label: "Furnished" },
  { key: "serviced", label: "Serviced" },
  { key: "security", label: "24/7 security" },
  { key: "gatedEstate", label: "Gated estate" },
  { key: "powerSupply", label: "Steady power supply" },
  { key: "solar", label: "Solar / inverter" },
  { key: "borehole", label: "Borehole / water" },
  { key: "fibreInternet", label: "Fibre internet (FTTH)" },
  { key: "cctv", label: "CCTV" },
  { key: "smartAccess", label: "Smart / biometric access" },
  { key: "airConditioning", label: "Air conditioning" },
  { key: "swimmingPool", label: "Swimming pool" },
  { key: "gym", label: "Gym" },
  { key: "elevator", label: "Elevator" },
] as const;

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "lease", label: "For Lease" },
];

// "Abuja" is the stored value for the FCT (matches existing listings); shown as "Abuja (FCT)".
export const NIGERIAN_STATES = [
  "Abuja", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export const SHORTLET_AMENITIES = [
  "wifi", "tv", "air conditioning", "heating", "kitchen", "washer", "dryer", "pool", "gym",
  "parking", "elevator", "pet friendly", "smoking allowed", "workspace", "balcony", "security",
];

export const HOUSE_RULES = [
  "no smoking", "no pets", "no parties", "no loud music", "no visitors", "quiet hours", "no shoes indoors",
];

export const STATUS_META: Record<PropertyStatus, { label: string; tone: string }> = {
  available: { label: "Live", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  pending: { label: "Pending review", tone: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  sold: { label: "Sold", tone: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  rented: { label: "Rented", tone: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  unavailable: { label: "Unavailable", tone: "bg-slate-100 text-slate-600 ring-slate-500/20" },
  rejected: { label: "Rejected", tone: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

export function stateLabel(s?: string) {
  return s === "Abuja" ? "Abuja (FCT)" : s ?? "";
}

export function typeLabel(t?: string) {
  return PROPERTY_TYPES.find((p) => p.value === t)?.label ?? (t ?? "").replace(/_/g, " ");
}

/** What to call a listing in copy: the specific home sub-type when set, else the broad type. */
export function typeDisplay(p?: { propertyType?: string; subtype?: string }) {
  if (p?.propertyType === "building" && p.subtype) return subtypeLabel(p.subtype) || typeLabel(p.propertyType);
  return typeLabel(p?.propertyType);
}

export function txLabel(t?: string) {
  return TRANSACTION_TYPES.find((p) => p.value === t)?.label ?? t ?? "";
}

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

export function formatPrice(n?: number | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "Price on request";
  return naira.format(n);
}

/** ₦45M, ₦1.2B — for cards and stat tiles. */
export function formatCompactPrice(n?: number | null) {
  if (!n) return "₦0";
  if (n >= 1e9) return `₦${trim(n / 1e9)}B`;
  if (n >= 1e6) return `₦${trim(n / 1e6)}M`;
  if (n >= 1e3) return `₦${trim(n / 1e3)}K`;
  return `₦${n}`;
}

function trim(v: number) {
  return v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, "");
}

export function priceSuffix(p: Pick<PropertyDoc, "propertyType" | "transactionType">) {
  if (p.propertyType === "shortlet") return "/ night";
  if (p.transactionType === "rent" || p.transactionType === "lease") return "/ year";
  return "";
}

export function locationLine(loc?: PropertyDoc["location"]) {
  if (!loc) return "Nigeria";
  return [loc.city, loc.state].filter(Boolean).join(", ") || "Nigeria";
}

export function primaryImage(p: Pick<PropertyDoc, "images">) {
  const img = p.images?.find((i) => i.isPrimary) ?? p.images?.[0];
  return img?.url || "/assets/images/og-1200x630.jpg";
}

export function formatDate(d?: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-NG", opts);
}

export function timeAgo(d?: string | Date) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–", "&rsquo;": "’", "&lsquo;": "‘",
  "&rdquo;": "”", "&ldquo;": "“", "&hellip;": "…", "&quot;": '"', "&apos;": "'",
  "&lt;": "<", "&gt;": ">", "&amp;": "&",
};

/** Turn a stored description (which may carry pasted rich-text markup) into clean plain text:
 *  decode HTML entities first — so entity-encoded tags like `&lt;h3&gt;` become real tags —
 *  then strip all tags. Leaving entities undecoded made them show literally (e.g. "Abuja&rsquo;s"). */
export function plainText(html = "", max = 160) {
  const t = html
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(?:nbsp|mdash|ndash|rsquo|lsquo|rdquo|ldquo|hellip|quot|apos|lt|gt|amp);/g, (m) => HTML_ENTITIES[m] ?? m)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

export const NG_PHONE = /^(0|\+234)[7-9][0-1]\d{8}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const BLOG_CATEGORIES = [
  "Market News", "Buying Guide", "Selling Tips", "Renting Advice", "Investment", "Legal Guide", "Agent Tips", "Property Spotlight", "Industry Insights",
];
