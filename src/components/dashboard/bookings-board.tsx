"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import {
  ArrowLeft, BadgeCheck, CalendarDays, Check, CircleDollarSign, Clock, DoorClosed, DoorOpen, ExternalLink, Loader2, Mail, MessageCircle, Phone, UserX, Users, X,
} from "lucide-react";
import { markBookingPaid, respondToBooking, setCommissionStatus, updateBookingStatus } from "@/app/actions/bookings";
import { toast } from "@/components/ui/toaster";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDate, formatPrice, primaryImage, timeAgo } from "@/lib/format";
import { BOOKING_STATUS, stayDates, todayLagos } from "@/lib/stay";
import type { ManagedBooking } from "@/lib/bookings-data";

function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("234")) return d;
  if (d.startsWith("0")) return "234" + d.slice(1);
  return d;
}

const COMMISSION_LABEL: Record<string, string> = { not_due: "Not due yet", due: "Due to Found", paid: "Received by Found", waived: "Waived" };

export function BookingsBoard({ items, isAdmin, initialOpen }: { items: ManagedBooking[]; isAdmin: boolean; initialOpen?: string }) {
  const [activeId, setActiveId] = useState<string | null>(initialOpen && items.some((i) => i._id === initialOpen) ? initialOpen : null);
  const active = items.find((i) => i._id === activeId) ?? null;

  return (
    <div className="card grid min-h-[28rem] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <ul className={clsx("min-w-0 divide-y divide-slate-100 lg:border-r lg:border-slate-100", active && "hidden lg:block")}>
        {items.map((b) => {
          const st = BOOKING_STATUS[b.status];
          return (
            <li key={b._id}>
              <button type="button" onClick={() => setActiveId(b._id)} className={clsx("flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50", activeId === b._id && "bg-brand-50/60")}>
                <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <SmartImage src={b.property ? primaryImage(b.property) : undefined} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{b.guest.name}</span>
                    <span className={`chip shrink-0 ${st?.tone}`}>{st?.label}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">{b.property?.title ?? b.propertyTitle}{isAdmin && b.host ? ` · ${b.host.hostProfile?.businessName || b.host.name}` : ""}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-600">
                    <span>{stayDates(b.dates.checkIn, b.dates.checkOut)}</span>
                    <span>{formatPrice(b.pricing.total)}</span>
                    {b.status === "pending" ? <span className="text-amber-700">{timeAgo(b.createdAt)}</span> : null}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <div className={clsx("min-w-0", !active && "hidden lg:grid lg:place-items-center")}>
        {active ? (
          <Detail key={active._id} b={active} isAdmin={isAdmin} onBack={() => setActiveId(null)} />
        ) : (
          <p className="p-10 text-center text-sm text-slate-400">
            <CalendarDays className="mx-auto mb-2 size-8" /> Select a booking to see details and respond
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({ b, isAdmin, onBack }: { b: ManagedBooking; isAdmin: boolean; onBack: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"" | "decline" | "cancel">("");
  const [ref, setRef] = useState(b.payment?.transactionReference ?? "");
  const first = b.guest.name.split(" ")[0];
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const r = await fn();
      toast(r.message, r.ok ? "success" : "error");
      if (r.ok) {
        setMode("");
        setNote("");
        router.refresh();
      }
    });
  const arrived = new Date(b.dates.checkIn) <= todayLagos();
  const wa = `https://wa.me/${waNumber(b.guest.phone)}?text=${encodeURIComponent(`Hi ${first}, this is your host for "${b.property?.title ?? b.propertyTitle}" on Found Apartments (booking ${b.bookingReference}).`)}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3 border-b border-slate-100 p-5">
        <button type="button" onClick={onBack} className="btn-ghost -ml-2 !px-2 lg:hidden" aria-label="Back"><ArrowLeft className="size-4" /></button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{b.bookingReference} · requested {formatDate(b.createdAt)}</p>
          <h2 className="mt-0.5 text-lg font-bold text-ink">{b.guest.name}</h2>
          {b.property ? (
            <Link href={`/apartments/${b.property.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
              {b.property.title} <ExternalLink className="size-3" />
            </Link>
          ) : <p className="text-sm text-slate-500">{b.propertyTitle}</p>}
        </div>
        <span className={`chip ${BOOKING_STATUS[b.status]?.tone}`}>{BOOKING_STATUS[b.status]?.label}</span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Info icon={CalendarDays} label="Dates" value={`${stayDates(b.dates.checkIn, b.dates.checkOut)}`} sub={`${b.dates.nights} night${b.dates.nights > 1 ? "s" : ""}`} />
          <Info icon={Users} label="Guests" value={String(b.guest.numberOfGuests)} />
          <Info icon={Phone} label="Phone" value={b.guest.phone} />
          <Info icon={Mail} label="Email" value={b.guest.email} />
        </dl>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${b.guest.phone}`} className="btn-outline btn-sm"><Phone className="size-3.5" /> Call</a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm"><MessageCircle className="size-3.5" /> WhatsApp</a>
          <a href={`mailto:${b.guest.email}?subject=${encodeURIComponent(`Your Found Apartments booking ${b.bookingReference}`)}`} className="btn-outline btn-sm"><Mail className="size-3.5" /> Email</a>
        </div>

        {b.specialRequests ? (
          <blockquote className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><span className="text-xs font-semibold text-slate-500">Message from guest</span><br />{b.specialRequests}</blockquote>
        ) : null}

        <div className="rounded-xl border border-slate-200 p-4 text-sm">
          <Line label={`Accommodation (${b.dates.nights} night${b.dates.nights > 1 ? "s" : ""})`} value={formatPrice((b.pricing.subtotal ?? 0) + (b.pricing.discount ?? 0))} />
          {b.pricing.discount ? <Line label={`${b.pricing.discountType ?? ""} discount`} value={`−${formatPrice(b.pricing.discount)}`} className="capitalize text-emerald-700" /> : null}
          {b.pricing.cleaningFee ? <Line label="Cleaning fee" value={formatPrice(b.pricing.cleaningFee)} /> : null}
          {b.pricing.vat ? <Line label={`VAT (${b.pricing.vatRate}%)`} value={formatPrice(b.pricing.vat)} /> : null}
          <Line label={b.pricing.vat ? "Guest pays you (incl. VAT)" : "Guest pays you"} value={formatPrice(b.pricing.total)} className="mt-1 border-t border-slate-100 pt-2 font-bold text-ink" />
          {b.pricing.vat ? <p className="text-xs text-slate-500">VAT is collected from the guest for remittance to the tax authority (NRS); it isn&apos;t your income.</p> : null}
          {b.pricing.securityDeposit ? <Line label="Refundable caution fee" value={formatPrice(b.pricing.securityDeposit)} className="text-slate-500" /> : null}
          {b.commission?.amount ? (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <Line label={`Found commission (${b.commission.rate}%)`} value={formatPrice(b.commission.amount)} className="font-semibold" />
              <p className="mt-1">{COMMISSION_LABEL[b.commission.status ?? "not_due"]}{b.commission.status === "due" ? " — pay within 7 days of check-out" : ""}{b.commission.paidAt ? ` · ${formatDate(b.commission.paidAt)}` : ""}</p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {b.status === "pending" ? (
          mode === "decline" ? (
            <div className="space-y-2">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field" placeholder="Optional note to the guest, e.g. dates already taken" />
              <div className="flex gap-2">
                <button type="button" className="btn-danger" disabled={pending} onClick={() => run(() => respondToBooking(b._id, "decline", note))}>{pending ? <Loader2 className="size-4 animate-spin" /> : null} Decline request</button>
                <button type="button" className="btn-ghost" onClick={() => setMode("")}>Back</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field" placeholder="Message for the guest when you confirm (payment details, directions)… optional" />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn bg-emerald-600 text-white hover:bg-emerald-700" disabled={pending} onClick={() => run(() => respondToBooking(b._id, "confirm", note))}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Accept booking
                </button>
                <button type="button" className="btn-outline text-rose-600" onClick={() => setMode("decline")}><X className="size-4" /> Decline</button>
              </div>
              <p className="text-xs text-slate-500">Accepting holds these dates and emails {first} a confirmation. You then arrange payment directly.</p>
            </div>
          )
        ) : null}

        {["confirmed", "checked_in"].includes(b.status) ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
              <CircleDollarSign className={clsx("size-5", b.payment?.status === "paid" ? "text-emerald-600" : "text-slate-400")} />
              <span className="text-sm font-medium text-ink">{b.payment?.status === "paid" ? `Paid ${b.payment.paidAt ? formatDate(b.payment.paidAt) : ""}` : "Payment not recorded"}</span>
              {b.payment?.status !== "paid" ? (
                <>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} className="field !w-40 !py-1.5 text-xs" placeholder="Transfer ref (optional)" />
                  <button type="button" className="btn-outline btn-sm" disabled={pending} onClick={() => run(() => markBookingPaid(b._id, true, ref))}>Mark as paid</button>
                </>
              ) : (
                <button type="button" className="btn-ghost btn-sm ml-auto" disabled={pending} onClick={() => run(() => markBookingPaid(b._id, false))}>Undo</button>
              )}
            </div>
            {mode === "cancel" ? (
              <div className="space-y-2">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field" placeholder="Reason — the guest will see this" />
                <div className="flex gap-2">
                  <button type="button" className="btn-danger" disabled={pending} onClick={() => run(() => updateBookingStatus(b._id, "cancelled", note))}>Cancel booking</button>
                  <button type="button" className="btn-ghost" onClick={() => setMode("")}>Back</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {b.status === "confirmed" ? (
                  <>
                    <button type="button" className="btn-primary" disabled={pending || !arrived} title={arrived ? "" : "Available from the check-in date"} onClick={() => run(() => updateBookingStatus(b._id, "checked_in"))}><DoorOpen className="size-4" /> Guest checked in</button>
                    {arrived ? <button type="button" className="btn-outline" disabled={pending} onClick={() => run(() => updateBookingStatus(b._id, "no_show"))}><UserX className="size-4" /> No-show</button> : null}
                    <button type="button" className="btn-ghost text-rose-600" onClick={() => setMode("cancel")}>Cancel booking</button>
                  </>
                ) : (
                  <button type="button" className="btn-primary" disabled={pending} onClick={() => run(() => updateBookingStatus(b._id, "checked_out"))}><DoorClosed className="size-4" /> Guest checked out</button>
                )}
              </div>
            )}
          </div>
        ) : null}

        {isAdmin && b.commission?.amount ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin · commission</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {b.commission.status !== "paid" ? <button type="button" className="btn-outline btn-sm" disabled={pending} onClick={() => run(() => setCommissionStatus(b._id, "paid"))}><BadgeCheck className="size-3.5" /> Record as received</button> : null}
              {b.commission.status === "not_due" ? <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setCommissionStatus(b._id, "due"))}>Mark due</button> : null}
              {b.commission.status !== "waived" && b.commission.status !== "paid" ? <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setCommissionStatus(b._id, "waived"))}>Waive</button> : null}
              {b.commission.status === "paid" || b.commission.status === "waived" ? <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setCommissionStatus(b._id, "due"))}>Reopen</button> : null}
            </div>
          </div>
        ) : null}

        {b.history?.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
            <ol className="mt-2 space-y-2 border-l border-slate-200 pl-4 text-xs">
              {b.history.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-slate-300" />
                  <span className="font-medium text-ink">{BOOKING_STATUS[h.status]?.label ?? h.status}</span>
                  <span className="text-slate-500"> · {h.by} · {formatDate(h.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                  {h.note ? <p className="text-slate-600">{h.note}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        <p className="flex items-center gap-1 text-xs text-slate-400"><Clock className="size-3" /> Updated {timeAgo(b.updatedAt)}</p>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value, sub }: { icon: typeof Phone; label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-0 gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="truncate font-medium text-ink">{value}</dd>
        {sub ? <dd className="text-xs text-slate-500">{sub}</dd> : null}
      </div>
    </div>
  );
}

function Line({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={clsx("flex justify-between gap-3 py-0.5", className)}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
