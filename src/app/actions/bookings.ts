"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { BlockedDate, Booking, Property, User } from "@/lib/models";
import { requireUser, type AuthedSession } from "@/lib/session";
import { EMAIL_RE, NG_PHONE, formatPrice } from "@/lib/format";
import { isRangeFree } from "@/lib/apartments";
import { DEFAULT_COMMISSION, commissionFor, nightsBetween, parseDay, quoteStay, stayDates, todayLagos } from "@/lib/stay";
import { adminEmail, apartmentEmail, sendMail } from "@/lib/mailer";
import type { FormState } from "./public";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
type Result = { ok: boolean; message: string };

function guestLink(b: { bookingReference: string; accessToken: string }) {
  return `/apartments/booking/${b.bookingReference}?t=${b.accessToken}`;
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
      intro: `${name} wants to stay at ${property.title}. Please accept or decline within 24 hours.`,
      rows: [...rows, ["Guest phone", phone], ["Guest email", email]],
      note: booking.specialRequests ? `Message from guest: ${booking.specialRequests}` : undefined,
      cta: { label: "Respond to request", href: `/dashboard/bookings?open=${booking._id}` },
    }),
  );
  void sendMail(
    email,
    `Booking request received — ${booking.bookingReference}`,
    apartmentEmail({
      heading: "We've sent your request to the host",
      intro: `Thanks, ${name.split(" ")[0]}. The host will confirm availability, usually within 24 hours, and contact you to arrange payment. Don't pay anyone before your booking shows as confirmed.`,
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
  b.status = "cancelled";
  b.cancellation = { cancelledAt: new Date(), byGuest: true, reason: reason.slice(0, 500) };
  b.history.push({ status: "cancelled", by: "guest", note: reason.slice(0, 200) || undefined });
  if (b.commission) b.commission.status = "not_due";
  await b.save();
  if (b.host?.email)
    void sendMail(
      b.host.email,
      `Booking cancelled by guest — ${b.bookingReference}`,
      apartmentEmail({
        heading: wasConfirmed ? "A guest cancelled a confirmed stay" : "A guest withdrew their request",
        intro: `${b.guest.name} cancelled ${b.bookingReference} for ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}). The dates are open again.`,
        note: reason ? `Reason: ${reason}` : undefined,
        cta: { label: "View bookings", href: "/dashboard/bookings" },
      }),
    );
  revalidatePath(`/apartments/booking/${reference}`);
  return { ok: true, message: "Your booking has been cancelled." };
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
      `Booking confirmed — ${b.propertyTitle}`,
      apartmentEmail({
        heading: "Your stay is confirmed",
        intro: `Great news, ${b.guest.name.split(" ")[0]}! The host has confirmed your stay. They'll contact you to arrange payment — pay only to the details the host provides, and keep your booking reference.`,
        rows: [
          ["Apartment", b.propertyTitle],
          ["Dates", stayDates(b.dates.checkIn, b.dates.checkOut)],
          [b.pricing.vat ? "Total (incl. VAT)" : "Total", formatPrice(b.pricing.total)],
          ["Reference", b.bookingReference],
          ...(host?.phone ? ([["Host phone", host.phone]] as [string, string][]) : []),
        ],
        note: b.hostNote ? `Message from your host: ${b.hostNote}` : undefined,
        cta: { label: "View booking", href: link },
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
  return { ok: true, message: decision === "confirm" ? "Booking confirmed — the guest has been emailed" : "Request declined — the guest has been emailed" };
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
  b.status = status;
  if (status === "cancelled") b.cancellation = { cancelledAt: new Date(), cancelledBy: session.userId, reason: note.slice(0, 500) };
  // Commission falls due once the guest actually stays.
  if (b.commission && (status === "checked_in" || status === "checked_out") && b.commission.status === "not_due") b.commission.status = "due";
  if (b.commission && (status === "cancelled" || status === "no_show") && b.commission.status !== "paid") b.commission.status = "not_due";
  b.history.push({ status, by: session.userType === "admin" ? "admin" : "host", note: note.slice(0, 200) || undefined });
  await b.save();
  if (status === "cancelled")
    void sendMail(
      b.guest.email,
      `Booking cancelled — ${b.propertyTitle}`,
      apartmentEmail({
        heading: "Your booking was cancelled",
        intro: `Your stay at ${b.propertyTitle} (${stayDates(b.dates.checkIn, b.dates.checkOut)}) was cancelled by the host. If you've paid, the host will arrange your refund. Contact hello@found.ng if you need help.`,
        note: note ? `Note: ${note}` : undefined,
        cta: { label: "Find another apartment", href: "/apartments" },
      }),
    );
  revalidatePath("/dashboard", "layout");
  const label: Record<string, string> = { checked_in: "Checked in", checked_out: "Stay completed", cancelled: "Booking cancelled", no_show: "Marked as no-show" };
  return { ok: true, message: label[status] };
}

export async function markBookingPaid(id: string, paid: boolean, reference = ""): Promise<Result> {
  const session = await requireUser(["host", "realtor", "admin"]);
  await connectDB();
  const b = await loadManaged(session, id);
  if (!b) return { ok: false, message: "Booking not found" };
  b.payment.status = paid ? "paid" : "pending";
  b.payment.paidAt = paid ? new Date() : undefined;
  b.payment.transactionReference = reference.slice(0, 120) || undefined;
  await b.save();
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: paid ? "Marked as paid by guest" : "Marked as unpaid" };
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
