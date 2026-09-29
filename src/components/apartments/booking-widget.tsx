"use client";

import { useActionState, useMemo, useState } from "react";
import clsx from "clsx";
import { CalendarDays, ChevronDown, Info, Minus, Plus, ShieldCheck } from "lucide-react";
import { requestBooking } from "@/app/actions/bookings";
import { SubmitButton } from "@/components/ui/form-bits";
import { RangeCalendar } from "./range-calendar";
import { formatPrice } from "@/lib/format";
import { nightsBetween, nightsSet, parseDay, quoteStay, stayDates, type Range } from "@/lib/stay";
import type { ShortletDetails } from "@/lib/types";

type State = { ok: boolean; message: string; errors?: Record<string, string> } | null;

export function BookingWidget({
  propertyId,
  price,
  sd,
  ranges,
  today,
  initial,
}: {
  propertyId: string;
  price: number;
  sd: ShortletDetails;
  ranges: Range[];
  today: string;
  initial: { checkIn?: string; checkOut?: string; guests?: string };
}) {
  const [state, action] = useActionState<State, FormData>(requestBooking, null);
  const blocked = useMemo(() => nightsSet(ranges), [ranges]);
  const maxGuests = sd.maxGuests || 2;
  const minNights = sd.minimumStay || 1;

  // Only accept initial dates from the search if they're actually free.
  const [validInitial] = useState(() => {
    const ci = initial.checkIn ?? "";
    const co = initial.checkOut ?? "";
    const a = parseDay(ci);
    const b = parseDay(co);
    if (!a || !b || b <= a || ci < today) return { ci: "", co: "" };
    for (const n of nightsSet([{ start: ci, end: co }])) if (blocked.has(n)) return { ci: "", co: "" };
    return { ci, co };
  });

  const [checkIn, setCheckIn] = useState(validInitial.ci);
  const [checkOut, setCheckOut] = useState(validInitial.co);
  const [guests, setGuests] = useState(Math.min(maxGuests, Math.max(1, parseInt(initial.guests ?? "") || 1)));
  const [showCal, setShowCal] = useState(!validInitial.ci);

  const nights = checkIn && checkOut ? nightsBetween(parseDay(checkIn)!, parseDay(checkOut)!) : 0;
  const q = nights ? quoteStay(price, sd, parseDay(checkIn)!, parseDay(checkOut)!) : null;
  const tooLong = !!sd.maximumStay && nights > sd.maximumStay;
  const err = state?.errors;

  const fmt = (d: string) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" }) : "Add date");

  return (
    <form action={action} className="card p-5 sm:p-6" noValidate>
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <input type="hidden" name="guests" value={guests} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <p className="text-2xl font-extrabold tracking-tight text-ink">
        {formatPrice(price)} <span className="text-sm font-medium text-slate-500">/ night</span>
      </p>
      {sd.weekendRate ? <p className="text-xs text-slate-500">{formatPrice(sd.weekendRate)} on Friday & Saturday nights</p> : null}

      <div className={clsx("mt-4 overflow-hidden rounded-xl border", err?.dates ? "border-rose-300" : "border-slate-300")}>
        <button type="button" onClick={() => setShowCal((v) => !v)} className="grid w-full grid-cols-2 divide-x divide-slate-300 text-left">
          <span className="px-3 py-2.5">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Check-in</span>
            <span className={clsx("text-sm", checkIn ? "font-medium text-ink" : "text-slate-400")}>{fmt(checkIn)}</span>
          </span>
          <span className="flex items-center justify-between px-3 py-2.5">
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Check-out</span>
              <span className={clsx("text-sm", checkOut ? "font-medium text-ink" : "text-slate-400")}>{fmt(checkOut)}</span>
            </span>
            <ChevronDown className={clsx("size-4 text-slate-400 transition", showCal && "rotate-180")} />
          </span>
        </button>
        <div className="flex items-center justify-between border-t border-slate-300 px-3 py-2">
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Guests</span>
            <span className="text-sm font-medium text-ink">{guests} guest{guests > 1 ? "s" : ""}</span>
          </span>
          <span className="flex items-center gap-2">
            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} className="grid size-8 place-items-center rounded-full border border-slate-300 disabled:opacity-30" aria-label="Fewer guests"><Minus className="size-3.5" /></button>
            <button type="button" onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))} disabled={guests >= maxGuests} className="grid size-8 place-items-center rounded-full border border-slate-300 disabled:opacity-30" aria-label="More guests"><Plus className="size-3.5" /></button>
          </span>
        </div>
      </div>
      {err?.dates ? <p className="mt-1 text-xs text-rose-600">{err.dates}</p> : null}
      <p className="mt-1 text-xs text-slate-500">Sleeps up to {maxGuests} · minimum {minNights} night{minNights > 1 ? "s" : ""}</p>

      {showCal ? (
        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <RangeCalendar
            today={today}
            blocked={blocked}
            checkIn={checkIn}
            checkOut={checkOut}
            minNights={minNights}
            months={1}
            onChange={(ci, co) => {
              setCheckIn(ci);
              setCheckOut(co);
              if (ci && co) setShowCal(false);
            }}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {checkIn && !checkOut ? `Now pick check-out (min ${minNights} night${minNights > 1 ? "s" : ""})` : "Pick check-in"}</span>
            {checkIn ? <button type="button" className="font-semibold text-ink underline" onClick={() => { setCheckIn(""); setCheckOut(""); }}>Clear</button> : null}
          </div>
        </div>
      ) : null}

      {q ? (
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>{q.weekendNights ? `${nights} nights (${q.weekendNights} weekend)` : `${formatPrice(price)} × ${nights} night${nights > 1 ? "s" : ""}`}</dt>
            <dd>{formatPrice(q.base)}</dd>
          </div>
          {q.discount ? (
            <div className="flex justify-between text-emerald-700">
              <dt>{q.discountType === "monthly" ? "Monthly" : "Weekly"} discount ({q.discountPercent}%)</dt>
              <dd>−{formatPrice(q.discount)}</dd>
            </div>
          ) : null}
          {q.cleaningFee ? (
            <div className="flex justify-between text-slate-600"><dt>Cleaning fee</dt><dd>{formatPrice(q.cleaningFee)}</dd></div>
          ) : null}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-ink"><dt>Total</dt><dd>{formatPrice(q.total)}</dd></div>
          {q.securityDeposit ? (
            <p className="flex items-start gap-1.5 text-xs text-slate-500"><Info className="mt-0.5 size-3.5 shrink-0" /> Plus a refundable caution fee of {formatPrice(q.securityDeposit)}, returned after check-out.</p>
          ) : null}
          {tooLong ? <p className="text-xs text-rose-600">Maximum stay is {sd.maximumStay} nights.</p> : null}
        </dl>
      ) : null}

      <div className="mt-5 space-y-3">
        <Field name="name" label="Full name" autoComplete="name" error={err?.name} />
        <div className="grid grid-cols-2 gap-3">
          <Field name="phone" label="Phone" type="tel" autoComplete="tel" placeholder="0803 123 4567" error={err?.phone} />
          <Field name="email" label="Email" type="email" autoComplete="email" error={err?.email} />
        </div>
        <div>
          <label className="field-label" htmlFor="bk-message">Message to host (optional)</label>
          <textarea id="bk-message" name="message" rows={2} className="field" placeholder="Arrival time, purpose of stay, special requests…" />
        </div>
      </div>

      {state && !state.ok && !state.errors ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{state.message}</p> : null}
      {state?.errors && !state.ok ? <p className="mt-3 text-sm text-rose-600" role="alert">{state.message}</p> : null}

      <div className="mt-4">
        <SubmitButton pendingText="Sending request…" className="btn-accent w-full py-3 text-base">
          {q ? `Request to book · ${stayDates(checkIn, checkOut)}` : "Request to book"}
        </SubmitButton>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        You won&apos;t pay anything now. The host confirms your dates, then contacts you to arrange payment. Only pay once your booking shows as confirmed.
      </p>
    </form>
  );
}

function Field({ name, label, error, ...rest }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="field-label" htmlFor={`bk-${name}`}>{label}</label>
      <input id={`bk-${name}`} name={name} className={clsx("field", error && "border-rose-400")} {...rest} />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
