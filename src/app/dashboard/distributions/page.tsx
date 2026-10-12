import Link from "next/link";
import { HandCoins } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { FractionalDistribution, FractionalOffering } from "@/lib/models";
import { EmptyState, PageHeader, StatCard } from "@/components/dashboard/ui";
import { PromptAction } from "@/components/fractional/forms";
import { markDistributionPaid } from "@/app/actions/fractional";
import { formatCompactPrice, formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Distributions" };

type Dist = {
  _id: string;
  offering: { _id: string; title: string; slug: string };
  kind: string;
  period?: string;
  gross: number;
  managementFee: number;
  net: number;
  perUnit?: number;
  declaredAt: string;
  lines: { status: string; amount: number }[];
};

export default async function DistributionsPage() {
  await requireUser(["admin"]);
  await connectDB();
  const [list, eligible] = await Promise.all([
    FractionalDistribution.find().sort({ declaredAt: -1 }).limit(100).populate("offering", "title slug").lean(),
    FractionalOffering.find({ status: { $in: ["funded", "active", "exited"] } }).select("title").sort({ title: 1 }).lean<{ _id: unknown; title: string }[]>(),
  ]);
  const items = toPlain<Dist[]>(list);
  const due = items.reduce((a, d) => a + d.lines.filter((l) => l.status === "due").reduce((s, l) => s + l.amount, 0), 0);
  const paid = items.reduce((a, d) => a + d.lines.filter((l) => l.status === "paid").reduce((s, l) => s + l.amount, 0), 0);
  const fees = items.reduce((a, d) => a + (d.managementFee || 0), 0);

  return (
    <>
      <PageHeader title="Distributions" description="Rental income and sale proceeds declared to investors. Declare new ones from each offering's page." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="To pay out" value={formatCompactPrice(due)} tone="amber" icon={HandCoins} />
        <StatCard label="Paid to investors" value={formatCompactPrice(paid)} tone="emerald" />
        <StatCard label="Management fees" value={formatCompactPrice(fees)} tone="slate" />
      </div>
      {eligible.length ? (
        <p className="mt-6 text-sm text-slate-600">
          Declare for:{" "}
          {eligible.map((o, i) => (
            <span key={String(o._id)}>{i ? " · " : ""}<Link href={`/dashboard/offerings/${String(o._id)}`} className="font-medium text-brand-600 hover:underline">{o.title}</Link></span>
          ))}
        </p>
      ) : null}
      <div className="mt-6">
        {items.length ? (
          <div className="card divide-y divide-slate-100">
            {items.map((d) => {
              const dueLines = d.lines.filter((l) => l.status === "due");
              return (
                <div key={d._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/offerings/${d.offering?._id}`} className="font-medium text-ink hover:text-brand-600">{d.offering?.title}</Link>
                    <p className="text-xs text-slate-500">
                      {d.kind === "exit" ? "Sale proceeds" : d.kind === "rental" ? "Rental income" : "Other"}{d.period ? ` · ${d.period}` : ""} · declared {formatDate(d.declaredAt)} · {d.lines.length} investors · {formatPrice(d.perUnit)} / unit
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-ink">{formatPrice(d.net)}</p>
                    <p className="text-xs text-slate-500">of {formatPrice(d.gross)} gross</p>
                  </div>
                  <div className="sm:w-56">
                    {dueLines.length ? (
                      <PromptAction action={markDistributionPaid.bind(null, d._id)} prompt="Bulk transfer reference" required className="btn-outline btn-sm w-full" confirmLabel="Mark paid">Mark {dueLines.length} paid</PromptAction>
                    ) : (
                      <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-600/20">All paid</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={HandCoins} title="No distributions yet" text="Once a funded property earns rent or is sold, declare the amount from its offering page and it's split between investors automatically." />
        )}
      </div>
    </>
  );
}
