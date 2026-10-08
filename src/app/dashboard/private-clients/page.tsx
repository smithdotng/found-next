import Link from "next/link";
import { Gem } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { PrivateClient } from "@/lib/models";
import { EmptyState, PageHeader, StatCard } from "@/components/dashboard/ui";
import { PrivateClientRow, type ClientRow } from "@/components/dashboard/private-client-row";

export const metadata = { title: "Prestige clients" };

export default async function PrivateClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(["admin"]);
  const sp = await searchParams;
  const status = typeof sp.status === "string" && ["new", "contacted", "qualified", "closed"].includes(sp.status) ? sp.status : undefined;
  await connectDB();
  const [items, counts, partners] = await Promise.all([
    PrivateClient.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(200).populate("property", "title slug").lean(),
    PrivateClient.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    PrivateClient.aggregate([{ $match: { partner: { $nin: [null, ""] } } }, { $group: { _id: "$partner", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
  ]);
  const c = Object.fromEntries((counts as { _id: string; n: number }[]).map((x) => [x._id, x.n])) as Record<string, number>;
  const rows = toPlain<ClientRow[]>(items);
  const tab = (s?: string, label?: string) => (
    <Link key={s ?? "all"} href={s ? `/dashboard/private-clients?status=${s}` : "/dashboard/private-clients"} className={`chip ${status === s ? "bg-ink text-white ring-ink" : "bg-white text-slate-700 ring-slate-200"}`}>
      {label} {s ? c[s] ?? 0 : Object.values(c).reduce((a, b) => a + b, 0)}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Found Prestige clients"
        description="Private client requests from found.ng/prestige. Call new clients within one working day."
        actions={<Link href="/prestige" target="_blank" className="btn-outline">View Prestige page</Link>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New" value={c.new ?? 0} tone="coral" icon={Gem} />
        <StatCard label="Contacted" value={c.contacted ?? 0} />
        <StatCard label="Qualified" value={c.qualified ?? 0} tone="emerald" />
        <StatCard label="From partners" value={(partners as { n: number }[]).reduce((a, p) => a + p.n, 0)} hint={(partners as { _id: string; n: number }[]).map((p) => `${p._id} ${p.n}`).join(" · ") || "Share ?partner= links"} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tab(undefined, "All")}
        {tab("new", "New")}
        {tab("contacted", "Contacted")}
        {tab("qualified", "Qualified")}
        {tab("closed", "Closed")}
      </div>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <PrivateClientRow key={r._id} r={r} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Gem} title="No private clients yet" text="Requests from the Prestige page appear here. Share found.ng/prestige?partner=yourpartner links with banks and law firms to track referrals." />
      )}
    </>
  );
}
