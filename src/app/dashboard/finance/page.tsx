import { Receipt, Wallet } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Transaction, Withdrawal } from "@/lib/models";
import { PageHeader, StatCard, EmptyState } from "@/components/dashboard/ui";
import { WithdrawalActions } from "@/components/dashboard/withdrawal-actions";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Transactions" };

type Tx = {
  _id: string;
  property?: { title: string };
  agent?: { name: string };
  buyer?: { name?: string };
  transactionType: string;
  amount: number;
  agencyFee: number;
  paymentStatus: string;
  transactionDate: string;
  commissionSplit?: { platform?: { amount?: number } };
};
type W = { _id: string; agent?: { name: string; email: string }; amount: number; status: string; createdAt: string; bankDetails: { bankName: string; accountNumber: string; accountName: string } };

export default async function FinancePage() {
  await requireUser(["admin"]);
  await connectDB();
  const [txs, ws] = await Promise.all([
    Transaction.find().sort("-transactionDate").limit(100).populate("property", "title").populate("agent", "name").lean(),
    Withdrawal.find().sort({ status: 1, createdAt: -1 }).limit(100).populate("agent", "name email").lean(),
  ]);
  const t = toPlain<Tx[]>(txs);
  const w = toPlain<W[]>(ws);
  const completed = t.filter((x) => x.paymentStatus === "completed");
  const revenue = completed.reduce((a, x) => a + (x.commissionSplit?.platform?.amount ?? 0), 0);
  const pendingW = w.filter((x) => x.status === "pending" || x.status === "approved");

  return (
    <>
      <PageHeader title="Transactions & payouts" description="Completed deals, platform revenue and agent withdrawal requests." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Completed deals" value={completed.length} icon={Receipt} />
        <StatCard label="Platform revenue" value={formatPrice(revenue)} icon={Receipt} tone="emerald" />
        <StatCard label="Pending payouts" value={formatPrice(pendingW.reduce((a, x) => a + x.amount, 0))} hint={`${pendingW.length} request${pendingW.length === 1 ? "" : "s"}`} icon={Wallet} tone="amber" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-ink">Withdrawal requests</h2>
        {w.length ? (
          <div className="card divide-y divide-slate-100">
            {w.map((x) => (
              <div key={x._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{formatPrice(x.amount)} <span className="font-normal text-slate-500">· {x.agent?.name ?? "Agent"}</span></p>
                  <p className="text-xs text-slate-500">{x.bankDetails.bankName} · {x.bankDetails.accountNumber} · {x.bankDetails.accountName} · requested {formatDate(x.createdAt)}</p>
                </div>
                <span className="chip capitalize bg-slate-50 text-slate-700 ring-slate-500/15">{x.status}</span>
                {x.status === "pending" || x.status === "approved" ? <WithdrawalActions id={x._id} status={x.status} /> : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Wallet} title="No withdrawal requests" />
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-ink">Transactions</h2>
        {t.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Agency fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {t.map((x) => (
                  <tr key={x._id}>
                    <td className="px-4 py-3 font-medium text-ink">{x.property?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{x.agent?.name ?? "Direct"}</td>
                    <td className="px-4 py-3">{formatPrice(x.amount)}</td>
                    <td className="px-4 py-3">{formatPrice(x.agencyFee)}</td>
                    <td className="px-4 py-3 capitalize">{x.paymentStatus}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(x.transactionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Receipt} title="No transactions recorded yet" />
        )}
      </section>
    </>
  );
}
