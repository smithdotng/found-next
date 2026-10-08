"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { BlockedDate, Booking, Property, User } from "@/lib/models";
import { requireUser, type AuthedSession } from "@/lib/session";
import { EMAIL_RE, NG_PHONE, formatPrice } from "@/lib/format";
import { isRangeFree } from "@/lib/apartments";
import { DEFAULT_COMMISSION, PAYOUT_DAYS, PAY_WITHIN_HOURS, commissionFor, nightsBetween, parseDay, quoteStay, splitBooking, stayDates, todayLagos } from "@/lib/stay";
import { PAYMENT_ACCOUNT } from "@/lib/verification";
import { adminEmail, apartmentEmail, sendMail } from "@/lib/mailer";
import type { FormState } from "./public";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
type Result = { ok: boolean; message: string };

function guestLink(b: { bookingReference: string; accessToken: string }) {
  return `/apartments/booking/${b.bookingReference}?t=${b.accessToken}`;
}

/** The date `n` working days (Mon–Fri) after `from`. */
function addWorkingDays(from: Date, n: number) {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return d;
}

/** Bank details rows for the guest's payment to Found. */
function payRows(b: { bookingReference: string; pricing: { total: number; securityDeposit?: number; vat?: number } }): [string, string][] {
  const caution = b.pricing.securityDeposit ?? 0;
  return [
    [b.pricing.vat ? "Booking total (incl. VAT)" : "Booking total", formatPrice(b.pricing.total)],
    ...(caution ? ([["Refundable caution fee", formatPrice(caution)]] as [string, string][]) : []),
    ["Amount to pay", formatPrice(b.pricing.total + caution)],
    ["Account name", PAYMENT_ACCOUNT.accountName],
    ["Account number", PAYMENT_ACCOUNT.accountNumber],
    ["Bank", PAYMENT_ACCOUNT.bank],
    ["Narration / reference", b.bookingReference],
  ];
}

/* ---------- Guest: request to book ---------- */

export async function requestBooking(_prev: FormState, fd: FormData): Promise<FormState> {
  if (s(fd, "website")) return { ok: true, message: "Request sent." }; // honeypot
  const errors: Record<string, string> = {};
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const phone = s(fd, "phone").replace(/\s/g, "");
  const guests = parseInt(s(fd, "guests")) || 0;
  const checkIn = parseDay(s(fd, "checkIn"));
  const checkOut = parseDay(s(fd, "checkOut"));
  if (!name) errors.name = "Enter your full name";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
  if (!NG_PHONE.test(phone)) errors.phone = "Enter a Nigerian phone number, e.g. 08031234567";
  if (!checkIn || !checkOut) errors.dates = "Choose your check-in and check-out dates";
  if (guests < 1) errors.guests = "How many guests?";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  await connectDB();
  const property = await Property.findOne({ _id: s(fd, "propertyId"), propertyType: "shortlet", status: "available" }).populate(
    "owner",
    "name email phone userType hostProfile.commissionRate hostProfile.agreement",
  );
  if (!property) return { ok: false, message: "This apartment is no longer available." };

  const sd = property.shortletDetails ?? {};
  const nights = nightsBetween(checkIn!, checkOut!);
  if (checkIn! < todayLagos()) return { ok: false, message: "Check-in can't be in the past.", errors: { dates: "Pick future dates" } };
  if (nights < 1) return { ok: false, message: "Check-out must be after check-in.", errors: { dates: "Check dates" } };
  if (nights < (sd.minimumStay ?? 1)) return { ok: false, message: `Minimum stay is ${sd.minimumStay} nights.`, errors: { dates: `Minimum ${sd.minimumStay} nights` } };
  if (sd.maximumStay && nights > sd.maximumStay) return { ok: false, message: `Maximum stay is ${sd.maximumStay} nights.`, errors: { dates: `Maximum ${sd.maximumStay} nights` } };
  if (sd.maxGuests && guests > sd.maxGuests) return { ok: false, message: `This apartment sleeps up to ${sd.maxGuests} guests.`, errors: { guests: `Max ${sd.maxGuests}` } };
  if (!(await isRangeFree(String(property._id), checkIn!, checkOut!)))
    return { ok: false, message: "Some of those nights were just booked. Please pick different dates.", errors: { dates: "Dates unavailable" } };

  // One open request per guest per apartment for the same dates.
  const dupe = await Booking.findOne({ property: property._id, "guest.email": email, status: "pending", "dates.checkIn": checkIn, "dates.checkOut": checkOut });
  if (dupe) redirect(guestLink(dupe));

  const owner = property.owner as { _id: string; name: string; email: string; phone?: string; userType?: string; hostProfile?: { commissionRate?: number; agreement?: { commissionRate?: number } } };
  const q = quoteStay(property.price, sd, checkIn!, checkOut!);
  const rate = owner.userType === "host" ? owner.hostProfile?.agreement?.commissionRate ?? owner.hostProfile?.commissionRate ?? DEFAULT_COMMISSION : null;

  const booking = await Booking.create({
    property: property._id,
    propertyTitle: property.title,
    host: owner._id,
    guest: { name, email, phone, numberOfGuests: guests },
    dates: { checkIn, checkOut, nights },
    pricing: {
      nightlyRate: q.nightlyRate,
      weekendRate: q.weekendRate ?? undefined,
      subtotal: q.subtotal,
      cleaningFee: q.cleaningFee,
      securityDeposit: q.securityDeposit,
      discount: q.discount,
      discountType: q.discountType,
      net: q.net,
      vatRate: q.vatRate,
      vat: q.vat,
      total: q.total,
    },
    payment: { method: "direct", status: "pending" },
    status: "pending",
    specialRequests: s(fd, "message").slice(0, 1000),
    commission: rate != null ? { rate, amount: commissionFor(q.net, rate), status: "not_due" } : undefined,
    payout: { amount: splitBooking(q, rate).hostPayout, status: "not_due" },
    caution: { status: "not_paid" },
    history: [{ status: "pending", by: "guest", note: "Booking requested" }],
  });

  const rows: [string, string][] = [
    ["Apartment", property.title],
    ["Dates", `${stayDates(checkIn!, checkOut!)} · ${nights} night${nights === 1 ? "" : "s"}`],
    ["Guests", String(guests)],
    ["Total (incl. VAT)", formatPrice(q.total)],
    ["Reference", booking.bookingReference],
  ];
  void sendMail(
    owner.email,
    `New booking request — ${property.title}`,
    apartmentEmail({
      heading: "You have a new booking request",
      intro: `${name} wants to stay at ${property.title}. Please accept or decline within 24 hours. If you accept, the guest pays Found and we'll let you know as soon as the payment is in. Please don't collect payment from the guest yourself.`,
      rows: [...rows, ["Your payout (after check-in)", formatPrice(splitBooking(q, rate).hostPayout)], ["Guest phone", phone], ["Guest email", email]],
      note: booking.specialRequests ? `Message from guest: ${booking.specialRequests}` : undefined,
      cta: { label: "Respond to request", href: `/dashboard/bookings?open=${booking._id}` },
    }),
  );
  void sendMail(
    email,
    `Booking request received — ${booking.bookingReference}`,
    apartmentEmail({
      heading: "We've sent your request to the host",
      intro: `Thanks, ${name.split(" ")[0]}. The host will confirm availability, usually within 24 hours. As soon as they do, we'll email you Found's payment details. You only ever pay Found Projects & Realty Limited, never the host or anyone else.`,
      rows,
      cta: { label: "View your booking", href: guestLink(booking) },
    }),
  );
  void sendMail(adminEmail(), `Booking request ${booking.bookingReference}`, apartmentEmail({ heading: "New booking request", intro: `${name} requested ${property.title}.`, rows, cta: { label: "View bookings", href: "/dashboard/bookings" } }));

  redirect(guestLink(booking));
}

export async function guestCancelBooking(reference: string, token: string, reason: string): Promise<Result> {
  await connectDB();
  const b = await Booking.findOne({ bookingReference: reference, accessToken: token }).populate("host", "email name");
  if (!b) return { ok: false, message: "Booking not found" };
  if (!["pending", "confirmed"].includes(b.status)) return { ok: false, message: "This booking can no longer be cancelled online." };
  const wasConfirmed = b.status === "confirmed";
  const paid = b.payment?.status === "paid";
  b.status = "cancelled";
  b.cancellation = { cancelledAt: new Date(), byGuest: true, reason: reason.slice(0, 500) };
  b.history.push({ status: "cancelled", by: "guest", note: reason.slice(0, 200) || undefined });
  if (b.commission) b.commission.status = "not_due";
  // A paid booking's refund (and any payout on the non-refundable part) is settled by Found.
  if (b.payout) b.payout.status = paid ? "on_hold" : "not_due";
  await b.save();
  if (b.host?.email)
    void sendMail(
      b.host.email,
      `Booking cancelled by guest — ${b.bookingReference}`,
      apartmentEmail({
        heading: wasConfirmed ? "A guest cancelled an accepted stay" : "A guest withdrew their request",
        intro: `${b.guest.name} cancelled ${b.bookingReference} for ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}). The dates are open again.${paid ? " Found will settle the guest's refund under your cancellation policy and pay you any non-refundable part, less commission." : ""}`,
        note: reason ? `Reason: ${reason}` : undefined,
        cta: { label: "View bookings", href: "/dashboard/bookings" },
      }),
    );
  if (paid)
    void sendMail(adminEmail(), `Paid booking cancelled by guest ${b.bookingReference}`, apartmentEmail({ heading: "A paid booking was cancelled: refund due", intro: `${b.guest.name} cancelled ${b.bookingReference} (${b.propertyTitle}). Work out the refund under the listing's cancellation policy, pay the guest and settle any payout to the host.`, note: reason ? `Reason: ${reason}` : undefined, cta: { label: "Open booking", href: `/dashboard/bookings?tab=all&open=${b._id}` } }));
  revalidatePath(`/apartments/booking/${reference}`);
  return { ok: true, message: paid ? "Your booking has been cancelled. Found will be in touch about your refund." : "Your booking has been cancelled." };
}

/* ---------- Host / admin: manage bookings ---------- */

async function loadManaged(session: AuthedSession, id: string) {
  const b = await Booking.findById(id);
  if (!b) return null;
  if (session.userType === "admin") return b;
  if (String(b.host) === session.userId) return b;
  // Realtor-owned shortlets created before the host field existed.
  const p = await Property.findById(b.property).select("owner");
  return p && String(p.owner) === session.userId ? b : null;
}

export async function respondToBooking(id: string, decision: "confirm" | "decline", note = ""): Promise<Result> {
  const session = await requireUser(["host", "realtor", "admin"]);
  await connectDB();
  const b = await loadManaged(session, id);
  if (!b) return { ok: false, message: "Booking not found" };
  if (b.status !== "pending") return { ok: false, message: "This request has already been answered." };

  if (decision === "confirm") {
    if (!(await isRangeFree(String(b.property), b.dates.checkIn, b.dates.checkOut, String(b._id))))
      return { ok: false, message: "Those nights now clash with another confirmed stay or a blocked period." };
    b.status = "confirmed";
    b.confirmedAt = new Date();
    b.hostNote = note.slice(0, 1000) || undefined;
  } else {
    b.status = "declined";
    b.declineReason = note.slice(0, 500) || undefined;
  }
  b.history.push({ status: b.status, by: session.userType === "admin" ? "admin" : "host", note: note.slice(0, 200) || undefined });
  await b.save();

  const host = await User.findById(b.host).select("name phone email");
  const link = guestLink(b);
  if (decision === "confirm") {
    void sendMail(
      b.guest.email,
      `Host accepted: pay to secure your stay (${b.bookingReference})`,
      apartmentEmail({
        heading: "The host accepted. Pay Found to secure your stay",
        intro: `Great news, ${b.guest.name.split(" ")[0]}! The host has accepted your dates at ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}). To secure your stay, please transfer the amount below to Found within ${PAY_WITHIN_HOURS} hours, using your booking reference as the narration. Your stay is confirmed as soon as we receive it.`,
        rows: payRows(b),
        note: `Only pay Found Projects & Realty Limited at the account above. Never pay the host or anyone else directly.${b.pricing.securityDeposit ? " The caution fee is refunded after check-out, less any documented damage." : ""}${b.hostNote ? ` Message from your host: ${b.hostNote}` : ""}`,
        cta: { label: "View booking", href: link },
      }),
    );
    void sendMail(
      adminEmail(),
      `Awaiting guest payment ${b.bookingReference}`,
      apartmentEmail({
        heading: "Host accepted a booking: watch for the guest's payment",
        intro: `${host?.name ?? "The host"} accepted ${b.guest.name}'s request for ${b.propertyTitle}. Confirm the transfer on the dashboard when it lands.`,
        rows: payRows(b).slice(0, 3).concat([["Reference", b.bookingReference]] as [string, string][]),
        cta: { label: "Open booking", href: `/dashboard/bookings?tab=all&open=${b._id}` },
      }),
    );
  } else {
    void sendMail(
      b.guest.email,
      `Booking request declined — ${b.propertyTitle}`,
      apartmentEmail({
        heading: "The host couldn't accept your request",
        intro: `Sorry, ${b.guest.name.split(" ")[0]} — your request for ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}) wasn't accepted. There are other great apartments available for your dates.`,
        note: b.declineReason ? `Host's note: ${b.declineReason}` : undefined,
        cta: { label: "Find another apartment", href: `/apartments?checkIn=${b.dates.checkIn.toISOString().slice(0, 10)}&checkOut=${b.dates.checkOut.toISOString().slice(0, 10)}&guests=${b.guest.numberOfGuests}` },
      }),
    );
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: decision === "confirm" ? "Accepted. The guest has been sent Found's payment details" : "Request declined. The guest has been emailed" };
}

const NEXT_STATUS: Record<string, string[]> = {
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["checked_out"],
};

export async function updateBookingStatus(id: string, status: "checked_in" | "checked_out" | "cancelled" | "no_show", note = ""): Promise<Result> {
  const session = await requireUser(["host", "realtor", "admin"]);
  await connectDB();
  const b = await loadManaged(session, id);
  if (!b) return { ok: false, message: "Booking not found" };
  if (!NEXT_STATUS[b.status]?.includes(status)) return { ok: false, message: "That change isn't possible for this booking." };
  const paid = b.payment?.status === "paid";
  if (status === "checked_in" && !paid && session.userType !== "admin")
    return { ok: false, message: "Found hasn't received this guest's payment yet. Please don't check them in until it shows as paid." };
  b.status = status;
  if (status === "cancelled") b.cancellation = { cancelledAt: new Date(), cancelledBy: session.userId, reason: note.slice(0, 500) };
  if (status === "checked_in" && paid) {
    // The stay has started: Found keeps its commission and the host's payout falls due.
    if (b.commission && b.commission.status === "not_due") b.commission.status = "due";
    if (b.payout && b.payout.status !== "paid") {
      b.payout.status = "due";
      b.payout.dueAt = addWorkingDays(todayLagos(), PAYOUT_DAYS);
    }
  }
  if (status === "cancelled" || status === "no_show") {
    if (b.commission && b.commission.status !== "paid") b.commission.status = "not_due";
    // Paid bookings: Found decides the refund / payout split under the cancellation policy.
    if (b.payout && b.payout.status !== "paid") b.payout.status = paid ? "on_hold" : "not_due";
  }
  b.history.push({ status, by: session.userType === "admin" ? "admin" : "host", note: note.slice(0, 200) || undefined });
  await b.save();
  if (status === "cancelled") {
    void sendMail(
      b.guest.email,
      `Booking cancelled — ${b.propertyTitle}`,
      apartmentEmail({
        heading: "Your booking was cancelled",
        intro: `Your stay at ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}) was cancelled by the host. ${paid ? "Found will refund your payment in full, and we can help you find another apartment." : "You haven't been charged."} Contact hello@found.ng if you need help.`,
        note: note ? `Note: ${note}` : undefined,
        cta: { label: "Find another apartment", href: "/apartments" },
      }),
    );
    if (paid) void sendMail(adminEmail(), `Host cancelled a paid booking ${b.bookingReference}`, apartmentEmail({ heading: "Refund due: host cancelled a paid booking", intro: `The host cancelled ${b.bookingReference} (${b.propertyTitle}). Refund ${b.guest.name} in full.`, note: note ? `Host's reason: ${note}` : undefined, cta: { label: "Open booking", href: `/dashboard/bookings?tab=all&open=${b._id}` } }));
  }
  if (status === "checked_in" && paid && b.payout?.amount)
    void sendMail(adminEmail(), `Host payout due ${b.bookingReference}`, apartmentEmail({ heading: "A host payout is now due", intro: `${b.guest.name} has checked in to ${b.propertyTitle}. Remit ${formatPrice(b.payout.amount)} to the host by ${b.payout.dueAt ? b.payout.dueAt.toDateString() : "the due date"}.`, cta: { label: "Record payout", href: `/dashboard/bookings?tab=all&open=${b._id}` } }));
  revalidatePath("/dashboard", "layout");
  const label: Record<string, string> = { checked_in: "Checked in", checked_out: "Stay completed", cancelled: "Booking cancelled", no_show: "Marked as no-show" };
  return { ok: true, message: label[status] };
}

/** Admin: confirm (or undo) that the guest's transfer to Found has landed. */
export async function markBookingPaid(id: string, paid: boolean, reference = ""): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const b = await Booking.findById(id).populate("host", "name email phone hostProfile.businessName");
  if (!b) return { ok: false, message: "Booking not found" };
  if (paid && !["confirmed", "checked_in"].includes(b.status)) return { ok: false, message: "Only accepted bookings can be marked as paid." };
  b.payment.method = "bank_transfer";
  b.payment.status = paid ? "paid" : "pending";
  b.payment.paidAt = paid ? new Date() : undefined;
  b.payment.transactionReference = reference.slice(0, 120) || undefined;
  if (!b.caution) b.caution = {};
  b.caution.status = paid && b.pricing.securityDeposit ? "held" : "not_paid";
  if (!b.payout) b.payout = { amount: splitBooking(b.pricing, b.commission?.rate).hostPayout, status: "not_due" };
  b.history.push({ status: b.status, by: "admin", note: paid ? `Guest payment received by Found${reference ? ` (ref ${reference.slice(0, 60)})` : ""}` : "Guest payment unmarked" });
  await b.save();

  if (paid) {
    const host = b.host as { name?: string; email?: string; phone?: string; hostProfile?: { businessName?: string } } | null;
    void sendMail(
      b.guest.email,
      `Payment received: your stay is confirmed (${b.bookingReference})`,
      apartmentEmail({
        heading: "Payment received. Your stay is confirmed",
        intro: `Thank you, ${b.guest.name.split(" ")[0]}. Found has received your payment for ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}). Your host will be in touch with check-in details.`,
        rows: [
          ["Amount received", formatPrice(b.pricing.total + (b.pricing.securityDeposit ?? 0))],
          ["Reference", b.bookingReference],
          ...(host?.phone ? ([["Host phone", host.phone]] as [string, string][]) : []),
        ],
        cta: { label: "View booking", href: guestLink(b) },
      }),
    );
    if (host?.email)
      void sendMail(
        host.email,
        `Guest has paid: ${b.bookingReference}`,
        apartmentEmail({
          heading: "Found has received the guest's payment",
          intro: `${b.guest.name}'s stay at ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}) is paid and secured. Please get in touch with check-in details, and mark the guest as checked in on arrival. We'll remit your payout within ${PAYOUT_DAYS} working days of check-in.`,
          rows: [
            ["Guest", `${b.guest.name} · ${b.guest.phone}`],
            ["Your payout", formatPrice(b.payout?.amount ?? 0)],
            ["Reference", b.bookingReference],
          ],
          cta: { label: "Open booking", href: `/dashboard/bookings?open=${b._id}` },
        }),
      );
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/apartments/booking/${b.bookingReference}`);
  return { ok: true, message: paid ? "Payment recorded. The guest and host have been emailed" : "Marked as unpaid" };
}

/** Admin: record the payout remitted to the host (or put it on hold). */
export async function setPayoutStatus(id: string, status: "due" | "paid" | "on_hold" | "not_due", reference = "", amount?: number): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const b = await Booking.findById(id).populate("host", "name email hostProfile.bankDetails");
  if (!b) return { ok: false, message: "Booking not found" };
  if (!b.payout) b.payout = { amount: splitBooking(b.pricing, b.commission?.rate).hostPayout };
  if (amount != null && Number.isFinite(amount) && amount >= 0) b.payout.amount = Math.round(amount);
  b.payout.status = status;
  b.payout.paidAt = status === "paid" ? new Date() : undefined;
  if (reference) b.payout.reference = reference.slice(0, 120);
  // Found's commission is kept from the guest's payment when the payout goes out.
  if (b.commission && status === "paid") {
    b.commission.status = "paid";
    b.commission.paidAt = new Date();
  }
  b.history.push({ status: b.status, by: "admin", note: status === "paid" ? `Payout of ${formatPrice(b.payout.amount ?? 0)} sent to host${reference ? ` (ref ${reference.slice(0, 60)})` : ""}` : `Payout ${status.replace("_", " ")}` });
  await b.save();
  const host = b.host as { name?: string; email?: string } | null;
  if (status === "paid" && host?.email) {
    const split = splitBooking(b.pricing, b.commission?.rate);
    void sendMail(
      host.email,
      `Payout sent: ${b.bookingReference}`,
      apartmentEmail({
        heading: "We've sent your payout",
        intro: `Found has remitted your payout for ${b.guest.name}'s stay at ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}).`,
        rows: [
          ["Accommodation total", formatPrice(split.net)],
          [`Found commission (${b.commission?.rate ?? 0}%)`, `−${formatPrice(split.commission)}`],
          ...(split.vat ? ([["VAT (collected and remitted by Found)", formatPrice(split.vat)]] as [string, string][]) : []),
          ["Payout sent", formatPrice(b.payout.amount ?? 0)],
          ...(reference ? ([["Transfer reference", reference]] as [string, string][]) : []),
        ],
        cta: { label: "View booking", href: `/dashboard/bookings?tab=all&open=${b._id}` },
      }),
    );
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: status === "paid" ? "Payout recorded. The host has been emailed" : `Payout marked ${status.replace("_", " ")}` };
}

/** Admin: record what happened to the guest's caution fee after check-out. */
export async function settleCaution(id: string, refundedAmount: number, note = ""): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const b = await Booking.findById(id);
  if (!b) return { ok: false, message: "Booking not found" };
  const deposit = b.pricing.securityDeposit ?? 0;
  const refund = Math.max(0, Math.min(deposit, Math.round(refundedAmount)));
  b.caution = { status: refund >= deposit ? "refunded" : "partly_refunded", refundedAmount: refund, refundedAt: new Date(), note: note.slice(0, 300) || undefined };
  b.history.push({ status: b.status, by: "admin", note: `Caution fee: ${formatPrice(refund)} refunded to guest${deposit - refund > 0 ? `, ${formatPrice(deposit - refund)} kept for damage` : ""}` });
  await b.save();
  void sendMail(
    b.guest.email,
    `Caution fee refund — ${b.bookingReference}`,
    apartmentEmail({
      heading: "Your caution fee has been refunded",
      intro: `We've refunded ${formatPrice(refund)} of your ${formatPrice(deposit)} caution fee for ${b.propertyTitle}.${deposit - refund > 0 ? ` ${formatPrice(deposit - refund)} was kept for documented damage.` : ""} Thanks for staying with Found Apartments.`,
      note: note || undefined,
    }),
  );
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Caution fee settled. The guest has been emailed" };
}

export async function setCommissionStatus(id: string, status: "due" | "paid" | "waived" | "not_due", reference = ""): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const b = await Booking.findById(id);
  if (!b || !b.commission) return { ok: false, message: "No commission on this booking" };
  b.commission.status = status;
  b.commission.paidAt = status === "paid" ? new Date() : undefined;
  if (reference) b.commission.reference = reference.slice(0, 120);
  await b.save();
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: status === "paid" ? "Commission recorded as received" : `Commission marked ${status.replace("_", " ")}` };
}

/* ---------- Calendar blocks ---------- */

export async function addBlock(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser(["host", "realtor", "admin"]);
  const start = parseDay(s(fd, "start"));
  const lastNight = parseDay(s(fd, "end"));
  if (!start || !lastNight) return { ok: false, message: "Choose the first and last night to block." };
  const end = new Date(lastNight.getTime() + 86400000); // store exclusive end
  if (end <= start) return { ok: false, message: "The last night must be on or after the first night." };
  await connectDB();
  const p = await Property.findById(s(fd, "propertyId")).select("owner propertyType");
  if (!p || (session.userType !== "admin" && String(p.owner) !== session.userId)) return { ok: false, message: "Apartment not found" };
  const clash = await Booking.exists({ property: p._id, status: { $in: ["confirmed", "checked_in"] }, "dates.checkIn": { $lt: end }, "dates.checkOut": { $gt: start } });
  if (clash) return { ok: false, message: "A confirmed booking already covers some of those nights." };
  await BlockedDate.create({ property: p._id, startDate: start, endDate: end, reason: s(fd, "reason") || "owner_use", notes: s(fd, "notes").slice(0, 300), createdBy: session.userId });
  revalidatePath("/dashboard/calendar");
  return { ok: true, message: "Dates blocked" };
}

export async function removeBlock(id: string): Promise<Result> {
  const session = await requireUser(["host", "realtor", "admin"]);
  await connectDB();
  const blk = await BlockedDate.findById(id);
  if (!blk) return { ok: false, message: "Not found" };
  const p = await Property.findById(blk.property).select("owner");
  if (session.userType !== "admin" && String(p?.owner) !== session.userId) return { ok: false, message: "Not allowed" };
  await blk.deleteOne();
  revalidatePath("/dashboard/calendar");
  return { ok: true, message: "Dates reopened" };
}
