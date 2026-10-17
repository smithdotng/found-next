import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { parseFilters, searchProperties, getFacetCounts, findCityInState } from "@/lib/queries";
import { areaPath, stateFromSlug } from "@/lib/locations";
import { PropertyGrid } from "@/components/property/property-card";
import { PropertyFilters, SortSelect } from "@/components/property/filters";
import { Pagination } from "@/components/ui/pagination";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { PROPERTY_TYPES, formatCompactPrice, stateLabel, txLabel, typeLabel } from "@/lib/format";

type Params = Promise<{ state: string; area: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

async function resolveArea(stateSlug: string, areaSlug: string) {
  const state = stateFromSlug(stateSlug);
  if (!state) return null;
  const city = await findCityInState(state, areaSlug);
  if (!city) return null;
  return { state, city };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { state: stateSlug, area } = await params;
  const r = await resolveArea(stateSlug, area);
  if (!r) return pageMetadata({ title: "Area not found", path: `/${stateSlug}/${area}`, noIndex: true });
  const where = `${r.city}, ${stateLabel(r.state)}`;
  return pageMetadata({
    title: `Property for Sale & Rent in ${where}`,
    description: `Browse verified homes, land and shortlets in ${where} on Found. Every listing is reviewed before it goes live, with agency fees capped at 10%.`,
    path: areaPath(r.state, r.city)!,
  });
}

export default async function AreaPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { state: stateSlug, area } = await params;
  const r = await resolveArea(stateSlug, area);
  if (!r) notFound();

  const sp = parseFilters(await searchParams);
  const f = { ...sp, state: r.state, city: r.city };
  const [{ items, total, page, totalPages }, facets] = await Promise.all([searchProperties(f), getFacetCounts()]);

  const basePath = areaPath(r.state, r.city)!;
  const where = `${r.city}, ${stateLabel(r.state)}`;
  const typeName = f.type ? PROPERTY_TYPES.find((t) => t.value === f.type)?.plural ?? "Property" : "Property";
  const h1 = `${typeName}${f.transactionType ? ` ${txLabel(f.transactionType).toLowerCase()}` : f.type ? "" : " for sale & rent"} in ${where}`;

  // Filters other than the path-bound state/city appear as removable chips.
  const chips: { key: string; label: string; clear: string[] }[] = [];
  if (f.search) chips.push({ key: "search", label: `“${f.search}”`, clear: ["search"] });
  if (f.type) chips.push({ key: "type", label: typeLabel(f.type), clear: ["type"] });
  if (f.transactionType) chips.push({ key: "tx", label: txLabel(f.transactionType), clear: ["transactionType"] });
  if (f.minPrice || f.maxPrice)
    chips.push({ key: "price", label: `${f.minPrice ? formatCompactPrice(+f.minPrice) : "₦0"} – ${f.maxPrice ? formatCompactPrice(+f.maxPrice) : "any"}`, clear: ["minPrice", "maxPrice"] });
  if (f.bedrooms) chips.push({ key: "beds", label: `${f.bedrooms}+ beds`, clear: ["bedrooms"] });

  const without = (keys: string[]) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && !keys.includes(k) && k !== "page" && k !== "state" && k !== "city") q.set(k, String(v));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const paginationParams = Object.fromEntries(Object.entries(sp).filter(([k]) => k !== "state" && k !== "city")) as Record<string, string | undefined>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Properties", item: absoluteUrl("/properties") },
      { "@type": "ListItem", position: 3, name: stateLabel(r.state), item: absoluteUrl(`/properties?state=${encodeURIComponent(r.state)}`) },
      { "@type": "ListItem", position: 4, name: r.city, item: absoluteUrl(basePath) },
    ],
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        <Suspense>
          <div className="hidden lg:block">
            <PropertyFilters facets={facets} />
          </div>
        </Suspense>
        <div>
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-slate-500">
            <Link href="/" className="hover:text-ink">Home</Link>
            <span>›</span>
            <Link href={`/properties?state=${encodeURIComponent(r.state)}`} className="hover:text-ink">{stateLabel(r.state)}</Link>
            <span>›</span>
            <span className="text-slate-700">{r.city}</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{h1}</h1>
              <p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} {total === 1 ? "property" : "properties"} available</p>
            </div>
            <div className="flex items-center gap-2">
              <Suspense>
                <div className="lg:hidden"><PropertyFilters facets={facets} /></div>
                <SortSelect />
              </Suspense>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            Browse verified homes, land and shortlets in {where} on Found. Every listing is reviewed before it goes live,
            agency fees are capped at 10%, and you deal through Found so both sides are protected.
          </p>

          {/* In-area cross-links to each property type */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => (
              <Link
                key={t.value}
                href={`${basePath}?type=${t.value}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${f.type === t.value ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
              >
                {t.plural} in {r.city}
              </Link>
            ))}
          </div>

          {chips.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <Link key={c.key} href={without(c.clear)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-2 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                  {c.label} <X className="size-3.5" />
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            <PropertyGrid items={items} columns={3} emptyText={`No listings match these filters in ${r.city} yet. Try widening your budget or clearing a filter.`} />
          </div>
          <Pagination page={page} totalPages={totalPages} basePath={basePath} params={paginationParams} />
        </div>
      </div>
    </div>
  );
}
