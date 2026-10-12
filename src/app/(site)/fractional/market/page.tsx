import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeftRight, ArrowRight, MapPin } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { formatPrice, stateLabel } from "@/lib/format";
import { getMarketListings } from "@/lib/fractional-data";
import { PageHero } from "@/components/site/page-hero";
import { SmartImage } from "@/components/ui/smart-image";
import { DEFAULT_FEES } from "@/lib/fractional";

export const metadata: Metadata = pageMetadata({
  title: "Resale Market - Buy Units From Other Investors | Found Fractional",
  absoluteTitle: true,
  description: "Buy units in funded Found Fractional properties from existing investors, often already earning rent. No buyer service fee.",
  path: "/fractional/market",
});

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const listings = await getMarketListings();
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
        title="Resale market"
        lead={`Buy units in funded properties from investors who want to sell. Prices are set by sellers; buyers pay no service fee and sellers pay ${DEFAULT_FEES.resale}% when their units sell.`}
        crumbs={[{ href: "/fractional", label: "Found Fractional" }, { label: "Resale market" }]}
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
            <p className="mt-3 font-semibold text-ink">No units for resale right now</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Units appear here when investors in funded properties choose to sell. Meanwhile, see what&apos;s open for investment.</p>
            <Link href="/fractional#offerings" className="btn-primary mt-6">Open offerings <ArrowRight className="size-4" /></Link>
          </div>
        )}
      </section>
    </>
  );
}
