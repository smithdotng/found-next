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

/* ===================== Agent referral agreement ===================== */

/** Bump when the agent agreement wording changes. */
export const AGENT_AGREEMENT_VERSION = "2026-11";

/** Split of the agency fee actually collected on a completed, referred transaction. */
export const AGENT_COMMISSION_PCT = 70; // the referring agent's share
export const AGENT_PROMOTER_PCT = 10; // the listing realtor's share
export const FOUND_PLATFORM_PCT = 20; // Found's share
/** Administrative fee Found charges on every agent payout. */
export const AGENT_ADMIN_FEE_PCT = 10;
/** Withholding tax deducted at source on commissions (current Nigerian statutory rate). */
export const AGENT_WHT_PCT = 5;
/** Agents are paid within one week of a concluded, fee-received transaction. */
export const AGENT_PAYOUT_DAYS = 7;

export function agentAgreementSections(opts: { agentName?: string; businessName?: string } = {}) {
  const party = opts.agentName
    ? opts.businessName
      ? `${opts.agentName} (trading as ${opts.businessName})`
      : opts.agentName
    : "the Agent";
  return [
    {
      title: "1. Parties and purpose",
      body: `This agreement is between Found Projects & Realty Limited ("Found") and ${party} ("the Agent"). It governs the Agent's participation in the Found agent referral programme, under which the Agent refers prospective buyers and tenants to listings authorised for marketing on found.ng and earns a share of the agency fee on completed transactions.`,
    },
    {
      title: "2. Appointment",
      body: "Found appoints the Agent as a non-exclusive, independent referral agent. The appointment is non-exclusive and gives no territorial exclusivity. The Agent has no authority to bind Found, to agree prices or terms on Found's behalf, to collect any money from any party, or to hold itself out as Found's employee, partner or exclusive representative.",
    },
    {
      title: "3. The Agent's obligations",
      body: "The Agent will promote only authorised, live listings using the tracked links and marketing materials Found provides or approves; will not alter the approved price, description or photographs of any listing; and will make no representation about a property, its documentation or its verification status that Found has not authorised in writing. The Agent will not advertise any listing, or describe any property as verified, until it has Found's approved materials and written authorisation.",
    },
    {
      title: "4. No handling of client funds",
      body: "The Agent will not collect or receive any deposit, part-payment, booking fee or other property-related funds from any buyer, tenant or third party. All payments are made to Found. The Agent will route all enquiries, inspections and negotiations through Found, and will not complete or settle any transaction off-platform so as to bypass Found or avoid the agency fee.",
    },
    {
      title: "5. Referral tracking and attribution",
      body: "For each listing the Agent promotes, Found generates a unique tracked referral link and QR code tied to the Agent's account. A referral is registered when a prospect reaches the listing through the Agent's link and is recorded, with a timestamp, in the Agent dashboard. Where more than one agent claims the same prospect, the referral is attributed to the Agent whose link was first recorded for that prospect and listing. Found's records are, absent manifest error, conclusive.",
    },
    {
      title: `6. Commission — ${AGENT_COMMISSION_PCT}% of the agency fee`,
      body: `On each completed transaction arising from the Agent's recorded referral, the agency fee Found actually collects (capped at 10% of the transaction value) is shared: Agent ${AGENT_COMMISSION_PCT}%, listing realtor ${AGENT_PROMOTER_PCT}%, Found ${FOUND_PLATFORM_PCT}%. Commission is calculated on the agency fee actually collected, not on the property price, and is payable only where the transaction both originates from the Agent's recorded referral and completes through Found.`,
    },
    {
      title: "7. Deductions and payment",
      body: `From the Agent's gross commission (${AGENT_COMMISSION_PCT}% of the agency fee) Found deducts (a) an administrative fee of ${AGENT_ADMIN_FEE_PCT}%, which Found charges on all payouts, and (b) withholding tax at the applicable statutory rate (currently ${AGENT_WHT_PCT}% on commissions), which Found remits to the relevant tax authority with a credit note to the Agent. Found pays the net commission to the Agent's nominated bank account within one week (${AGENT_PAYOUT_DAYS} days) of the transaction being concluded and the agency fee received. There is no minimum payout threshold.`,
    },
    {
      title: "8. Taxes",
      body: `Commission is subject to withholding tax under Nigerian law, currently ${AGENT_WHT_PCT}% on commissions, deducted at source and remitted by Found. Where the Agent has not provided a valid Tax Identification Number (TIN), a higher rate may apply as required by law. If the statutory rate changes, Found applies the rate then in force. The Agent remains responsible for any further taxes on its income.`,
    },
    {
      title: "9. Registration and identification",
      body: "Registration as an agent is free. An individual may apply without first registering a company. The Agent provides its contact details, a valid government-issued means of identification — International Passport, National Identification Number (NIN), or Driver's Licence — its bank details for payout, and, where available, its TIN. Found may carry out identity and compliance checks and may decline or suspend any registration.",
    },
    {
      title: "10. Verification and activation",
      body: "The Agent's account is verified and activated — and tracked referral links can be generated — only after Found has reviewed the Agent's details and the Agent has signed this agreement. Found may suspend an account pending re-verification.",
    },
    {
      title: "11. Term and termination",
      body: "This agreement starts on acceptance and continues until terminated by either party on 7 days' written notice. Found may suspend or terminate immediately for breach of clauses 3 to 5, fraud, or conduct harming buyers, tenants, sellers or Found's reputation. Commission already earned on transactions concluded before termination remains payable.",
    },
    {
      title: "12. Confidentiality and data protection",
      body: "Each party keeps the other's non-public information confidential. The Agent handles any personal data of prospects in accordance with the Nigeria Data Protection Act, only as needed to make referrals, and will not misuse, over-retain or sell such data.",
    },
    {
      title: "13. Status, liability and governing law",
      body: "The Agent is an independent contractor; nothing here creates employment, partnership or joint venture. Found is not liable for indirect or consequential loss, and its total liability under this agreement is limited to the commission paid or payable to the Agent in the six months before a claim. The Agent indemnifies Found against losses arising from the Agent's breach of this agreement, misrepresentation to any prospect, or breach of law. This agreement is governed by the laws of the Federal Republic of Nigeria, and disputes are subject to the courts of the Federal Capital Territory, Abuja.",
    },
  ];
}
