// Found Fractional: constants and maths shared by pages, actions and emails (no server imports).

export const RESERVATION_HOURS = 48;
/** Retail investors may put at most this % of declared annual income into offerings per 12 months. Confirm with SEC counsel. */
export const RETAIL_ANNUAL_LIMIT_PERCENT = Number(process.env.NEXT_PUBLIC_FRACTIONAL_RETAIL_LIMIT ?? 10);
export const DEFAULT_FEES = { platform: 5, investor: 1, management: 10, resale: 2 };

export type OfferingStatus = "draft" | "in_review" | "changes_requested" | "live" | "funded" | "active" | "exited" | "cancelled";
export type OrderStatus = "pending_payment" | "payment_submitted" | "confirmed" | "cancelled" | "expired" | "refunded";
export type KycStatus = "none" | "pending" | "approved" | "rejected";

export interface OfferingDoc {
  _id: string;
  title: string;
  slug: string;
  developer: string | { _id: string; name: string; email?: string; phone?: string; developerProfile?: { company?: string; rcNumber?: string; website?: string; projectsCompleted?: number; status?: string } };
  summary?: string;
  description?: string;
  assetType: "residential" | "commercial" | "mixed_use" | "land" | "shortlet";
  stage: "off_plan" | "income";
  returnTypes: ("capital_growth" | "rental_income")[];
  location: { address?: string; city?: string; state?: string; lga?: string };
  images: string[];
  videoUrl?: string;
  documents: { _id: string; key: string; name?: string; label?: string; contentType?: string; size?: number; uploadedAt?: string }[];
  spv?: { name?: string; rcNumber?: string; trustee?: string; titleDocument?: string };
  paymentAccount?: { bankName?: string; accountName?: string; accountNumber?: string };
  totalValue: number;
  totalUnits: number;
  unitPrice: number;
  minUnits: number;
  maxUnitsPerInvestor?: number | null;
  softCapPercent: number;
  unitsReserved: number;
  unitsSold: number;
  opensAt?: string;
  closesAt?: string;
  projections?: { rentalYield?: number; appreciation?: number; holdMonths?: number; completionDate?: string; payoutFrequency?: string; exitStrategy?: string };
  risk: "low" | "moderate" | "high";
  riskNotes?: string;
  fees: { platform: number; investor: number; management: number; resale: number };
  resaleEnabled: boolean;
  currentUnitValue?: number;
  valuationDate?: string;
  status: OfferingStatus;
  reviewNote?: string;
  goLiveAt?: string;
  fundedAt?: string;
  closedAt?: string;
  featured?: boolean;
  views?: number;
  updates: { _id: string; title: string; body?: string; progress?: number; image?: string; createdAt: string }[];
  history?: { status: string; at: string; by?: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderDoc {
  _id: string;
  reference: string;
  offering: string | Pick<OfferingDoc, "_id" | "title" | "slug" | "images" | "paymentAccount" | "status">;
  offeringTitle?: string;
  investor: string | { _id: string; name: string; email: string; phone?: string; investorProfile?: { kycStatus?: KycStatus; category?: string } };
  source: "primary" | "resale";
  resale?: string;
  seller?: string | { _id: string; name: string; email?: string };
  units: number;
  unitPrice: number;
  amount: number;
  fee: number;
  total: number;
  status: OrderStatus;
  expiresAt?: string;
  payment?: { payerName?: string; reference?: string; paidOn?: string; proofImage?: string; submittedAt?: string; confirmedAt?: string };
  refund?: { amount?: number; reference?: string; at?: string; reason?: string };
  sellerPayout?: { amount?: number; fee?: number; status?: "not_due" | "due" | "paid"; paidAt?: string; reference?: string };
  note?: string;
  createdAt: string;
}

export const STAGE_LABEL = { off_plan: "Off-plan · capital growth", income: "Income-generating" } as const;
export const ASSET_LABEL: Record<OfferingDoc["assetType"], string> = {
  residential: "Residential",
  commercial: "Commercial",
  mixed_use: "Mixed use",
  land: "Land",
  shortlet: "Shortlet apartments",
};
export const PAYOUT_LABEL: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Twice a year",
  annual: "Yearly",
  on_exit: "On sale (exit)",
};
export const RISK_META = {
  low: { label: "Lower risk", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  moderate: { label: "Moderate risk", tone: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  high: { label: "Higher risk", tone: "bg-rose-50 text-rose-700 ring-rose-600/20" },
} as const;

export const OFFERING_STATUS: Record<OfferingStatus, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-slate-100 text-slate-600 ring-slate-500/20" },
  in_review: { label: "In review", tone: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  changes_requested: { label: "Changes requested", tone: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  live: { label: "Open for investment", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  funded: { label: "Fully funded", tone: "bg-brand-50 text-brand-700 ring-brand-600/20" },
  active: { label: "Raise closed · active", tone: "bg-brand-50 text-brand-700 ring-brand-600/20" },
  exited: { label: "Exited", tone: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  cancelled: { label: "Cancelled", tone: "bg-slate-100 text-slate-500 ring-slate-500/20" },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  pending_payment: { label: "Awaiting payment", tone: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  payment_submitted: { label: "Payment being checked", tone: "bg-brand-50 text-brand-700 ring-brand-600/20" },
  confirmed: { label: "Confirmed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  cancelled: { label: "Cancelled", tone: "bg-slate-100 text-slate-600 ring-slate-500/20" },
  expired: { label: "Expired", tone: "bg-slate-100 text-slate-500 ring-slate-500/20" },
  refunded: { label: "Refunded", tone: "bg-slate-100 text-slate-700 ring-slate-500/20" },
};

export const KYC_STATUS: Record<KycStatus, { label: string; tone: string }> = {
  none: { label: "Not started", tone: "bg-slate-100 text-slate-600 ring-slate-500/20" },
  pending: { label: "Under review", tone: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  approved: { label: "Verified", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  rejected: { label: "Needs attention", tone: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

export const INVESTOR_CATEGORY = {
  retail: { label: "Retail investor", text: `Most people. You can invest up to ${RETAIL_ANNUAL_LIMIT_PERCENT}% of your annual income in a 12-month period.` },
  sophisticated: { label: "Sophisticated investor", text: "You have investment experience and understand the risks of unlisted property investments." },
  hnw: { label: "High-net-worth investor", text: "You have substantial net assets or income and can bear the loss of your investment." },
} as const;

/** Offerings people can currently buy units in from the developer. */
export const OPEN_STATUSES: OfferingStatus[] = ["live"];
/** Offerings shown on the public site. */
export const PUBLIC_STATUSES: OfferingStatus[] = ["live", "funded", "active", "exited"];
/** Offerings whose units can be traded between investors. */
export const TRADABLE_STATUSES: OfferingStatus[] = ["funded", "active"];

export const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 1000) / 10) : 0);

export function unitsAvailable(o: Pick<OfferingDoc, "totalUnits" | "unitsSold" | "unitsReserved">) {
  return Math.max(0, o.totalUnits - o.unitsSold - o.unitsReserved);
}

export function fundingProgress(o: Pick<OfferingDoc, "totalUnits" | "unitsSold" | "unitsReserved" | "unitPrice" | "softCapPercent">) {
  return {
    soldPct: pct(o.unitsSold, o.totalUnits),
    reservedPct: pct(o.unitsReserved, o.totalUnits),
    raised: o.unitsSold * o.unitPrice,
    target: o.totalUnits * o.unitPrice,
    softCapUnits: Math.ceil((o.totalUnits * o.softCapPercent) / 100),
    softCapMet: o.unitsSold >= Math.ceil((o.totalUnits * o.softCapPercent) / 100),
  };
}

/** True while an offering is accepting primary investments right now. */
export function isOpen(o: Pick<OfferingDoc, "status" | "opensAt" | "closesAt" | "totalUnits" | "unitsSold" | "unitsReserved">, now = Date.now()) {
  if (o.status !== "live") return false;
  if (o.opensAt && new Date(o.opensAt).getTime() > now) return false;
  if (o.closesAt && new Date(o.closesAt).getTime() < now) return false;
  return unitsAvailable(o) > 0;
}

/** A live offering whose opening date hasn't arrived yet. */
export function opensLater(o: Pick<OfferingDoc, "status" | "opensAt">, now = Date.now()) {
  return o.status === "live" && !!o.opensAt && new Date(o.opensAt).getTime() > now;
}

export function daysLeft(closesAt?: string | Date) {
  if (!closesAt) return null;
  return Math.max(0, Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86_400_000));
}

/** Price breakdown for buying units from the developer. */
export function primaryQuote(unitPrice: number, units: number, feePercent: number) {
  const amount = unitPrice * units;
  const fee = Math.round((amount * feePercent) / 100);
  return { amount, fee, total: amount + fee };
}

/** Seller's side of a secondary sale: Found's resale fee comes out of the proceeds. */
export function resaleProceeds(pricePerUnit: number, units: number, feePercent: number) {
  const gross = pricePerUnit * units;
  const fee = Math.round((gross * feePercent) / 100);
  return { gross, fee, net: gross - fee };
}

/** What the developer receives from a fully or partly funded raise. */
export function developerProceeds(raised: number, platformPercent: number) {
  const fee = Math.round((raised * platformPercent) / 100);
  return { raised, fee, net: raised - fee };
}

/**
 * Illustrative returns on an investment, using the offering's targets.
 * Rental income is after Found's management fee. Not a promise: shown with a disclaimer.
 */
export function projectReturns(
  invested: number,
  p: { rentalYield?: number; appreciation?: number; holdMonths?: number; managementFee?: number },
) {
  const years = (p.holdMonths ?? 36) / 12;
  const netYield = ((p.rentalYield ?? 0) * (100 - (p.managementFee ?? 0))) / 100;
  const income = Math.round(invested * (netYield / 100) * years);
  const endValue = Math.round(invested * Math.pow(1 + (p.appreciation ?? 0) / 100, years));
  const growth = endValue - invested;
  const total = income + growth;
  return { years, netYield, income, growth, endValue, total, totalPct: invested ? Math.round((total / invested) * 1000) / 10 : 0 };
}

/** Splits a distribution across holders pro rata, putting rounding remainders on the largest holder. */
export function splitDistribution(net: number, holders: { investor: string; units: number }[]) {
  const units = holders.reduce((a, h) => a + h.units, 0);
  if (!units) return { perUnit: 0, lines: [] as { investor: string; units: number; amount: number }[] };
  const perUnit = net / units;
  const lines = holders.map((h) => ({ investor: h.investor, units: h.units, amount: Math.floor(perUnit * h.units) }));
  const remainder = net - lines.reduce((a, l) => a + l.amount, 0);
  if (remainder && lines.length) {
    const top = lines.reduce((m, l) => (l.units > m.units ? l : m), lines[0]);
    top.amount += remainder;
  }
  return { perUnit: Math.round(perUnit * 100) / 100, lines };
}
