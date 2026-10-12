import Link from "next/link";
import clsx from "clsx";
import { MapPin, TrendingUp, Wallet } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { formatCompactPrice, formatPrice, stateLabel } from "@/lib/format";
import { OFFERING_STATUS, STAGE_LABEL, daysLeft, fundingProgress, isOpen, unitsAvailable, type OfferingDoc } from "@/lib/fractional";

export function FundingBar({ o, size = "md" }: { o: OfferingDoc; size?: "sm" | "md" }) {
  const f = fundingProgress(o);
  return (
    <div>
      <div className={clsx("relative overflow-hidden rounded-full bg-slate-100", size === "sm" ? "h-1.5" : "h-2.5")} role="progressbar" aria-valuenow={f.soldPct} aria-valuemin={0} aria-valuemax={100} aria-label="Funded">
        <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500" style={{ width: `${f.soldPct}%` }} />
        <div className="absolute inset-y-0 rounded-full bg-emerald-200" style={{ left: `${f.soldPct}%`, width: `${f.reservedPct}%` }} />
        <div className="absolute inset-y-0 w-px bg-slate-400/70" style={{ left: `${o.softCapPercent}%` }} title={`Minimum raise: ${o.softCapPercent}%`} />
      </div>
      <div className={clsx("mt-1.5 flex justify-between text-slate-500", size === "sm" ? "text-[11px]" : "text-xs")}>
        <span><strong className="text-ink">{f.soldPct}%</strong> funded{f.reservedPct ? ` · ${f.reservedPct}% reserved` : ""}</span>
        <span>{formatCompactPrice(f.raised)} of {formatCompactPrice(f.target)}</span>
      </div>
    </div>
  );
}

export function OfferingCard({ o }: { o: OfferingDoc }) {
  const open = isOpen(o);
  const left = daysLeft(o.closesAt);
  const st = OFFERING_STATUS[o.status];
  const p = o.projections ?? {};
  return (
    <Link href={`/fractional/${o.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <SmartImage src={o.images?.[0]} alt={o.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={clsx("chip backdrop-blur", st.tone)}>{open ? "Open" : st.label}</span>
          <span className="chip bg-white/90 text-slate-700 ring-slate-500/10 backdrop-blur">{STAGE_LABEL[o.stage]}</span>
        </div>
        {open && left !== null ? (
          <span className="absolute bottom-3 right-3 rounded-lg bg-ink/75 px-2 py-1 text-xs font-semibold text-white">{left === 0 ? "Closes today" : `${left} days left`}</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-semibold text-ink group-hover:text-brand-700">{o.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="size-3.5" /> {[o.location?.city, stateLabel(o.location?.state)].filter(Boolean).join(", ")}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="flex items-center gap-1 text-xs text-slate-500"><Wallet className="size-3.5" /> From</dt>
            <dd className="mt-0.5 font-bold text-ink">{formatPrice(o.unitPrice * (o.minUnits || 1))}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="flex items-center gap-1 text-xs text-slate-500"><TrendingUp className="size-3.5" /> Target, not guaranteed</dt>
            <dd className="mt-0.5 font-bold text-ink">
              {p.rentalYield ? `${p.rentalYield}% yield` : p.appreciation ? `${p.appreciation}% p.a.` : "—"}
              {p.rentalYield && p.appreciation ? <span className="font-medium text-slate-500"> + {p.appreciation}%</span> : null}
            </dd>
          </div>
        </dl>
        <div className="mt-auto pt-5">
          <FundingBar o={o} size="sm" />
          {open ? <p className="mt-2 text-xs text-slate-500">{unitsAvailable(o).toLocaleString()} units left at {formatPrice(o.unitPrice)}</p> : null}
        </div>
      </div>
    </Link>
  );
}
