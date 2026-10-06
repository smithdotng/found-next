import Link from "next/link";
import { BedDouble, Bath, MapPin, Ruler, Car, Eye, BadgeCheck } from "lucide-react";
import { isPropertyVerified } from "@/lib/verification";
import { SmartImage } from "@/components/ui/smart-image";
import { SaveButton } from "./save-button";
import { formatPrice, locationLine, primaryImage, priceSuffix, txLabel, typeLabel } from "@/lib/format";
import type { PropertyDoc } from "@/lib/types";

export function PropertyCard({ p, priority = false }: { p: PropertyDoc; priority?: boolean }) {
  const f = p.features ?? {};
  const facts = [
    f.bedrooms ? { icon: BedDouble, label: `${f.bedrooms} bed` } : null,
    f.bathrooms ? { icon: Bath, label: `${f.bathrooms} bath` } : null,
    f.landArea ? { icon: Ruler, label: `${f.landArea.toLocaleString()} sqm` } : f.floorArea ? { icon: Ruler, label: `${f.floorArea.toLocaleString()} sqm` } : null,
    !f.bedrooms && f.parkingSpaces ? { icon: Car, label: `${f.parkingSpaces} parking` } : null,
  ].filter(Boolean) as { icon: typeof Bath; label: string }[];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <SmartImage
          src={primaryImage(p)}
          alt={p.title}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          priority={priority}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">{txLabel(p.transactionType)}</span>
            {p.featured || p.listingTier === "premium" ? (
              <span className="rounded-full bg-coral-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">Featured</span>
            ) : null}
            {isPropertyVerified(p) ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                <BadgeCheck className="size-3.5" /> Verified
              </span>
            ) : null}
          </div>
          <div className="relative z-10">
            <SaveButton id={p._id} />
          </div>
        </div>
        {p.images?.length > 1 ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-ink/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            1/{p.images.length}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{typeLabel(p.propertyType)}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          <Link href={p.propertyType === "shortlet" ? `/apartments/${p.slug}` : `/properties/${p.slug}`} className="after:absolute after:inset-0">
            {p.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-[13px] text-slate-500">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{locationLine(p.location)}</span>
        </p>
        {facts.length ? (
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            {facts.map((x) => (
              <li key={x.label} className="flex items-center gap-1">
                <x.icon className="size-3.5 text-slate-400" /> {x.label}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="text-lg font-bold tracking-tight text-ink">
            {formatPrice(p.price)}
            <span className="ml-1 text-xs font-medium text-slate-500">{priceSuffix(p)}</span>
          </p>
          {p.views ? (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Eye className="size-3.5" /> {p.views.toLocaleString()}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function PropertyGrid({
  items,
  emptyText = "No properties found.",
  columns = 4,
}: {
  items: PropertyDoc[];
  emptyText?: string;
  columns?: 3 | 4;
}) {
  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">{emptyText}</p>;
  }
  return (
    <div className={columns === 4 ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"}>
      {items.map((p, i) => (
        <PropertyCard key={p._id} p={p} priority={i < 4} />
      ))}
    </div>
  );
}
