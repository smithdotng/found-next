import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { parseFilters, searchProperties, getFacetCounts } from "@/lib/queries";
import { PropertyGrid } from "@/components/property/property-card";
import { PropertyFilters, SortSelect } from "@/components/property/filters";
import { Pagination } from "@/components/ui/pagination";
import { pageMetadata } from "@/lib/seo";
import { PROPERTY_TYPES, formatCompactPrice, stateLabel, txLabel, typeLabel } from "@/lib/format";

function heading(f: ReturnType<typeof parseFilters>) {
  const type = f.type ? PROPERTY_TYPES.find((t) => t.value === f.type)?.plural ?? "Properties" : "Properties";
  const tx = f.transactionType ? ` ${txLabel(f.transactionType).toLowerCase()}` : f.type ? "" : " for sale & rent";
  const where = f.state ? ` in ${stateLabel(f.state)}` : " in Nigeria";
  return `${type}${tx}${where}`;
}

export async function generateMetadata({ searchParams }: PageProps<"/properties">): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const title = f.type || f.transactionType || f.state ? `${heading(f)} - Found Properties` : "Properties for Sale & Rent in Nigeria - Found Properties";
  const qs = new URLSearchParams();
  if (f.type) qs.set("type", f.type);
  if (f.transactionType) qs.set("transactionType", f.transactionType);
  if (f.state) qs.set("state", f.state);
  return pageMetadata({
    title,
    absoluteTitle: true,
    description: `Browse verified ${heading(f).toLowerCase()} on Found. Filter by type, location and budget, and contact realtors directly.`,
    path: `/properties${qs.toString() ? `?${qs}` : ""}`,
  });
}

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const f = parseFilters(await searchParams);
  const [{ items, total, page, totalPages }, facets] = await Promise.all([searchProperties(f), getFacetCounts()]);

  const chips: { key: string; label: string; clear: string[] }[] = [];
  if (f.search) chips.push({ key: "search", label: `“${f.search}”`, clear: ["search"] });
  if (f.type) chips.push({ key: "type", label: typeLabel(f.type), clear: ["type"] });
  if (f.transactionType) chips.push({ key: "tx", label: txLabel(f.transactionType), clear: ["transactionType"] });
  if (f.state) chips.push({ key: "state", label: stateLabel(f.state), clear: ["state"] });
  if (f.minPrice || f.maxPrice)
    chips.push({
      key: "price",
      label: `${f.minPrice ? formatCompactPrice(+f.minPrice) : "₦0"} – ${f.maxPrice ? formatCompactPrice(+f.maxPrice) : "any"}`,
      clear: ["minPrice", "maxPrice"],
    });
  if (f.bedrooms) chips.push({ key: "beds", label: `${f.bedrooms}+ beds`, clear: ["bedrooms"] });

  const without = (keys: string[]) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v && !keys.includes(k) && k !== "page") q.set(k, v);
    const s = q.toString();
    return s ? `/properties?${s}` : "/properties";
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        <Suspense>
          <div className="hidden lg:block">
            <PropertyFilters facets={facets} />
          </div>
        </Suspense>
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{heading(f)}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {total.toLocaleString()} {total === 1 ? "property" : "properties"} available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Suspense>
                <div className="lg:hidden">
                  <PropertyFilters facets={facets} />
                </div>
                <SortSelect />
              </Suspense>
            </div>
          </div>

          {chips.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <Link
                  key={c.key}
                  href={without(c.clear)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                >
                  {c.label} <X className="size-3.5" />
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            <PropertyGrid
              items={items}
              columns={3}
              emptyText="No properties match these filters yet. Try widening your budget or choosing another state."
            />
          </div>
          <Pagination page={page} totalPages={totalPages} basePath="/properties" params={f as Record<string, string>} />
        </div>
      </div>
    </div>
  );
}
