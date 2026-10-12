import Link from "next/link";
import clsx from "clsx";
import { Banknote, Search } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getAdminOrders } from "@/lib/fractional-data";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { PromptAction } from "@/components/fractional/forms";
import { SmartImage } from "@/components/ui/smart-image";
import { cancelOrder, confirmOrderPayment, markSellerPaid, recordRefund, rejectOrderPayment } from "@/app/actions/fractional";
import { formatDate, formatPrice } from "@/lib/format";
import { KYC_STATUS, ORDER_STATUS, type KycStatus } from "@/lib/fractional";

export const metadata = { title: "Fractional orders" };

export default async function FractionalOrdersPage({ searchParams }: PageProps<"/dashboard/fractional-orders">) {
  await requireUser(["admin"]);
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "payment_submitted";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const { items, counts } = await getAdminOrders({ status, q });
  const tabs = [
    { key: "payment_submitted", label: "To confirm", count: counts.payment_submitted ?? 0 },
    { key: "pending_payment", label: "Awaiting payment", count: counts.pending_payment ?? 0 },
    { key: "payouts", label: "Seller payouts due", count: counts.payouts },
    { key: "confirmed", label: "Confirmed", count: counts.confirmed ?? 0 },
    { key: "all", label: "All" },
  ].map((t) => ({ ...t, href: `/dashboard/fractional-orders?status=${t.key}` }));

  return (
    <>
      <PageHeader title="Fractional orders" description="Match investor transfers to orders, confirm units, pay resale sellers and record refunds." />
      <Tabs tabs={tabs} active={status} />
      <form className="mb-5 mt-4 flex gap-2" action="/dashboard/fractional-orders">
        <input type="hidden" name="status" value={status} />
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} className="field !pl-9" placeholder="Order ref, offering, payer name or transfer reference" />
        </label>
        <button className="btn-outline">Search</button>
      </form>

      {items.length ? (
        <div className="space-y-3">
          {items.map((o) => {
            const inv = typeof o.investor === "string" ? null : o.investor;
            const off = typeof o.offering === "string" ? null : o.offering;
            const seller = typeof o.seller === "object" ? (o.seller as { name: string; email?: string; investorProfile?: { bankDetails?: { bankName?: string; accountNumber?: string; accountName?: string } } }) : null;
            const kyc = (inv?.investorProfile?.kycStatus ?? "none") as KycStatus;
            return (
              <article key={o._id} className="card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/dashboard/investments/orders/${o.reference}`} className="font-mono text-sm font-bold text-ink hover:text-brand-600">{o.reference}</Link>
                      <span className={clsx("chip", ORDER_STATUS[o.status].tone)}>{ORDER_STATUS[o.status].label}</span>
                      {o.source === "resale" ? <span className="chip bg-slate-100 text-slate-700 ring-slate-500/20">Resale</span> : null}
                      {off?.status === "cancelled" && o.status === "confirmed" ? <span className="chip bg-rose-50 text-rose-700 ring-rose-600/20">Refund due</span> : null}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700">
                      <strong>{inv?.name}</strong> · {inv?.email} · <span className={clsx("chip !py-0", KYC_STATUS[kyc].tone)}>ID {KYC_STATUS[kyc].label.toLowerCase()}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {o.units} units in <Link href={`/dashboard/offerings/${off?._id}`} className="text-brand-600 hover:underline">{off?.title ?? o.offeringTitle}</Link> · <strong className="text-ink">{formatPrice(o.total)}</strong> · placed {formatDate(o.createdAt)}
                    </p>
                    {o.payment?.submittedAt ? (
                      <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        Paid by <strong>{o.payment.payerName}</strong>{o.payment.reference ? ` · ref ${o.payment.reference}` : ""} · {formatDate(o.payment.paidOn)}
                      </p>
                    ) : null}
                    {seller && o.sellerPayout?.amount ? (
                      <p className="mt-2 text-sm text-slate-600">
                        Seller <strong>{seller.name}</strong>: {formatPrice(o.sellerPayout.amount)} {o.sellerPayout.status === "paid" ? `paid ${formatDate(o.sellerPayout.paidAt)}` : "due"} to {seller.investorProfile?.bankDetails?.bankName} {seller.investorProfile?.bankDetails?.accountNumber} ({seller.investorProfile?.bankDetails?.accountName})
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 lg:w-72">
                    {o.payment?.proofImage ? (
                      <a href={o.payment.proofImage} target="_blank" rel="noopener noreferrer" className="relative block h-24 overflow-hidden rounded-xl bg-slate-100">
                        <SmartImage src={o.payment.proofImage} alt="Receipt" fill sizes="288px" className="object-cover" />
                      </a>
                    ) : null}
                    {["pending_payment", "payment_submitted"].includes(o.status) ? (
                      <ActionButton action={confirmOrderPayment.bind(null, o._id)} confirm={`Confirm ${formatPrice(o.total)} received for ${o.reference}?`} className="btn bg-emerald-600 text-white hover:bg-emerald-700 btn-sm">
                        Confirm payment received
                      </ActionButton>
                    ) : null}
                    {o.status === "payment_submitted" ? (
                      <PromptAction action={rejectOrderPayment.bind(null, o._id)} prompt="What's wrong? (sent to the investor)" required className="btn-outline btn-sm" confirmLabel="Send back">Payment not found</PromptAction>
                    ) : null}
                    {["pending_payment", "payment_submitted"].includes(o.status) ? (
                      <ActionButton action={cancelOrder.bind(null, o.reference)} confirm="Cancel this order and release the units?" className="btn-ghost btn-sm text-rose-600">Cancel order</ActionButton>
                    ) : null}
                    {o.sellerPayout?.status === "due" ? (
                      <PromptAction action={markSellerPaid.bind(null, o._id)} prompt="Transfer reference for the seller payout" required className="btn-primary btn-sm" confirmLabel="Record payout">Record seller payout</PromptAction>
                    ) : null}
                    {off?.status === "cancelled" && o.status === "confirmed" ? (
                      <PromptAction action={recordRefund.bind(null, o._id)} prompt={`Refund transfer reference (${formatPrice(o.total)})`} required className="btn-danger btn-sm" confirmLabel="Record refund">Record refund</PromptAction>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Banknote} title="Nothing here" text={status === "payment_submitted" ? "Payments investors say they've made will appear here to confirm." : "No orders match."} />
      )}
    </>
  );
}
