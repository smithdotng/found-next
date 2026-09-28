import { Search, Users } from "lucide-react";
import { requireUser, isSuperAdmin } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Property, User } from "@/lib/models";
import { escapeRegex } from "@/lib/format";
import { PageHeader, Tabs, EmptyState } from "@/components/dashboard/ui";
import { UsersTable, type UserRow } from "@/components/dashboard/users-table";
import { Pagination } from "@/components/ui/pagination";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: PageProps<"/dashboard/users">) {
  const session = await requireUser(["admin"]);
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const type = pick("type") ?? "all";
  const q = pick("q");
  const page = Math.max(1, parseInt(pick("page") ?? "1") || 1);
  const perPage = 30;

  await connectDB();
  const query: Record<string, unknown> = {};
  if (type === "realtor" || type === "agent" || type === "admin") query.userType = type;
  if (type === "unverified") Object.assign(query, { userType: "realtor", "realtorProfile.verified": { $ne: true } });
  if (type === "suspended") query.isSuspended = true;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }, { "realtorProfile.company": rx }];
  }
  const [users, total, counts] = await Promise.all([
    User.find(query).select("-password -resetPasswordToken").sort("-createdAt").skip((page - 1) * perPage).limit(perPage).lean(),
    User.countDocuments(query),
    User.aggregate([{ $group: { _id: "$userType", count: { $sum: 1 } } }]),
  ]);
  const ids = users.map((u) => u._id);
  const listingCounts = await Property.aggregate([{ $match: { owner: { $in: ids } } }, { $group: { _id: "$owner", count: { $sum: 1 } } }]);
  const lc = Object.fromEntries(listingCounts.map((x: { _id: unknown; count: number }) => [String(x._id), x.count]));
  const rows = toPlain<UserRow[]>(users).map((u) => ({ ...u, listings: lc[u._id] ?? 0 }));
  const c = Object.fromEntries(counts.map((x: { _id: string; count: number }) => [x._id, x.count]));

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ type, q, ...patch })) if (v && !(k === "type" && v === "all")) p.set(k, v);
    return `/dashboard/users${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Users" description="Realtors, agents and admins. Verify realtors, approve agents and manage access." />
      <Tabs
        active={type}
        tabs={[
          { key: "all", label: "All", count: (c.realtor ?? 0) + (c.agent ?? 0) + (c.admin ?? 0) },
          { key: "realtor", label: "Realtors", count: c.realtor ?? 0 },
          { key: "agent", label: "Agents", count: c.agent ?? 0 },
          { key: "unverified", label: "Unverified realtors" },
          { key: "suspended", label: "Suspended" },
          { key: "admin", label: "Admins", count: c.admin ?? 0 },
        ].map((t) => ({ ...t, href: href({ type: t.key }) }))}
      />
      <form className="mt-4 flex gap-2" action="/dashboard/users">
        {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Search users</span>
          <input name="q" defaultValue={q} placeholder="Search name, email, phone or company" className="field pl-9" />
        </label>
        <button className="btn-outline">Search</button>
      </form>
      <div className="mt-5">
        {rows.length ? <UsersTable rows={rows} superAdmin={isSuperAdmin(session)} selfId={session.userId} /> : <EmptyState icon={Users} title="No users found" />}
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / perPage))} basePath="/dashboard/users" params={{ type: type === "all" ? undefined : type, q }} />
    </>
  );
}
