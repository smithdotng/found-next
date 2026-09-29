import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import {
  BadgeCheck, Bath, BedDouble, Check, ChevronRight, Clock, DoorOpen, KeyRound, MapPin, Pencil, ScrollText, ShieldCheck, Users,
} from "lucide-react";
import { getApartment, getSimilarApartments, getUnavailableRanges } from "@/lib/apartments";
import { connectDB } from "@/lib/db";
import { Property } from "@/lib/models";
import { getSession } from "@/lib/session";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { formatPrice, locationLine, plainText, stateLabel } from "@/lib/format";
import { CANCELLATION_POLICIES, isoDay, todayLagos } from "@/lib/stay";
import type { OwnerLite } from "@/lib/types";
import { Gallery } from "@/components/property/gallery";
import { ShareBar } from "@/components/property/share-bar";
import { SaveButton } from "@/components/property/save-button";
import { SmartImage } from "@/components/ui/smart-image";
import { BookingWidget } from "@/components/apartments/booking-widget";
import { ApartmentCard, hostName, isVerifiedHost } from "@/components/apartments/apartment-card";

export async function generateMetadata({ params }: PageProps<"/apartments/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getApartment(slug);
  if (!p) return pageMetadata({ title: "Apartment not found", path: `/apartments/${slug}`, noIndex: true });
  const sl = p.shortletDetails ?? {};
  const where = `${p.location?.city}, ${stateLabel(p.location?.state)}`;
  return pageMetadata({
    title: `${p.title} — ${formatPrice(p.price)}/night | Found Apartments`,
    absoluteTitle: true,
    description: `🏡 Shortlet in ${where} · sleeps ${sl.maxGuests ?? 2}${p.features?.bedrooms ? ` · ${p.features.bedrooms} bedroom${p.features.bedrooms > 1 ? "s" : ""}` : ""} · ${formatPrice(p.price)} per night. ${plainText(p.description, 110)}`,
    path: `/apartments/${p.slug}`,
    image: p.images?.[0]?.url || "/assets/images/og-apartments.jpg",
    imageAlt: p.title,
    type: "article",
    keywords: `${p.title}, shortlet ${p.location?.city}, shortlet apartment ${stateLabel(p.location?.state)}, book shortlet Nigeria, Found Apartments`,
    publishedTime: p.createdAt,
    modifiedTime: p.updatedAt,
    noIndex: p.status !== "available",
  });
}

export default async function ApartmentPage({ params, searchParams }: PageProps<"/apartments/[slug]">) {
  const [{ slug }, sp, session] = await Promise.all([params, searchParams, getSession()]);
  const p = await getApartment(slug);
  if (!p) notFound();
  const owner = (typeof p.owner === "object" ? p.owner : null) as (OwnerLite & { createdAt?: string }) | null;
  const isOwner = !!session.userId && owner?._id === session.userId;
  const isAdmin = session.userType === "admin";
  if (p.status !== "available" && !isOwner && !isAdmin) notFound();

  after(async () => {
    await connectDB();
    await Property.updateOne({ _id: p._id }, { $inc: { views: 1 } });
  });

  const [ranges, similar] = await Promise.all([getUnavailableRanges(p._id), getSimilarApartments(p)]);
  const sl = p.shortletDetails ?? {};
  const f = p.features ?? {};
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const url = absoluteUrl(`/apartments/${p.slug}`);
  const verified = isVerifiedHost(p.owner);
  const host = hostName(p.owner);
  const extras = [f.furnished && "furnished", f.serviced && "serviced", f.powerSupply && "24/7 power", f.borehole && "running water"].filter(Boolean) as string[];
  const amenities = [...new Set([...(sl.amenities ?? []), ...extras])];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: p.title,
    description: plainText(p.description, 300),
    url,
    image: (p.images ?? []).map((i) => absoluteUrl(i.url)),
    occupancy: { "@type": "QuantitativeValue", maxValue: sl.maxGuests ?? 2 },
    numberOfBedrooms: f.bedrooms || undefined,
    amenityFeature: amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
    address: { "@type": "PostalAddress", addressLocality: p.location?.city, addressRegion: p.location?.state, addressCountry: "NG" },
    offers: { "@type": "Offer", price: p.price, priceCurrency: "NGN", unitText: "night" },
  };

  return (
    <div className="container-page pb-28 pt-4 lg:pb-12 lg:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-4 hidden items-center gap-1 text-xs text-slate-500 sm:flex">
        <Link href="/apartments" className="hover:text-ink">Found Apartments</Link>
        <ChevronRight className="size-3" />
        <Link href={`/apartments?where=${encodeURIComponent(p.location?.city ?? "")}#results`} className="hover:text-ink">{p.location?.city}</Link>
        <ChevronRight className="size-3" />
        <span className="truncate text-slate-700">{p.title}</span>
      </nav>

      {p.status !== "available" ? (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-600/20">
          This apartment isn&apos;t live yet{p.status === "pending" ? " — it's awaiting review by the Found team" : ""}. Only you and Found admins can see this page.
        </div>
      ) : null}

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">{p.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="size-4 text-coral-500" /> {locationLine(p.location)}
            {p.location?.landmark ? <span className="text-slate-400">· near {p.location.landmark}</span> : null}
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <SaveButton id={p._id} variant="button" />
          {isOwner || isAdmin ? <Link href={`/dashboard/listings/${p._id}/edit`} className="btn-outline"><Pencil className="size-4" /> Edit</Link> : null}
        </div>
      </div>

      <Gallery images={p.images ?? []} title={p.title} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-lg font-semibold text-ink">Hosted by {host}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Users className="size-4 text-slate-400" /> {sl.maxGuests ?? 2} guests</span>
                {f.bedrooms ? <span className="flex items-center gap-1"><BedDouble className="size-4 text-slate-400" /> {f.bedrooms} bedroom{f.bedrooms > 1 ? "s" : ""}</span> : null}
                {f.bathrooms ? <span className="flex items-center gap-1"><Bath className="size-4 text-slate-400" /> {f.bathrooms} bath{f.bathrooms > 1 ? "s" : ""}</span> : null}
              </p>
            </div>
            <SmartImage
              src={owner?.profileImage && owner.profileImage !== "default-avatar.jpg" ? owner.profileImage : "/assets/images/default-avatar.jpg"}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow"
            />
          </div>

          <ul className="space-y-5 border-b border-slate-200 py-6">
            {verified ? (
              <Highlight icon={BadgeCheck} title="Vetted by Found" text="This host has been reviewed by the Found team and signed our host agreement." />
            ) : null}
            <Highlight icon={DoorOpen} title={`Check-in from ${sl.checkInTime ?? "14:00"}`} text={`Check-out by ${sl.checkOutTime ?? "11:00"}. Minimum stay ${sl.minimumStay ?? 1} night${(sl.minimumStay ?? 1) > 1 ? "s" : ""}.`} />
            <Highlight icon={ShieldCheck} title="Request first, pay after" text="Your dates are held once the host confirms. You then pay the host directly — never before confirmation." />
          </ul>

          <section className="border-b border-slate-200 py-8">
            <h2 className="text-lg font-bold text-ink">About this apartment</h2>
            <div className="prose-found mt-3 whitespace-pre-line">{plainText(p.description, 100000)}</div>
          </section>

          {amenities.length ? (
            <section className="border-b border-slate-200 py-8">
              <h2 className="text-lg font-bold text-ink">What this place offers</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {amenities.map((a) => (
                  <li key={a} className="flex items-center gap-3 text-[15px] capitalize text-slate-700">
                    <Check className="size-4 text-brand-600" /> {a}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid gap-6 border-b border-slate-200 py-8 sm:grid-cols-3">
            <Rule icon={Clock} title="Arrival & departure">
              Check-in after {sl.checkInTime ?? "14:00"}
              <br />Check-out before {sl.checkOutTime ?? "11:00"}
              <br />Up to {sl.maxGuests ?? 2} guests
            </Rule>
            <Rule icon={ScrollText} title="House rules">
              {sl.houseRules?.length ? <span className="capitalize">{sl.houseRules.join(" · ")}</span> : "Be respectful of the home and neighbours."}
            </Rule>
            <Rule icon={KeyRound} title="Cancellation">
              <span className="font-medium capitalize text-ink">{sl.cancellationPolicy ?? "moderate"}. </span>
              {CANCELLATION_POLICIES[sl.cancellationPolicy ?? "moderate"]}
              {sl.securityDeposit ? <><br />Refundable caution fee: {formatPrice(sl.securityDeposit)}</> : null}
            </Rule>
          </section>

          <section className="py-8">
            <h2 className="text-lg font-bold text-ink">Where you&apos;ll be</h2>
            <p className="mt-1 text-sm text-slate-600">{p.location?.city}, {stateLabel(p.location?.state)}</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                title={`Map of ${locationLine(p.location)}`}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${p.location?.landmark ?? ""} ${p.location?.city ?? ""} ${p.location?.state ?? ""} Nigeria`)}&z=13&output=embed`}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">The exact address is shared by the host once your booking is confirmed.</p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-500">Share this apartment</h2>
            <ShareBar url={url} title={p.title} text={`🏡 ${p.title} — ${formatPrice(p.price)}/night in ${locationLine(p.location)} on Found Apartments`} />
          </section>
        </div>

        <aside id="book" className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
          {p.status === "available" ? (
            <BookingWidget
              propertyId={p._id}
              price={p.price}
              sd={sl}
              ranges={ranges}
              today={isoDay(todayLagos())}
              initial={{ checkIn: one(sp.checkIn), checkOut: one(sp.checkOut), guests: one(sp.guests) }}
            />
          ) : (
            <div className="card p-6 text-sm text-slate-600">Booking opens once this apartment is approved.</div>
          )}
        </aside>
      </div>

      {similar.length ? (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight text-ink">More stays in {stateLabel(p.location?.state)}</h2>
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => <ApartmentCard key={s._id} p={s} />)}
          </div>
        </section>
      ) : null}

      {/* Mobile booking bar */}
      <div className="fixed inset-x-0 bottom-[58px] z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600"><span className="text-lg font-bold text-ink">{formatPrice(p.price)}</span> / night</p>
          <a href="#book" className="btn-accent px-6">Check availability</a>
        </div>
      </div>
    </div>
  );
}

function Highlight({ icon: Icon, title, text }: { icon: typeof Check; title: string; text: string }) {
  return (
    <li className="flex gap-4">
      <Icon className="mt-0.5 size-6 shrink-0 text-ink" />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    </li>
  );
}

function Rule({ icon: Icon, title, children }: { icon: typeof Check; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-2 font-semibold text-ink"><Icon className="size-4 text-brand-600" /> {title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p>
    </div>
  );
}
