// Verification plans and the payment account. Shared by the public page, dashboard and emails.

export const VERIFICATION_PLANS = {
  property: {
    key: "property",
    name: "Property verification",
    price: 50_000,
    unit: "per property",
    summary: "Verify individual listings. Each verified property carries the Verified by Found badge.",
  },
  annual: {
    key: "annual",
    name: "Verified realtor",
    price: 150_000,
    unit: "per year",
    summary: "Get verified as a realtor. Every listing you publish is automatically verified for 12 months.",
  },
} as const;

export type VerificationPlan = keyof typeof VERIFICATION_PLANS;

export const PAYMENT_ACCOUNT = {
  accountName: "Found Projects & Realty Limited",
  accountNumber: "1228640735",
  bank: "Zenith Bank",
};

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const oneYearFrom = (d = new Date()) => new Date(d.getTime() + YEAR_MS);

type VerifiableProperty = { verification?: { verified?: boolean; until?: string | Date | null } | null };
type VerifiableRealtor = { verified?: boolean; verifiedUntil?: string | Date | null } | null | undefined;

const live = (until?: string | Date | null) => !until || new Date(until).getTime() > Date.now();

/** True when a listing should show the Verified by Found badge. */
export function isPropertyVerified(p: VerifiableProperty) {
  return Boolean(p.verification?.verified && live(p.verification.until));
}

/** True when a realtor's annual verification is active. */
export function isRealtorVerified(r: VerifiableRealtor) {
  return Boolean(r?.verified && live(r.verifiedUntil));
}
