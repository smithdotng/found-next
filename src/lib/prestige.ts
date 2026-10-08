/**
 * Found Prestige: a curated, Verified-only collection of high-value property for
 * private clients, plus a concierge request flow. Shared by the public page,
 * the server actions and the admin view.
 */

/** Minimum asking price (sale/lease) for a listing to qualify, by state. */
export const PRESTIGE_SALE_MIN: Record<string, number> = { Lagos: 500_000_000, Abuja: 300_000_000 };
export const PRESTIGE_SALE_MIN_DEFAULT = 250_000_000;
/** Minimum annual rent for a rental to qualify, by state. */
export const PRESTIGE_RENT_MIN: Record<string, number> = { Lagos: 40_000_000, Abuja: 25_000_000 };
export const PRESTIGE_RENT_MIN_DEFAULT = 20_000_000;

/**
 * Mongo query for the Prestige collection: live, Verified, not a shortlet, and either
 * hand-picked by Found (prestige: true) or above the price threshold for its state.
 */
export function prestigeQuery(now = new Date()) {
  const states = Array.from(new Set([...Object.keys(PRESTIGE_SALE_MIN), ...Object.keys(PRESTIGE_RENT_MIN)]));
  const sale = ["sale", "lease"];
  const byPrice = [
    ...states.map((st) => ({ "location.state": st, transactionType: { $in: sale }, price: { $gte: PRESTIGE_SALE_MIN[st] ?? PRESTIGE_SALE_MIN_DEFAULT } })),
    ...states.map((st) => ({ "location.state": st, transactionType: "rent", price: { $gte: PRESTIGE_RENT_MIN[st] ?? PRESTIGE_RENT_MIN_DEFAULT } })),
    { "location.state": { $nin: states }, transactionType: { $in: sale }, price: { $gte: PRESTIGE_SALE_MIN_DEFAULT } },
    { "location.state": { $nin: states }, transactionType: "rent", price: { $gte: PRESTIGE_RENT_MIN_DEFAULT } },
  ];
  return {
    status: "available",
    propertyType: { $ne: "shortlet" },
    "verification.verified": true,
    $and: [
      { $or: [{ "verification.until": null }, { "verification.until": { $exists: false } }, { "verification.until": { $gt: now } }] },
      { $or: [{ prestige: true }, ...byPrice] },
    ],
  };
}

/** Same rule as prestigeQuery, for a single listing (verification is checked separately). */
export function meetsPrestige(p: { prestige?: boolean; propertyType?: string; transactionType?: string; price?: number; location?: { state?: string } }) {
  if (p.propertyType === "shortlet") return false;
  if (p.prestige) return true;
  const st = p.location?.state ?? "";
  const min = p.transactionType === "rent" ? PRESTIGE_RENT_MIN[st] ?? PRESTIGE_RENT_MIN_DEFAULT : PRESTIGE_SALE_MIN[st] ?? PRESTIGE_SALE_MIN_DEFAULT;
  return (p.price ?? 0) >= min;
}

export const CLIENT_INTERESTS = [
  { value: "buy_home", label: "Buy a home" },
  { value: "invest", label: "Invest (income or capital growth)" },
  { value: "rent", label: "Rent a premium home" },
  { value: "sell", label: "Sell or let a premium property" },
  { value: "land", label: "Land or development" },
] as const;

export const BUDGET_BANDS = [
  { value: "100-300m", label: "₦100m – ₦300m" },
  { value: "300-750m", label: "₦300m – ₦750m" },
  { value: "750m-2b", label: "₦750m – ₦2bn" },
  { value: "2b+", label: "Above ₦2bn" },
  { value: "usd", label: "Prefer to discuss in USD / GBP" },
] as const;

export const TIMELINES = [
  { value: "now", label: "Ready now" },
  { value: "3m", label: "Within 3 months" },
  { value: "12m", label: "Within 12 months" },
  { value: "exploring", label: "Exploring" },
] as const;

export const PAYMENT_ROUTES = [
  { value: "cash", label: "Cash / own funds" },
  { value: "abroad", label: "Funds from abroad" },
  { value: "mortgage", label: "Mortgage or bank financing" },
  { value: "plan", label: "Developer payment plan" },
  { value: "company", label: "Company purchase" },
] as const;

export const PRESTIGE_LOCATIONS = ["Maitama", "Asokoro", "Guzape", "Wuse 2", "Katampe", "Ikoyi", "Banana Island", "Victoria Island", "Eko Atlantic", "Lekki Phase 1", "Other"] as const;

export const CLIENT_STATUS: Record<string, { label: string; tone: string }> = {
  new: { label: "New", tone: "bg-coral-50 text-coral-700 ring-coral-600/20" },
  contacted: { label: "Contacted", tone: "bg-brand-50 text-brand-700 ring-brand-600/20" },
  qualified: { label: "Qualified", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  closed: { label: "Closed", tone: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};

export const labelOf = (list: readonly { value: string; label: string }[], v?: string) => list.find((x) => x.value === v)?.label ?? v ?? "";
