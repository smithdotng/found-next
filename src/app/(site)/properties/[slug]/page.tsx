import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import {
  Bath, BedDouble, Car, Check, ChevronRight, Clock, Eye, MapPin, Ruler, ShieldCheck, Sofa, Toilet, Users, Zap, Droplets, Sparkles, Phone, Pencil,
} from "lucide-react";
import { getPublicProperty, getSimilarProperties } from "@/lib/queries";
import { connectDB } from "@/lib/db";
import { Property } from "@/lib/models";
import { getSession } from "@/lib/session";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import {
  STATUS_META, formatDate, formatPrice, locationLine, plainText, priceSuffix, stateLabel, txLabel, typeLabel,
} from "@/lib/format";
import type { OwnerLite, PropertyDoc } from "@/lib/types";
import { Gallery } from "@/components/property/gallery";
import { InquiryForm } from "@/components/property/inquiry-form";
import { ShareBar } from "@/components/property/share-bar";
import { SaveButton } from "@/components/property/save-button";
import { PropertyGrid } from "@/components/property/property-card";
import { SmartImage } from "@/components/ui/smart-image";
import { sendPropertyInquiry } from "@/app/actions/public";

const PUBLIC_STATUSES = ["available", "sold", "rented"];

function fullLocation(p: PropertyDoc) {
  return p.location ? `${p.location.address ? p.location.address + ", " : ""}${p.location.city}, ${stateLabel(p.location.state)}` : "Nigeria";
}

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicProperty(slug);
  if (!p) return pageMetadata({ title: "Property not found", path: `/properties/${slug}`, noIndex: true });

  // Same meta/OG copy the EJS property-detail view produced.
  const price = formatPrice(p.price);
  const loc = fullLocation(p);
  const base = pageMetadata({
    title: `${p.title} | Found Projects & Realty Limited`,
    absoluteTitle: true,
    description: `✨ ${typeLabel(p.propertyType)} for ${p.transactionType} in ${p.location?.city}, ${stateLabel(p.location?.state)}\n💰 Price: ${price}\n📍 Location: ${loc}`,
    path: `/properties/${p.slug}`,
    image: p.images?.[0]?.url || null,
    imageAlt: p.title,
    type: "article",
    keywords: `${p.title}, ${typeLabel(p.propertyType)} for ${p.transactionType}, ${p.location?.city} property, ${p.location?.state} real estate, Nigeria property, Found Properties`,
    publishedTime: p.createdAt,
    modifiedTime: p.updatedAt,
    noIndex: !PUBLIC_STATUSES.includes(p.status),
  });
  return {
    ...base,
    title: { absolute: `${p.title} - Found Projects & Realty Limited` },
    description: `${p.title} located at ${loc}. Price: ${price}. ${plainText(p.description, 160)}`,
  };
}

export default async function PropertyPage({ params }: PageProps<"/properties/[slug]">) {
  const { slug } = await params;
  const [p, session] = await Promise.all([getPublicProperty(slug), getSession()]);
  if (!p) notFound();
  // Shortlets live in Found Apartments, where they can be booked.
  if (p.propertyType === "shortlet") permanentRedirect(`/apartments/${p.slug}`);

  const owner = (typeof p.owner === "object" ? p.owner : null) as OwnerLite | null;
  const isOwner = !!session.userId && owner?._id === session.userId;
  const isAdmin = session.userType === "admin";
  if (!PUBLIC_STATUSES.includes(p.status) && !isOwner && !isAdmin) notFound();

  after(async () => {
    await connectDB();
    await Property.updateOne({ _id: p._id }, { $inc: { views: 1 } });
  });

  const similar = await getSimilarProperties(p);
  const f = p.features ?? {};
  const sl = p.shortletDetails;
  const url = absoluteUrl(`/properties/${p.slug}`);
  const facts = [
    f.bedrooms ? { icon: BedDouble, label: "Bedrooms", value: f.bedrooms } : null,
    f.bathrooms ? { icon: Bath, label: "Bathrooms", value: f.bathrooms } : null,
    f.toilets ? { icon: Toilet, label: "Toilets", value: f.toilets } : null,
    f.parkingSpaces ? { icon: Car, label: "Parking", value: f.parkingSpaces } : null,
    f.floorArea ? { icon: Ruler, label: "Floor area", value: `${f.floorArea.toLocaleString()} sqm` } : null,
    f.landArea ? { icon: Ruler, label: "Land area", value: `${f.landArea.toLocaleString()} sqm` } : null,
    (p.propertyType as string) === "shortlet" && sl?.maxGuests ? { icon: Users, label: "Guests", value: sl.maxGuests } : null,
  ].filter(Boolean) as { icon: typeof Bath; label: string; value: string | number }[];
  const amenities = [
    f.furnished && { icon: Sofa, label: "Furnished" },
    f.serviced && { icon: Sparkles, label: "Serviced" },
    f.security && { icon: ShieldCheck, label: "24/7 security" },
    f.powerSupply && { icon: Zap, label: "Steady power supply" },
    f.borehole && { icon: Droplets, label: "Borehole / water" },
  ].filter(Boolean) as { icon: typeof Sofa; label: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: plainText(p.description, 300),
    url,
    image: (p.images ?? []).map((i) => absoluteUrl(i.url)),
    datePosted: p.createdAt,
    offers: { "@type": "Offer", price: p.price, priceCurrency: "NGN", availability: p.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
    address: { "@type": "PostalAddress", streetAddress: p.location?.address, addressLocality: p.location?.city, addressRegion: p.location?.state, addressCountry: "NG" },
  };

  return (
    <div className="container-page pb-28 pt-4 lg:pb-12 lg:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-4 hidden items-center gap-1 text-xs text-slate-500 sm:flex">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="size-3" />
        <Link href="/properties" className="hover:text-ink">Properties</Link>
        <ChevronRight className="size-3" />
        <Link href={`/properties?type=${p.propertyType}`} className="hover:text-ink">{typeLabel(p.propertyType)}</Link>
        <ChevronRight className="size-3" />
        <span className="truncate text-slate-700">{p.title}</span>
      </nav>

      {p.status !== "available" ? (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${STATUS_META[p.status].tone}`}>
          This listing is <strong>{STATUS_META[p.status].label.toLowerCase()}</strong>
          {p.status === "pending" ? " — only you and Found admins can see it until it's approved." : "."}
          {p.status === "rejected" && p.rejectionReason ? ` Reason: ${p.rejectionReason}` : ""}
        </div>
      ) : null}

      <Gallery images={p.images ?? []} title={p.title} />

      <div className="mt-6 grid gap-10 lg:mt-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip bg-brand-50 text-brand-700 ring-brand-600/15">{typeLabel(p.propertyType)}</span>
            <span className="chip bg-slate-50 text-slate-700 ring-slate-500/15">{txLabel(p.transactionType)}</span>
            {p.priceNegotiable ? <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-600/15">Negotiable</span> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">{p.title}</h1>
          <p className="mt-2 flex items-start gap-1.5 text-slate-600">
            <MapPin className="mt-0.5 size-4 shrink-0 text-coral-500" />
            {fullLocation(p)}
            {p.location?.landmark ? <span className="text-slate-400"> · near {p.location.landmark}</span> : null}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Eye className="size-3.5" /> {(p.views + 1).toLocaleString()} views</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" /> Listed {formatDate(p.createdAt)}</span>
          </div>

          {facts.length ? (
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {facts.map((x) => (
                <div key={x.label} className="rounded-2xl border border-slate-200 p-4">
                  <x.icon className="size-5 text-brand-600" />
                  <dd className="mt-2 text-lg font-bold text-ink">{x.value}</dd>
                  <dt className="text-xs text-slate-500">{x.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}

          <section className="mt-10">
            <h2 className="text-lg font-bold text-ink">About this property</h2>
            <div className="prose-found mt-3 whitespace-pre-line">{plainText(p.description, 100000)}</div>
          </section>

          {amenities.length ? (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink">Features</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {amenities.map((a) => (
                  <li key={a.label} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="grid size-9 place-items-center rounded-xl bg-slate-50"><a.icon className="size-4 text-brand-600" /></span>
                    {a.label}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(p.propertyType as string) === "shortlet" && sl ? (
            <section className="mt-10 rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-ink">Stay details</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <Info label="Check-in" value={sl.checkInTime} />
                <Info label="Check-out" value={sl.checkOutTime} />
                <Info label="Max guests" value={sl.maxGuests} />
                <Info label="Minimum stay" value={sl.minimumStay ? `${sl.minimumStay} night${sl.minimumStay > 1 ? "s" : ""}` : undefined} />
                <Info label="Maximum stay" value={sl.maximumStay ? `${sl.maximumStay} nights` : undefined} />
                <Info label="Cancellation" value={sl.cancellationPolicy} />
                <Info label="Weekend rate" value={sl.weekendRate ? formatPrice(sl.weekendRate) : undefined} />
                <Info label="Cleaning fee" value={sl.cleaningFee ? formatPrice(sl.cleaningFee) : undefined} />
                <Info label="Security deposit" value={sl.securityDeposit ? formatPrice(sl.securityDeposit) : undefined} />
                <Info label="Weekly discount" value={sl.weeklyDiscount ? `${sl.weeklyDiscount}%` : undefined} />
                <Info label="Monthly discount" value={sl.monthlyDiscount ? `${sl.monthlyDiscount}%` : undefined} />
              </dl>
              {sl.amenities?.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {sl.amenities.map((a) => (
                    <span key={a} className="chip bg-slate-50 capitalize text-slate-700 ring-slate-500/10"><Check className="size-3" /> {a}</span>
                  ))}
                </div>
              ) : null}
              {sl.houseRules?.length ? (
                <p className="mt-4 text-sm text-slate-600"><strong className="text-ink">House rules:</strong> <span className="capitalize">{sl.houseRules.join(", ")}</span></p>
              ) : null}
            </section>
          ) : null}

          {p.videoUrl ? (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink">Video tour</h2>
              <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-3">Watch the video tour</a>
            </section>
          ) : null}

          <section className="mt-10">
            <h2 className="text-lg font-bold text-ink">Location</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                title={`Map of ${locationLine(p.location)}`}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${p.location?.address ?? ""} ${p.location?.city ?? ""} ${p.location?.state ?? ""} Nigeria`)}&z=14&output=embed`}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Map shows the general area. Exact address is shared on enquiry.</p>
          </section>

          <section className="mt-10 border-t border-slate-200 pt-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-500">Share this property</h2>
            <ShareBar
              url={url}
              title={p.title}
              text={`🏠 ${p.title} — ${formatPrice(p.price)} in ${locationLine(p.location)} on Found Properties`}
            />
          </section>
        </div>

        {/* Sticky enquiry column */}
        <aside id="enquire" className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <p className="text-sm text-slate-500">{txLabel(p.transactionType)}</p>
            <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-ink">
              {formatPrice(p.price)}
              <span className="ml-1 text-sm font-medium text-slate-500">{priceSuffix(p)}</span>
            </p>
            {p.agencyFee ? <p className="mt-1 text-xs text-slate-500">Agency fee capped at 10% ({formatPrice(p.agencyFee)})</p> : null}

            <div className="mt-4 flex gap-2">
              <SaveButton id={p._id} variant="button" />
              {isOwner || isAdmin ? (
                <Link href={`/dashboard/listings/${p._id}/edit`} className="btn-outline">
                  <Pencil className="size-4" /> Edit
                </Link>
              ) : null}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <SmartImage
                src={owner?.profileImage && owner.profileImage !== "default-avatar.jpg" ? owner.profileImage : "/assets/images/default-avatar.jpg"}
                alt=""
                width={44}
                height={44}
                className="size-11 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{owner?.realtorProfile?.company || owner?.name || "Found Properties"}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  {owner?.realtorProfile?.verified ? (
                    <><ShieldCheck className="size-3.5 text-emerald-600" /> Verified realtor</>
                  ) : (
                    "Listed on Found"
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5">
              {p.status === "available" ? (
                <InquiryForm
                  action={sendPropertyInquiry}
                  hidden={{ propertyId: p._id }}
                  defaultMessage={`Hi, I'm interested in "${p.title}". Is it still available? I'd like to schedule an inspection.`}
                />
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Enquiries are closed for this listing.</p>
              )}
            </div>
            <a href="tel:+2348063006890" className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600">
              <Phone className="size-4" /> Or call Found support: 0806 300 6890
            </a>
          </div>
          <p className="mt-3 px-2 text-center text-xs leading-5 text-slate-500">
            Stay safe: inspect the property and verify documents before paying. Transact through Found so both sides are protected.
          </p>
        </aside>
      </div>

      {similar.length ? (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-ink">Similar properties</h2>
          <PropertyGrid items={similar} />
        </section>
      ) : null}

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-[58px] z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-ink">{formatPrice(p.price)}</p>
            <p className="truncate text-xs text-slate-500">{locationLine(p.location)}</p>
          </div>
          <a href="#enquire" className="btn-primary">Enquire now</a>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold capitalize text-ink">{value}</dd>
    </div>
  );
}
