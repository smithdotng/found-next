import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getPortfolio } from "@/lib/fractional-data";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { SellForm } from "@/components/fractional/forms";
import { withdrawListing } from "@/app/actions/fractional";
import { formatDate, formatPrice } from "@/lib/format";
import { DEFAULT_FEES, TRADABLE_STATUSES } from "@/lib/fractional";

export const metadata = { title: "Sell units" };

export default async function SellPage() {
  const session = await requireUser();
  const p = await getPortfolio(session.userId);
  const sellable = p.holdings
    .filter((h) => TRADABLE_STATUSES.includes(h.offering.status) && h.offering.resaleEnabled && h.units - h.unitsListed > 0)
    .map((h) => ({
      offeringId: h.offering._id,
      title: h.offering.title,
      free: h.units - h.unitsListed,
      unitPrice: h.units ? Math.round(h.costBasis / h.units) : h.offering.unitPrice,
      value: h.offering.currentUnitValue || h.offering.unitPrice,
      resaleFee: h.offering.fees?.resale ?? DEFAULT_FEES.resale,
    }));

  return (
    <>
      <PageHeader
        title="Sell units"
        description="List units on the Found Fractional resale market. You set the price; when a buyer's payment is confirmed, Found pays you the proceeds less the resale fee."
        actions={<Link href="/fractional/market" className="btn-outline"><ArrowLeftRight className="size-4" /> Resale market</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="card p-6">
          <h2 className="mb-4 font-semibold text-ink">New listing</h2>
          <SellForm holdings={sellable} />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-ink">Your listings</h2>
          {p.listings.length ? (
            <ul className="space-y-3">
              {p.listings.map((l) => {
                const off = typeof l.offering === "string" ? null : l.offering;
                const left = l.units - l.unitsSold;
                return (
                  <li key={l._id} className="card flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/fractional/${off?.slug}#resale`} className="block truncate font-medium text-ink hover:text-brand-600">{off?.title}</Link>
                      <p className="text-xs text-slate-500">
                        {left} of {l.units} units at {formatPrice(l.pricePerUnit)} · listed {formatDate(l.createdAt)}
                        {l.unitsReserved ? ` · ${l.unitsReserved} with a buyer` : ""}
                      </p>
                    </div>
                    <ActionButton action={withdrawListing.bind(null, l._id)} confirm="Withdraw this listing?" className="btn-ghost btn-sm text-rose-600">Withdraw</ActionButton>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={ArrowLeftRight} title="No units listed" text="Units you list appear on the resale market and on the property's page." />
          )}
        </section>
      </div>
    </>
  );
}
