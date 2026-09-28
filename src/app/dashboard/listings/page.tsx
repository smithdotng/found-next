import Link from "next/link";
import { Building2, PlusCircle, Search } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getManagedListings } from "@/lib/dashboard";
import { PageHeader, Tabs, EmptyState } from "@/components/dashboard/ui";
import { ListingsTable } from "@/components/dashboard/listings-table";
import { Pagination } from "@/components/ui/pagination";
import { PROPERTY_TYPES } from "@/lib/format";

export const metadata = { title: "Listings" };

export default async function ListingsPage({ searchParams }: PageProps<"/dashboard/listings">) {
  const session = await requireUser(["realtor", "admin"]);
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const f = { status: pick("status") ?? "all", q: pick("q"), type: pick("type"), sort: pick("sort"), page: pick("page"), owner: pick("owner") };
  const data = await getManagedListings(session, f);
  const isAdmin = session.userType === "admin";

  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { ...f, page: undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "status" && v === "all")) q.set(k, v);
    const s = q.toString();
    return `/dashboard/listings${s ? `?${s}` : ""}`;
  };

  const tabs = [
    { key: "all", label: "All", count: data.counts.all },
    { key: "available", label: "Live", count: data.counts.available },
    { key: "pending", label: "Pending review", count: data.counts.pending },
    { key: "closed", label: "Sold / rented", count: data.counts.closed },
    { key: "unavailable", label: "Off market", count: data.counts.unavailable },
    { key: "rejected", label: "Rejected", count: data.counts.rejected },
  ].map((t) => ({ ...t, href: href({ status: t.key }) }));

  return (
    <>
      <PageHeader
        title={isAdmin ? "All listings" : "My listings"}
        description={isAdmin ? "Every property on the platform. Filter, review and update status." : "Manage availability, edit details and see which listings get attention."}
        actions={
          <Link href="/dashboard/listings/new" className="btn-primary">
            <PlusCircle className="size-4" /> Add listing
          </Link>
        }
      />
      <Tabs tabs={tabs} active={f.status} />

      <form className="mt-5 flex flex-col gap-2 sm:flex-row" action="/dashboard/listings">
        {f.status !== "all" ? <input type="hidden" name="status" value={f.status} /> : null}
        {f.owner ? <input type="hidden" name="owner" value={f.owner} /> : null}
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Search listings</span>
          <input name="q" defaultValue={f.q} placeholder="Search by title, city or address" className="field pl-9" />
        </label>
        <select name="type" defaultValue={f.type ?? ""} className="field sm:w-44" aria-label="Property type">
          <option value="">All types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.plural}</option>
          ))}
        </select>
        <select name="sort" defaultValue={f.sort ?? ""} className="field sm:w-44" aria-label="Sort">
          <option value="">Recently updated</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="views">Most viewed</option>
          <option value="price-desc">Price: high to low</option>
          <option value="price-asc">Price: low to high</option>
        </select>
        <button className="btn-outline">Apply</button>
      </form>

      <div className="mt-5">
        {data.items.length ? (
          <ListingsTable items={data.items} isAdmin={isAdmin} />
        ) : (
          <EmptyState
            icon={Building2}
            title={f.q || f.type || f.status !== "all" ? "No listings match" : "No listings yet"}
            text={f.q || f.type || f.status !== "all" ? "Try a different tab or clear your search." : "Add your first property — it only takes a few minutes."}
            action={<Link href="/dashboard/listings/new" className="btn-primary"><PlusCircle className="size-4" /> Add listing</Link>}
          />
        )}
      </div>
      <Pagination page={data.page} totalPages={data.totalPages} basePath="/dashboard/listings" params={{ ...f, status: f.status === "all" ? undefined : f.status }} />
    </>
  );
}
