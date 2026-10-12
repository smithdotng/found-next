"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { createOrder } from "@/app/actions/fractional";
import { FormMessage, SubmitButton } from "@/components/ui/form-bits";
import { formatPrice } from "@/lib/format";
import { RESERVATION_HOURS, primaryQuote } from "@/lib/fractional";

/**
 * Buy units: from the developer (primary) or from one resale listing.
 * `signedIn` false shows sign-in/up links that return here.
 */
export function InvestWidget({
  offeringId,
  slug,
  unitPrice,
  minUnits = 1,
  maxUnits,
  feePercent,
  signedIn,
  resaleId,
  compact,
}: {
  offeringId: string;
  slug: string;
  unitPrice: number;
  minUnits?: number;
  maxUnits: number;
  feePercent: number;
  signedIn: boolean;
  resaleId?: string;
  compact?: boolean;
}) {
  const [state, action] = useActionState(createOrder, null);
  const [units, setUnits] = useState(Math.min(maxUnits, Math.max(1, minUnits)));
  const q = primaryQuote(unitPrice, units, resaleId ? 0 : feePercent);
  const back = `/fractional/${slug}${resaleId ? "#resale" : "#invest"}`;
  const clamp = (v: number) => Math.min(maxUnits, Math.max(minUnits, Math.floor(v) || minUnits));

  if (maxUnits < minUnits) return <p className="text-sm text-slate-500">No units available right now.</p>;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="offeringId" value={offeringId} />
      {resaleId ? <input type="hidden" name="resaleId" value={resaleId} /> : null}
      <input type="hidden" name="back" value={back} />
      <div>
        <label className="field-label" htmlFor={`units-${resaleId ?? "p"}`}>Units</label>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-outline !px-3" onClick={() => setUnits((u) => clamp(u - 1))} aria-label="Fewer units" disabled={units <= minUnits}>
            <Minus className="size-4" />
          </button>
          <input
            id={`units-${resaleId ?? "p"}`}
            name="units"
            inputMode="numeric"
            className="field text-center text-lg font-bold"
            value={units}
            onChange={(e) => setUnits(Number(e.target.value.replace(/\D/g, "")) || 0)}
            onBlur={() => setUnits((u) => clamp(u))}
          />
          <button type="button" className="btn-outline !px-3" onClick={() => setUnits((u) => clamp(u + 1))} aria-label="More units" disabled={units >= maxUnits}>
            <Plus className="size-4" />
          </button>
        </div>
        <p className="field-hint">{formatPrice(unitPrice)} per unit{minUnits > 1 ? ` · minimum ${minUnits}` : ""} · {maxUnits.toLocaleString()} available</p>
      </div>

      <dl className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-sm">
        <div className="flex justify-between"><dt className="text-slate-600">{units} × {formatPrice(unitPrice)}</dt><dd className="font-medium">{formatPrice(q.amount)}</dd></div>
        {!resaleId ? <div className="flex justify-between"><dt className="text-slate-600">Found service fee ({feePercent}%)</dt><dd>{formatPrice(q.fee)}</dd></div> : null}
        <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-ink"><dt>You pay</dt><dd>{formatPrice(q.total)}</dd></div>
      </dl>

      {signedIn ? (
        <>
          <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
            <input type="checkbox" name="agree" className="mt-0.5 size-4 shrink-0 rounded accent-brand-600" />
            <span>
              I&apos;ve read the offering documents and understand that property investments can fall in value, returns aren&apos;t guaranteed and I may not be able to sell my units quickly.
            </span>
          </label>
          <FormMessage state={state} />
          <SubmitButton pendingText="Reserving…">{resaleId ? "Buy these units" : "Reserve units"}</SubmitButton>
          {!compact ? (
            <p className="flex items-start gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              We hold your units for {RESERVATION_HOURS} hours while you pay by bank transfer. Nothing is charged until you transfer.
            </p>
          ) : null}
        </>
      ) : (
        <div className="space-y-2">
          <Link href={`/invest/register?next=${encodeURIComponent(back)}`} className="btn-primary w-full py-3">Create investor account</Link>
          <Link href={`/login?next=${encodeURIComponent(back)}`} className="btn-outline w-full">I have a Found account</Link>
          <p className="text-center text-xs text-slate-500">Any Found account can invest. It takes two minutes.</p>
        </div>
      )}
    </form>
  );
}
