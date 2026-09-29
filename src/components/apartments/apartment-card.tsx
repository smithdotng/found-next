import Link from "next/link";
import { BedDouble, MapPin, Users, BadgeCheck } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { SaveButton } from "@/components/property/save-button";
import { formatPrice, locationLine, primaryImage } from "@/lib/format";
import type { OwnerLite, PropertyDoc } from "@/lib/types";

export function hostName(owner: PropertyDoc["owner"]) {
  const o = typeof owner === "object" ? (owner as OwnerLite) : null;
  if (!o) return "Found host";
  return o.hostProfile?.businessName || o.realtorProfile?.company || o.name;
}

export function isVerifiedHost(owner: PropertyDoc["owner"]) {
  const o = typeof owner === "object" ? (owner as OwnerLite) : null;
  return !!o && (o.hostProfile?.status === "approved" || !!o.realtorProfile?.verified);
}

export function ApartmentCard({ p, query = "", priority = false }: { p: PropertyDoc; query?: string; priority?: boolean }) {
  const sl = p.shortletDetails ?? {};
  const beds = p.features?.bedrooms || sl.maxGuests ? p.features?.bedrooms : undefined;
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        <SmartImage
          src={primaryImage(p)}
          alt={p.title}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          priority={priority}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {p.featured ? <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">Guest favourite</span> : <span />}
          <div className="relative z-10">
            <SaveButton id={p._id} />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-semibold text-ink">
            <Link href={`/apartments/${p.slug}${query}`} className="after:absolute after:inset-0">
              {p.title}
            </Link>
          </h3>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{locationLine(p.location)}</span>
        </p>
        <ul className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-slate-600">
          {sl.maxGuests ? <li className="flex items-center gap-1"><Users className="size-3.5 text-slate-400" /> {sl.maxGuests} guests</li> : null}
          {beds ? <li className="flex items-center gap-1"><BedDouble className="size-3.5 text-slate-400" /> {beds} bedroom{beds > 1 ? "s" : ""}</li> : null}
          {isVerifiedHost(p.owner) ? <li className="flex items-center gap-1 text-emerald-700"><BadgeCheck className="size-3.5" /> Vetted host</li> : null}
        </ul>
        <p className="mt-2 text-[15px] text-ink">
          <span className="font-bold">{formatPrice(p.price)}</span> <span className="text-sm text-slate-500">/ night</span>
        </p>
      </div>
    </article>
  );
}
