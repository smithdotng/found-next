"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { projectReturns } from "@/lib/fractional";

/** Illustrative "what if" calculator using an offering's target yield and growth. */
export function ReturnsCalculator({
  unitPrice,
  minUnits = 1,
  rentalYield,
  appreciation,
  holdMonths,
  managementFee,
}: {
  unitPrice: number;
  minUnits?: number;
  rentalYield?: number;
  appreciation?: number;
  holdMonths?: number;
  managementFee: number;
}) {
  const presets = [1, 5, 10, 20].map((m) => Math.max(minUnits, m));
  const [units, setUnits] = useState(presets[1]);
  const invested = units * unitPrice;
  const r = projectReturns(invested, { rentalYield, appreciation, holdMonths, managementFee });
  const bar = (v: number) => `${Math.max(2, Math.min(100, (v / Math.max(1, r.endValue + r.income)) * 100))}%`;
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-ink">Scenario illustration for {units} units</h3>
      <p className="mt-1 text-sm text-slate-500">What the developer&apos;s targets would mean over {r.years % 1 ? r.years.toFixed(1) : r.years} years if they were met exactly. This is not a forecast or a promise.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from(new Set(presets)).map((p) => (
          <button key={p} type="button" onClick={() => setUnits(p)} className={units === p ? "btn-primary btn-sm" : "btn-outline btn-sm"}>
            {p} units
          </button>
        ))}
      </div>
      <input type="range" min={minUnits} max={Math.max(50, minUnits * 10)} value={units} onChange={(e) => setUnits(Number(e.target.value))} className="mt-4 w-full accent-brand-600" aria-label="Units" />
      <dl className="mt-4 space-y-3 text-sm">
        <Row label="You invest" value={formatPrice(invested)} width={bar(invested)} tone="bg-slate-300" />
        {rentalYield ? <Row label={`Rent at target (${r.netYield.toFixed(1)}% a year after fees)`} value={formatPrice(r.income)} width={bar(r.income)} tone="bg-emerald-400" /> : null}
        {appreciation ? <Row label={`Value change at target (${appreciation}% a year)`} value={formatPrice(r.growth)} width={bar(r.growth)} tone="bg-brand-400" /> : null}
      </dl>
      <div className="mt-5 flex items-end justify-between border-t border-slate-200 pt-4">
        <span className="text-sm text-slate-600">If every target is met</span>
        <span className="text-right">
          <span className="block text-2xl font-bold text-ink">{formatPrice(r.total)}</span>
          <span className="text-xs font-semibold text-emerald-700">+{r.totalPct}% on {formatPrice(invested)}</span>
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between rounded-xl bg-rose-50 px-3 py-2.5">
        <span className="text-sm text-rose-900">If the property earns no rent and falls 30% in value</span>
        <span className="text-right text-sm font-bold text-rose-700">−{formatPrice(Math.round(invested * 0.3))}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Targets are set by the developer and are not guaranteed by the developer or Found. Actual rent, costs, completion dates and sale prices will differ, returns could be nil, and you could lose some or all of the money you invest.
      </p>
    </div>
  );
}

function Row({ label, value, width, tone }: { label: string; value: string; width: string; tone: string }) {
  return (
    <div>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-600">{label}</dt>
        <dd className="font-semibold text-ink">{value}</dd>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width }} />
      </div>
    </div>
  );
}
