/** The Found Apartments host listing agreement. Bump the version when the wording changes. */
export const AGREEMENT_VERSION = "2026-09";

export function agreementSections(opts: { rate: number; hostName: string; businessName?: string }) {
  const party = opts.businessName ? `${opts.hostName} (trading as ${opts.businessName})` : opts.hostName;
  return [
    {
      title: "1. Parties",
      body: `This agreement is between Found Projects & Realty Limited ("Found") and ${party} ("the Host"). It covers every shortlet apartment the Host lists on Found Apartments.`,
    },
    {
      title: "2. Listing and vetting",
      body: "Found reviews every apartment before it goes live and may inspect it. The Host confirms they own each apartment or are authorised to let it, and that photos, prices, amenities and house rules are accurate. Found may pause or remove a listing that is misleading, unsafe or in breach of this agreement.",
    },
    {
      title: `3. Found's commission — ${opts.rate}%`,
      body: `For every stay booked through Found Apartments, the Host pays Found ${opts.rate}% of the accommodation total (nightly charges after discounts, plus any cleaning fee), before VAT. VAT and the refundable caution fee are excluded. Commission is due once the guest checks in and must be paid within 7 days of check-out. It applies to any guest introduced through Found, including repeat or extended stays arranged directly within 12 months of the first booking.`,
    },
    {
      title: "4. Bookings and payment",
      body: "Guests send booking requests through Found. The Host accepts or declines each request within 24 hours, and a request not answered within 48 hours may expire. Once a request is accepted, the Host collects payment from the guest directly and records it on the dashboard. Guest prices on Found include VAT at the prevailing rate; the Host is responsible for accounting for and remitting the VAT collected, as required by Nigerian tax law. The Host keeps the calendar up to date so accepted dates are not double-booked.",
    },
    {
      title: "5. Guest care",
      body: "The Host provides the apartment as listed: clean, safe, with working utilities and the stated amenities. The Host honours the cancellation policy shown on the listing and resolves guest issues promptly. Caution fees are refunded within 7 days of check-out, less documented damage.",
    },
    {
      title: "6. Term and ending",
      body: "This agreement starts on acceptance and continues until either party ends it with 14 days' written notice. Confirmed bookings made before the end date must still be honoured, and commission on them remains payable.",
    },
    {
      title: "7. Changes",
      body: "Found will give 30 days' notice of any change to the commission rate or these terms, and the Host will be asked to accept the updated agreement.",
    },
  ];
}
