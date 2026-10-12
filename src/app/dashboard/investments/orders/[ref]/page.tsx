import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Clock, X } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getOrderForUser } from "@/lib/fractional-data";
import { PageHeader } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { PaymentForm } from "@/components/fractional/forms";
import { CopyButton } from "@/components/ui/copy-button";
import { cancelOrder } from "@/app/actions/fractional";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/fractional";
import { PAYMENT_ACCOUNT } from "@/lib/verification";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: PageProps<"/dashboard/investments/orders/[ref]">) {
  const session = await requireUser();
  const { ref } = await params;
  const o = await getOrderForUser(ref, session.userId, session.userType === "admin");
  if (!o) notFound();
  const off = typeof o.offering === "string" ? null : o.offering;
  const acct =
    o.source === "primary" && off?.paymentAccount?.accountNumber
      ? { bank: off.paymentAccount.bankName ?? "", accountName: off.paymentAccount.accountName ?? "", accountNumber: off.paymentAccount.accountNumber }
      : PAYMENT_ACCOUNT;
  const st = ORDER_STATUS[o.status];
  const rows = [
    { label: "Account name", value: acct.accountName },
    { label: "Account number", value: acct.accountNumber, mono: true },
    { label: "Bank", value: acct.bank },
    { label: "Narration", value: o.reference, mono: true },
    { label: "Amount", value: String(o.total), display: formatPrice(o.total), mono: true },
  ];

  return (
    <>
      <Link href="/dashboard/investments" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink"><ArrowLeft className="size-4" /> My investments</Link>
      <PageHeader
        title={`Order ${o.reference}`}
        description={<>{o.units} units in <Link href={`/fractional/${off?.slug}`} className="font-medium text-brand-600 hover:underline">{off?.title ?? o.offeringTitle}</Link>{o.source === "resale" ? " · bought from another investor" : ""}</>}
        actions={<span className={clsx("chip", st.tone)}>{st.label}</span>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {o.status === "pending_payment" ? (
            <section className="card p-6">
              <h2 className="font-semibold text-ink">1. Transfer {formatPrice(o.total)}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-800">
                <Clock className="size-4" /> Units held until {formatDate(o.expiresAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </p>
              {o.note ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{o.note}</p> : null}
              <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-brand-100 bg-brand-50/50 px-4">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <dt className="text-xs text-slate-500">{r.label}</dt>
                      <dd className={r.mono ? "font-mono text-lg font-bold tracking-wide text-ink" : "font-semibold text-ink"}>{r.display ?? r.value}</dd>
                    </div>
                    <CopyButton value={r.value} />
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                {o.source === "primary" && off?.paymentAccount?.accountNumber
                  ? "This is the property company's escrow account. Funds are only released to the developer if the raise reaches its minimum."
                  : "Pay Found Projects & Realty Limited. Found holds the money until the units are transferred to you."}{" "}
                Use the order reference as the narration so we can match your payment.
              </p>
              <h2 className="mt-8 font-semibold text-ink">2. Tell us you&apos;ve paid</h2>
              <div className="mt-4"><PaymentForm reference={o.reference} defaultName={session.userName} /></div>
            </section>
          ) : o.status === "payment_submitted" ? (
            <section className="card p-6">
              <Clock className="size-8 text-brand-600" />
              <h2 className="mt-3 font-semibold text-ink">We&apos;re checking your transfer</h2>
              <p className="mt-1 text-sm text-slate-600">We&apos;ll confirm your units as soon as the payment reaches the account, usually within one working day. You&apos;ll get an email when it&apos;s done.</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">Paid by</dt><dd className="font-medium text-ink">{o.payment?.payerName}</dd></div>
                <div><dt className="text-slate-500">Reference</dt><dd className="font-medium text-ink">{o.payment?.reference || "—"}</dd></div>
              </dl>
            </section>
          ) : o.status === "confirmed" ? (
            <section className="card p-6">
              <CheckCircle2 className="size-8 text-emerald-600" />
              <h2 className="mt-3 font-semibold text-ink">You own {o.units} units</h2>
              <p className="mt-1 text-sm text-slate-600">Confirmed {formatDate(o.payment?.confirmedAt)}. They&apos;re registered in your name in the property company.</p>
              <Link href="/dashboard/investments" className="btn-primary mt-4">View portfolio</Link>
            </section>
          ) : (
            <section className="card p-6">
              <X className="size-8 text-slate-400" />
              <h2 className="mt-3 font-semibold text-ink">{st.label}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {o.status === "expired" ? "We didn't receive a payment in time, so the units were released. If you paid, contact hello@found.ng with your reference." : o.status === "refunded" ? `Refunded ${formatPrice(o.refund?.amount)} on ${formatDate(o.refund?.at)}.` : "This order was cancelled."}
              </p>
              {off?.slug ? <Link href={`/fractional/${off.slug}`} className="btn-outline mt-4">Back to the offering</Link> : null}
            </section>
          )}
        </div>

        <aside className="card self-start p-6">
          <h2 className="font-semibold text-ink">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">{o.units} × {formatPrice(o.unitPrice)}</dt><dd>{formatPrice(o.amount)}</dd></div>
            {o.fee ? <div className="flex justify-between"><dt className="text-slate-600">Found service fee</dt><dd>{formatPrice(o.fee)}</dd></div> : null}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-ink"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">Placed {formatDate(o.createdAt)}</p>
          {o.status === "pending_payment" ? (
            <div className="mt-4">
              <ActionButton action={cancelOrder.bind(null, o.reference)} confirm="Cancel this order and release the units?" className="btn-ghost btn-sm text-rose-600">Cancel order</ActionButton>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
