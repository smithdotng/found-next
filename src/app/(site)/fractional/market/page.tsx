import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeftRight, ArrowRight, MapPin } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { formatPrice, stateLabel } from "@/lib/format";
import { getMarketListings } from "@/lib/fractional-data";
import { PageHero } from "@/components/site/page-hero";
import { SmartImage } from "@/components/ui/smart-image";
import { DEFAULT_FEES, FRACTIONAL_OPEN, PRELAUNCH_NOTICE } from "@/lib/fractional";

export const metadata: Metadata = pageMetadata({
  title: "Investor Transfers | Found Fractional",
  absoluteTitle: true,
  description: "Units in funded Found Fractional properties that existing investors have offered to transfer, where permitted by SEC rules.",
  path: "/fractional/market",
});

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const listings = FRACTIONAL_OPEN ? await getMarketListings() : [];
  // One row per offering: the cheapest listing and total units for sale.
  const byOffering = new Map<string, { o: Exclude<(typeof listings)[number]["offering"], string>; cheapest: number; units: number; count: number }>();
  for (const l of listings) {
    if (typeof l.offering === "string") continue;
    const avail = l.units - l.unitsSold - l.unitsReserved;
    const row = byOffering.get(l.offering._id) ?? { o: l.offering, cheapest: l.pricePerUnit, units: 0, count: 0 };
    row.cheapest = Math.min(row.cheapest, l.pricePerUnit);
    row.units += avail;
    row.count += 1;
    byOffering.set(l.offering._id, row);
  }
  const rows = [...byOffering.values()];

  return (
    <>
      <PageHero
        eyebrow="Found Fractional"
        title="Investor transfers"
        lead={FRACTIONAL_OPEN ? `Units in funded properties that existing investors have offered to transfer, after any lock-in period. Prices are set by sellers and may not reflect value; sellers pay a ${DEFAULT_FEES.resale}% fee. There may be no buyer for units you hold.` : PRELAUNCH_NOTICE}
        crumbs={[{ href: "/fractional", label: "Found Fractional" }, { label: "Investor transfers" }]}
      />
      <section className="container-page py-12">
        {rows.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ o, cheapest, units, count }) => {
              const ref = o.currentUnitValue || o.unitPrice;
              const diff = Math.round(((cheapest - ref) / ref) * 100);
              return (
                <Link key={o._id} href={`/fractional/${o.slug}#resale`} className="card group overflow-hidden transition hover:shadow-lift">
                  <div className="relative aspect-[16/9] bg-slate-100">
                    <SmartImage src={o.images?.[0]} alt={o.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-ink group-hover:text-brand-700">{o.title}</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5" /> {[o.location?.city, stateLabel(o.location?.state)].filter(Boolean).join(", ")}</p>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-500">From</p>
                        <p className="text-xl font-bold text-ink">{formatPrice(cheapest)}<span className="text-sm font-normal text-slate-500"> / unit</span></p>
                        <p className={clsx("text-xs font-semibold", diff > 0 ? "text-coral-600" : diff < 0 ? "text-emerald-700" : "text-slate-500")}>
                          {diff === 0 ? "At latest valuation" : `${Math.abs(diff)}% ${diff > 0 ? "above" : "below"} valuation`}
                        </p>
                      </div>
                      <p className="text-right text-xs text-slate-500">
                        <strong className="block text-base text-ink">{units.toLocaleString()}</strong>units · {count} seller{count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <ArrowLeftRight className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 font-semibold text-ink">No units offered for transfer</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Units appear here when investors in funded properties offer them for transfer, where SEC rules allow.</p>
            <Link href="/fractional" className="btn-primary mt-6">About Found Fractional <ArrowRight className="size-4" /></Link>
          </div>
        )}
      </section>
    </>
  );
}
