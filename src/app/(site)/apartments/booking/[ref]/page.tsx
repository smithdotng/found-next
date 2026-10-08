import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { CalendarDays, Check, Clock, Home, Mail, Phone, Users, X } from "lucide-react";
import { toPlain } from "@/lib/db";
import { Booking } from "@/lib/models";
import { SmartImage } from "@/components/ui/smart-image";
import { expireStaleRequests } from "@/lib/bookings-data";
import { GuestCancel } from "@/components/apartments/guest-cancel";
import { formatDate, formatPrice, locationLine, primaryImage } from "@/lib/format";
import { PAY_WITHIN_HOURS, bookingStatusMeta, stayDates } from "@/lib/stay";
import { PaymentAccount } from "@/components/site/payment-account";
import { pageMetadata } from "@/lib/seo";
import type { BookingDoc, PropertyDoc } from "@/lib/types";

export const metadata: Metadata = pageMetadata({ title: "Your booking - Found Apartments", absoluteTitle: true, path: "/apartments", noIndex: true, image: "/assets/images/og-apartments.jpg" });

type Full = BookingDoc & { property: PropertyDoc | null; host: { name: string; phone?: string; email?: string; hostProfile?: { businessName?: string } } | null };

export default async function BookingStatusPage({ params, searchParams }: PageProps<"/apartments/booking/[ref]">) {
  const [{ ref }, sp] = await Promise.all([params, searchParams]);
  const token = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  if (!token) notFound();
  await expireStaleRequests();
  const doc = await Booking.findOne({ bookingReference: ref, accessToken: token })
    .populate("property", "title slug images location shortletDetails")
    .populate("host", "name phone email hostProfile.businessName")
    .lean();
  if (!doc) notFound();
  const b = toPlain<Full>(doc);
  const st = bookingStatusMeta(b);
  const confirmed = ["confirmed", "checked_in", "checked_out"].includes(b.status);
  const hostLabel = b.host?.hostProfile?.businessName || b.host?.name || "your host";
  const paid = b.payment?.status === "paid";
  const caution = b.pricing.securityDeposit ?? 0;
  const amountDue = b.pricing.total + caution;

  const steps = [
    { label: "Request sent", done: true, at: b.createdAt },
    { label: "Host accepts", done: confirmed, at: b.confirmedAt, failed: b.status === "declined" || b.status === "expired" },
    { label: "Pay Found", done: paid, at: b.payment?.paidAt },
    { label: "Check in", done: ["checked_in", "checked_out"].includes(b.status), at: undefined },
  ];

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <p className="text-sm font-semibold text-coral-500">Found Apartments · {b.bookingReference}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
        {b.status === "pending" ? "Request sent — waiting for the host" : b.status === "confirmed" ? (paid ? "Your stay is confirmed" : "Accepted — pay to secure your stay") : st.label}
      </h1>
      <p className="mt-2 text-slate-600">
        {b.status === "pending"
          ? `We've emailed ${hostLabel}. Most hosts respond within 24 hours — we'll email you at ${b.guest.email} as soon as they do.`
          : b.status === "confirmed"
            ? paid
              ? `Found has received your payment. ${hostLabel} will be in touch with check-in details.`
              : `${hostLabel} has accepted your dates. Transfer ${formatPrice(amountDue)} to Found within ${PAY_WITHIN_HOURS} hours, using ${b.bookingReference} as the narration. Your stay is confirmed as soon as we receive it.`
            : b.status === "declined"
              ? "The host couldn't accept this request. Your dates weren't charged — try another apartment below."
              : b.status === "cancelled"
                ? "This booking was cancelled."
                : b.status === "expired"
                  ? "The host didn't respond in time, so this request lapsed. Nothing was charged — try another apartment below."
                : "Thanks for staying with Found Apartments."}
      </p>

      <ol className="mt-8 grid grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <li key={s.label} className="text-center">
            <span className={clsx("mx-auto grid size-9 place-items-center rounded-full text-sm font-bold", s.failed ? "bg-rose-100 text-rose-700" : s.done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400")}>
              {s.failed ? <X className="size-4" /> : s.done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={clsx("mt-2 block text-xs font-medium", s.done ? "text-ink" : "text-slate-500")}>{s.label}</span>
            {s.at ? <span className="block text-[11px] text-slate-400">{formatDate(s.at)}</span> : null}
          </li>
        ))}
      </ol>

      {b.status === "confirmed" && !paid ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <PaymentAccount compact narration={b.bookingReference} />
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 sm:max-w-64">
            <p className="text-xs uppercase tracking-wide text-amber-700">Amount to pay</p>
            <p className="text-2xl font-bold">{formatPrice(amountDue)}</p>
            <p className="mt-1 text-xs">Narration: <strong>{b.bookingReference}</strong></p>
            <p className="mt-2 text-xs">Only pay Found Projects &amp; Realty Limited. Never pay the host or anyone else directly.</p>
          </div>
        </div>
      ) : null}

      <div className="card mt-8 overflow-hidden">
        {b.property ? (
          <Link href={`/apartments/${b.property.slug}`} className="flex items-center gap-4 border-b border-slate-100 p-4 hover:bg-slate-50">
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              <SmartImage src={primaryImage(b.property)} alt="" fill sizes="96px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{b.property.title}</p>
              <p className="truncate text-sm text-slate-500">{locationLine(b.property.location)}</p>
            </div>
            <span className={`chip ml-auto shrink-0 ${st.tone}`}>{st.label}</span>
          </Link>
        ) : null}
        <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
          <Row icon={CalendarDays} label="Dates" value={`${stayDates(b.dates.checkIn, b.dates.checkOut)} · ${b.dates.nights} night${b.dates.nights > 1 ? "s" : ""}`} />
          <Row icon={Users} label="Guests" value={`${b.guest.numberOfGuests}`} />
          <Row icon={Clock} label="Check-in / out" value={`${b.property?.shortletDetails?.checkInTime ?? "14:00"} / ${b.property?.shortletDetails?.checkOutTime ?? "11:00"}`} />
          <Row icon={Home} label="Booked by" value={b.guest.name} />
        </dl>
        <div className="border-t border-slate-100 p-5 text-sm">
          <div className="flex justify-between text-slate-600"><span>Accommodation</span><span>{formatPrice(b.pricing.subtotal)}</span></div>
          {b.pricing.cleaningFee ? <div className="mt-1 flex justify-between text-slate-600"><span>Cleaning fee</span><span>{formatPrice(b.pricing.cleaningFee)}</span></div> : null}
          {b.pricing.vat ? <div className="mt-1 flex justify-between text-slate-600"><span>VAT ({b.pricing.vatRate}%)</span><span>{formatPrice(b.pricing.vat)}</span></div> : null}
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-ink"><span>Total{b.pricing.vat ? " (incl. VAT)" : ""}</span><span>{formatPrice(b.pricing.total)}</span></div>
          {caution ? <div className="mt-1 flex justify-between text-slate-600"><span>Refundable caution fee</span><span>{formatPrice(caution)}</span></div> : null}
          {caution ? <div className="mt-1 flex justify-between font-semibold text-ink"><span>Amount payable to Found</span><span>{formatPrice(amountDue)}</span></div> : null}
          <p className="mt-2 text-xs text-slate-500">Payment: {paid ? "received by Found" : "not yet paid"}{caution ? ". The caution fee is refunded after check-out, less any documented damage." : ""}</p>
        </div>
        {confirmed && paid && b.host ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 p-5">
            {b.host.phone ? <a href={`tel:${b.host.phone}`} className="btn-primary"><Phone className="size-4" /> Call host</a> : null}
            {b.host.phone ? <a href={`https://wa.me/${b.host.phone.replace(/^0/, "234").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, this is ${b.guest.name} about Found Apartments booking ${b.bookingReference}.`)}`} target="_blank" rel="noopener noreferrer" className="btn-outline">WhatsApp host</a> : null}
            {b.host.email ? <a href={`mailto:${b.host.email}?subject=${encodeURIComponent(`Booking ${b.bookingReference}`)}`} className="btn-outline"><Mail className="size-4" /> Email</a> : null}
          </div>
        ) : null}
        {b.hostNote && confirmed ? <p className="border-t border-slate-100 p-5 text-sm text-slate-700"><strong>Message from your host:</strong> {b.hostNote}</p> : null}
        {b.declineReason && b.status === "declined" ? <p className="border-t border-slate-100 p-5 text-sm text-slate-700"><strong>Host&apos;s note:</strong> {b.declineReason}</p> : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {["declined", "cancelled", "expired"].includes(b.status) ? (
          <Link href={`/apartments?checkIn=${b.dates.checkIn.slice(0, 10)}&checkOut=${b.dates.checkOut.slice(0, 10)}&guests=${b.guest.numberOfGuests}#results`} className="btn-accent">Find another apartment</Link>
        ) : (
          <Link href="/apartments" className="btn-outline">Browse more stays</Link>
        )}
        {["pending", "confirmed"].includes(b.status) ? <GuestCancel reference={b.bookingReference} token={token} confirmed={b.status === "confirmed"} /> : null}
      </div>
      <p className="mt-6 text-xs text-slate-500">Keep this page&apos;s link — it&apos;s how you check your booking. Need help? Email hello@found.ng with your reference.</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}
