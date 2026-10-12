import Link from "next/link";
import clsx from "clsx";
import { ArrowLeftRight, Coins, Layers, PieChart, ShieldAlert, TrendingUp, Wallet } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getInvestorProfile, getPortfolio } from "@/lib/fractional-data";
import { EmptyState, PageHeader, StatCard } from "@/components/dashboard/ui";
import { SmartImage } from "@/components/ui/smart-image";
import { formatCompactPrice, formatDate, formatPrice } from "@/lib/format";
import { KYC_STATUS, OFFERING_STATUS, ORDER_STATUS, pct } from "@/lib/fractional";

export const metadata = { title: "My investments" };

export default async function InvestmentsPage() {
  const session = await requireUser();
  const [p, profile] = await Promise.all([getPortfolio(session.userId), getInvestorProfile(session.userId)]);
  const kyc = profile?.investorProfile?.kycStatus ?? "none";
  const openOrders = p.orders.filter((o) => o.status === "pending_payment" || o.status === "payment_submitted");
  const first = session.userName.split(" ")[0];

  return (
    <>
      <PageHeader
        title={session.userType === "investor" ? `Hello, ${first}` : "My investments"}
        description="Your Found Fractional portfolio: properties you own a share of, payouts and orders."
        actions={<Link href="/fractional" className="btn-primary"><Layers className="size-4" /> Offerings</Link>}
      />

      {kyc !== "approved" ? (
        <div className={clsx("mb-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center", kyc === "pending" ? "bg-amber-50" : "bg-brand-50")}>
          <ShieldAlert className={clsx("size-6 shrink-0", kyc === "pending" ? "text-amber-600" : "text-brand-600")} />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-ink">{kyc === "none" ? "Verify your identity to invest" : kyc === "pending" ? "We're checking your ID" : "Your investor profile needs attention"}</p>
            <p className="text-slate-600">
              {kyc === "none"
                ? "It takes two minutes and works for every offering."
                : kyc === "pending"
                  ? "You can reserve units now; we confirm payments once your ID is verified, usually within a working day."
                  : profile?.investorProfile?.kycNote || "Please update your details."}
            </p>
          </div>
          {kyc !== "pending" ? <Link href="/dashboard/investments/profile" className="btn-primary btn-sm">{kyc === "none" ? "Verify now" : "Update profile"}</Link> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Portfolio value" value={formatCompactPrice(p.totals.value)} hint={p.totals.cost ? `${p.totals.gain >= 0 ? "+" : "−"}${formatCompactPrice(Math.abs(p.totals.gain))} vs cost` : "At latest valuations"} icon={PieChart} />
        <StatCard label="Invested" value={formatCompactPrice(p.totals.cost)} hint={`${p.totals.units.toLocaleString()} units`} icon={Wallet} tone="slate" />
        <StatCard label="Income received" value={formatCompactPrice(p.totals.income)} hint="Rent and sale proceeds" icon={Coins} tone="emerald" />
        <StatCard label="Properties" value={p.totals.properties} hint={openOrders.length ? `${openOrders.length} order${openOrders.length > 1 ? "s" : ""} in progress` : "Spread across more for less risk"} icon={TrendingUp} tone="coral" />
      </div>

      {openOrders.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-ink">Orders in progress</h2>
          <div className="space-y-3">
            {openOrders.map((o) => {
              const off = typeof o.offering === "string" ? null : o.offering;
              return (
                <Link key={o._id} href={`/dashboard/investments/orders/${o.reference}`} className="card flex items-center gap-4 p-4 transition hover:border-brand-200">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{off?.title ?? o.offeringTitle}</p>
                    <p className="text-xs text-slate-500">{o.reference} · {o.units} units · {formatPrice(o.total)}{o.expiresAt && o.status === "pending_payment" ? ` · held until ${formatDate(o.expiresAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : ""}</p>
                  </div>
                  <span className={clsx("chip", ORDER_STATUS[o.status].tone)}>{ORDER_STATUS[o.status].label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Holdings</h2>
          {p.holdings.length ? <Link href="/dashboard/investments/sell" className="text-sm font-medium text-brand-600 hover:underline"><ArrowLeftRight className="mr-1 inline size-3.5" />Transfer units</Link> : null}
        </div>
        {p.holdings.length ? (
          <div className="card overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {p.holdings.map((h) => {
                const o = h.offering;
                const unitValue = o.currentUnitValue || o.unitPrice;
                const value = h.units * unitValue;
                const change = h.costBasis ? pct(value - h.costBasis, h.costBasis) : 0;
                return (
                  <li key={h._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <SmartImage src={o.images?.[0]} alt="" fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/fractional/${o.slug}`} className="block truncate font-semibold text-ink hover:text-brand-600">{o.title}</Link>
                        <p className="text-xs text-slate-500">
                          <span className={clsx("chip mr-1.5 !py-0", OFFERING_STATUS[o.status].tone)}>{OFFERING_STATUS[o.status].label}</span>
                          {h.units.toLocaleString()} units{h.unitsListed ? ` (${h.unitsListed} listed for sale)` : ""}
                          {o.valuationDate ? ` · valued ${formatDate(o.valuationDate)}` : ""}
                        </p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-3 gap-4 text-right text-sm sm:w-96">
                      <div><dt className="text-xs text-slate-500">Cost</dt><dd className="font-medium text-ink">{formatCompactPrice(h.costBasis)}</dd></div>
                      <div>
                        <dt className="text-xs text-slate-500">Value</dt>
                        <dd className="font-semibold text-ink">{formatCompactPrice(value)}</dd>
                        {change ? <dd className={clsx("text-xs font-semibold", change > 0 ? "text-emerald-700" : "text-rose-600")}>{change > 0 ? "+" : ""}{change}%</dd> : null}
                      </div>
                      <div><dt className="text-xs text-slate-500">Income</dt><dd className="font-medium text-emerald-700">{formatCompactPrice(h.distributionsReceived)}</dd></div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon={PieChart}
            title="You don't own any units yet"
            text="Pick a property, choose how many units you want and pay by bank transfer. You can start from the price of one unit."
            action={<Link href="/fractional" className="btn-primary">See open offerings</Link>}
          />
        )}
      </section>

      {p.distributions.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-ink">Payouts</h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-100 text-left text-xs text-slate-500">
                <tr><th className="px-4 py-2.5 font-medium">Property</th><th className="px-4 py-2.5 font-medium">Type</th><th className="px-4 py-2.5 font-medium">Declared</th><th className="px-4 py-2.5 text-right font-medium">Amount</th><th className="px-4 py-2.5 text-right font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {p.distributions.map((d) => (
                  <tr key={d._id}>
                    <td className="px-4 py-2.5 font-medium text-ink">{d.offering?.title}</td>
                    <td className="px-4 py-2.5 text-slate-600">{d.kind === "exit" ? "Sale proceeds" : d.kind === "rental" ? "Rental income" : "Other"}{d.period ? ` · ${d.period}` : ""}</td>
                    <td className="px-4 py-2.5 text-slate-600">{formatDate(d.declaredAt)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-ink">{formatPrice(d.line?.amount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={clsx("chip", d.line?.status === "paid" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-800 ring-amber-600/20")}>
                        {d.line?.status === "paid" ? `Paid ${formatDate(d.line.paidAt)}` : "On its way"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {p.orders.some((o) => !["pending_payment", "payment_submitted"].includes(o.status)) ? (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-ink">Order history</h2>
          <div className="card divide-y divide-slate-100">
            {p.orders.filter((o) => !["pending_payment", "payment_submitted"].includes(o.status)).map((o) => (
              <Link key={o._id} href={`/dashboard/investments/orders/${o.reference}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-50">
                <span className="min-w-0 truncate"><span className="font-medium text-ink">{o.offeringTitle}</span> <span className="text-slate-500">· {o.reference} · {o.units} units{o.source === "resale" ? " (resale)" : ""}</span></span>
                <span className="flex shrink-0 items-center gap-3"><span className="font-medium">{formatPrice(o.total)}</span><span className={clsx("chip", ORDER_STATUS[o.status].tone)}>{ORDER_STATUS[o.status].label}</span></span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-8 text-xs text-slate-500">
        Investor profile: <span className={clsx("chip", KYC_STATUS[kyc].tone)}>{KYC_STATUS[kyc].label}</span>. Values use the latest independent valuation where one is published, otherwise the unit price paid.
      </p>
    </>
  );
}
