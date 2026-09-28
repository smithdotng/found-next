import { Search } from "lucide-react";
import { requireUser } from "@/lib/session";
import { parseFilters, searchProperties } from "@/lib/queries";
import { connectDB } from "@/lib/db";
import { Promotion } from "@/lib/models";
import { PageHeader } from "@/components/dashboard/ui";
import { PromoteGrid } from "@/components/dashboard/promote-grid";
import { Pagination } from "@/components/ui/pagination";
import { PROPERTY_TYPES } from "@/lib/format";

export const metadata = { title: "Find properties to promote" };

export default async function PromotePage({ searchParams }: PageProps<"/dashboard/promote">) {
  const session = await requireUser(["agent"]);
  const f = parseFilters(await searchParams);
  const [{ items, page, totalPages, total }] = await Promise.all([searchProperties(f)]);
  await connectDB();
  const mine = await Promotion.find({ agent: session.userId }).select("property referralLink").lean<{ property: unknown; referralLink: string }[]>();
  const promoted = Object.fromEntries(mine.map((m) => [String(m.property), m.referralLink]));

  return (
    <>
      <PageHeader title="Find properties to promote" description={`${total} live listings. Get a tracked link and earn 70% of the agency fee when your referral closes.`} />
      <form className="mb-6 flex flex-col gap-2 sm:flex-row" action="/dashboard/promote">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Search</span>
          <input name="search" defaultValue={f.search} placeholder="Area, estate or keyword" className="field pl-9" />
        </label>
        <select name="type" defaultValue={f.type ?? ""} className="field sm:w-48" aria-label="Type">
          <option value="">All types</option>
          {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.plural}</option>)}
        </select>
        <select name="sort" defaultValue={f.sort ?? ""} className="field sm:w-48" aria-label="Sort">
          <option value="">Recommended</option>
          <option value="price-desc">Highest price (bigger fee)</option>
          <option value="popular">Most viewed</option>
          <option value="newest">Newest</option>
        </select>
        <button className="btn-outline">Search</button>
      </form>
      <PromoteGrid items={items} promoted={promoted} />
      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/promote" params={f as Record<string, string>} />
    </>
  );
}
