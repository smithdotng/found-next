/**
 * Pure date and pricing helpers for Found Apartments. Safe to import on the client
 * (live quote in the booking widget) and the server (the quote that gets saved).
 * Dates are handled as "YYYY-MM-DD" strings and stored as UTC midnight.
 */
import type { ShortletDetails } from "./types";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_COMMISSION = 25;
/**
 * VAT charged to guests on the accommodation total (nightly charges after discounts + cleaning fee).
 * Nigeria's standard rate is 7.5%. Override with NEXT_PUBLIC_VAT_RATE (set 0 to switch VAT off).
 */
export const VAT_RATE = (() => {
  const v = parseFloat(process.env.NEXT_PUBLIC_VAT_RATE ?? "");
  return Number.isFinite(v) && v >= 0 ? v : 7.5;
})();

export function isoDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function parseDay(s?: string | null) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Today's date in Lagos, as a UTC-midnight Date. */
export function todayLagos() {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  return parseDay(s)!;
}

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY_MS);
}

export function nightsBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export type Range = { start: string; end: string }; // end is exclusive (check-out day is free)

/** Every night (YYYY-MM-DD) covered by the given ranges. */
export function nightsSet(ranges: Range[]) {
  const set = new Set<string>();
  for (const r of ranges) {
    const a = parseDay(r.start);
    const b = parseDay(r.end);
    if (!a || !b) continue;
    for (let d = a; d < b; d = addDays(d, 1)) set.add(isoDay(d));
  }
  return set;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export interface Quote {
  nights: number;
  nightlyRate: number;
  weekendRate: number | null;
  weekendNights: number;
  base: number;
  discount: number;
  discountType: "weekly" | "monthly" | null;
  discountPercent: number;
  subtotal: number;
  cleaningFee: number;
  /** Accommodation before VAT: subtotal + cleaning fee. Commission is based on this. */
  net: number;
  vatRate: number;
  vat: number;
  /** What the guest pays: net + VAT (caution fee is separate). */
  total: number;
  securityDeposit: number;
}

/**
 * Same pricing rules as the Express Property.calculatePrice():
 * Fri & Sat nights use the weekend rate when set; 28+ nights get the monthly
 * discount, 7+ the weekly one; cleaning fee is added once; VAT is added on
 * the accommodation total; the caution fee is refundable and shown separately.
 */
export function quoteStay(price: number, sd: ShortletDetails | undefined, checkIn: Date, checkOut: Date, vatRate = VAT_RATE): Quote {
  const nights = Math.max(0, nightsBetween(checkIn, checkOut));
  const weekendRate = sd?.weekendRate ? Number(sd.weekendRate) : null;
  let base = 0;
  let weekendNights = 0;
  for (let i = 0; i < nights; i++) {
    const dow = addDays(checkIn, i).getUTCDay();
    if ((dow === 5 || dow === 6) && weekendRate) {
      base += weekendRate;
      weekendNights++;
    } else base += price;
  }
  let discountPercent = 0;
  let discountType: Quote["discountType"] = null;
  if (nights >= 28 && (sd?.monthlyDiscount ?? 0) > 0) {
    discountPercent = sd!.monthlyDiscount!;
    discountType = "monthly";
  } else if (nights >= 7 && (sd?.weeklyDiscount ?? 0) > 0) {
    discountPercent = sd!.weeklyDiscount!;
    discountType = "weekly";
  }
  const discount = Math.round((base * discountPercent) / 100);
  const subtotal = base - discount;
  const cleaningFee = nights > 0 ? sd?.cleaningFee ?? 0 : 0;
  return {
    nights,
    nightlyRate: price,
    weekendRate,
    weekendNights,
    base,
    discount,
    discountType,
    discountPercent,
    subtotal,
    cleaningFee,
    net: subtotal + cleaningFee,
    vatRate,
    vat: Math.round(((subtotal + cleaningFee) * vatRate) / 100),
    total: subtotal + cleaningFee + Math.round(((subtotal + cleaningFee) * vatRate) / 100),
    securityDeposit: sd?.securityDeposit ?? 0,
  };
}

/** Found's share: a percentage of the accommodation total before VAT (caution fee excluded). */
export function commissionFor(total: number, rate = DEFAULT_COMMISSION) {
  return Math.round((total * rate) / 100);
}

export const BOOKING_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Awaiting host", tone: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  confirmed: { label: "Confirmed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  checked_in: { label: "Checked in", tone: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  checked_out: { label: "Completed", tone: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  declined: { label: "Declined", tone: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  cancelled: { label: "Cancelled", tone: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  expired: { label: "Expired", tone: "bg-slate-100 text-slate-500 ring-slate-500/20" },
  no_show: { label: "No-show", tone: "bg-slate-100 text-slate-500 ring-slate-500/20" },
};

export const HOLDING_STATUSES = ["confirmed", "checked_in"];
export const OPEN_STATUSES = ["pending", "confirmed", "checked_in"];

export const CANCELLATION_POLICIES: Record<string, string> = {
  flexible: "Free cancellation up to 24 hours before check-in.",
  moderate: "Free cancellation up to 5 days before check-in. After that, the first night is non-refundable.",
  strict: "50% refund up to 7 days before check-in. No refund after that.",
  "super strict": "No refunds once the booking is confirmed.",
};

export function stayDates(checkIn: string | Date, checkOut: string | Date) {
  const f = (d: string | Date) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });
  const y = new Date(checkOut).toLocaleDateString("en-NG", { year: "numeric", timeZone: "UTC" });
  return `${f(checkIn)} – ${f(checkOut)} ${y}`;
}
