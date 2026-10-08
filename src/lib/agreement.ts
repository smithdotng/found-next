import { PAYOUT_DAYS, PAY_WITHIN_HOURS } from "./stay";

/** The Found Apartments host listing agreement. Bump the version when the wording changes. */
export const AGREEMENT_VERSION = "2026-10";

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
      title: "3. Bookings",
      body: "Guests send booking requests through Found. The Host accepts or declines each request within 24 hours, and a request not answered within 48 hours may expire. The Host keeps the calendar up to date so accepted dates are not double-booked.",
    },
    {
      title: "4. Guest payments go to Found",
      body: `Every guest pays Found, never the Host. Once the Host accepts a request, Found sends the guest its payment details and the guest pays Found the full booking total (accommodation plus VAT) and the refundable caution fee, usually within ${PAY_WITHIN_HOURS} hours. A stay is secured only when Found confirms that payment has been received, and Found will tell the Host when it has. The Host must not ask for or accept payment from a guest introduced through Found, whether for the booking, an extension or a repeat stay within 12 months of the first booking. If a guest offers to pay the Host directly, the Host refers them to Found.`,
    },
    {
      title: `5. Found's commission — ${opts.rate}%`,
      body: `Found's commission is ${opts.rate}% of the accommodation total of each stay (nightly charges after discounts, plus any cleaning fee), before VAT. The caution fee is not commissionable. Found keeps its commission from the guest's payment, so the Host never has to pay Found separately.`,
    },
    {
      title: "6. VAT",
      body: "Guest prices on Found include VAT at the prevailing rate on the accommodation total. Found collects the VAT from the guest and accounts for and remits it to the tax authority. The VAT is not part of the Host's payout. The Host remains responsible for its own taxes on the income it receives.",
    },
    {
      title: "7. Payouts to the Host",
      body: `For each stay, Found remits to the Host the amount the guest paid, less Found's commission and the VAT. In other words, the Host receives the accommodation total minus ${opts.rate}%. Found pays the Host by bank transfer to the account the Host has given Found, within ${PAYOUT_DAYS} working days after the guest checks in, and the Host can see each payout and its status on the dashboard. Found may hold a payout while a serious guest complaint, a safety issue or a dispute about the stay is investigated, and will tell the Host why.`,
    },
    {
      title: "8. Caution fees, cancellations and refunds",
      body: "Found holds the guest's caution fee during the stay. The Host reports any damage, with photos, within 48 hours of check-out. Found refunds the guest within 7 days of check-out, less any documented damage, and pays the Host for the damage. Cancellations follow the policy shown on the listing. Found refunds the guest whatever that policy allows, and the Host receives a payout only on any non-refundable part, less commission. If the Host cancels a paid booking, the guest receives a full refund, and Found may help them rebook elsewhere and pause the Host's listings if cancellations recur.",
    },
    {
      title: "9. Guest care",
      body: "The Host provides the apartment as listed: clean, safe, with working utilities and the stated amenities. The Host confirms each check-in and check-out on the dashboard and resolves guest issues promptly.",
    },
    {
      title: "10. Term and ending",
      body: "This agreement starts on acceptance and continues until either party ends it with 14 days' written notice. Paid bookings made before the end date must still be honoured, and Found will settle the payouts on them as normal.",
    },
    {
      title: "11. Changes",
      body: "Found will give 30 days' notice of any change to the commission rate or these terms, and the Host will be asked to accept the updated agreement.",
    },
  ];
}
