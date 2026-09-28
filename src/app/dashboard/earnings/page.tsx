import { Wallet, TrendingUp, Clock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Transaction, User, Withdrawal } from "@/lib/models";
import { PageHeader, StatCard } from "@/components/dashboard/ui";
import { EarningsForms } from "@/components/dashboard/earnings-forms";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Earnings" };

type W = { _id: string; amount: number; status: string; createdAt: string; processedAt?: string; transactionReference?: string };
type T = { _id: string; property?: { title: string }; transactionDate: string; paymentStatus: string; commissionSplit?: { agent?: { amount?: number } } };

export default async function EarningsPage() {
  const session = await requireUser(["agent"]);
  await connectDB();
  const [user, withdrawals, txs] = await Promise.all([
    User.findById(session.userId).select("agentProfile").lean<{ agentProfile?: { totalEarnings?: number; pendingWithdrawal?: number; bankDetails?: { bankName?: string; accountNumber?: string; accountName?: string } } }>(),
    Withdrawal.find({ agent: session.userId }).sort("-createdAt").limit(20).lean(),
    Transaction.find({ agent: session.userId }).sort("-transactionDate").limit(20).populate("property", "title").lean(),
  ]);
  const ap = user?.agentProfile ?? {};
  const w = toPlain<W[]>(withdrawals);
  const t = toPlain<T[]>(txs);
  const inFlight = w.filter((x) => x.status === "pending" || x.status === "approved").reduce((a, x) => a + x.amount, 0);

  return (
    <>
      <PageHeader title="Earnings" description="Commission from completed referrals, withdrawals and payout details." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Available to withdraw" value={formatPrice(ap.pendingWithdrawal ?? 0)} icon={Wallet} tone="emerald" />
        <StatCard label="Total earned" value={formatPrice(ap.totalEarnings ?? 0)} icon={TrendingUp} />
        <StatCard label="Withdrawals in progress" value={formatPrice(inFlight)} icon={Clock} tone="amber" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <EarningsForms balance={ap.pendingWithdrawal ?? 0} bank={ap.bankDetails} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-ink">Withdrawal history</h2>
          {w.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {w.map((x) => (
                <li key={x._id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-semibold text-ink">{formatPrice(x.amount)}</p>
                    <p className="text-xs text-slate-500">{formatDate(x.createdAt)}{x.transactionReference ? ` · Ref ${x.transactionReference}` : ""}</p>
                  </div>
                  <span className="chip capitalize bg-slate-50 text-slate-700 ring-slate-500/15">{x.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-sm text-slate-500">No withdrawals yet.</p>
          )}
        </section>
        <section className="card overflow-hidden">
          <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-ink">Commission from deals</h2>
          {t.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {t.map((x) => (
                <li key={x._id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{x.property?.title ?? "Property"}</p>
                    <p className="text-xs text-slate-500">{formatDate(x.transactionDate)} · {x.paymentStatus}</p>
                  </div>
                  <span className="font-semibold text-ink">{formatPrice(x.commissionSplit?.agent?.amount ?? 0)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-sm text-slate-500">When a referral you sent completes a deal, your commission shows up here.</p>
          )}
        </section>
      </div>
    </>
  );
}
