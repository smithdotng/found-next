import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Building2, Handshake, LandPlot, Percent, ShieldCheck, Store, BedDouble, Warehouse } from "lucide-react";
import { HeroSearch } from "@/components/property/hero-search";
import { PropertyGrid } from "@/components/property/property-card";
import { SmartImage } from "@/components/ui/smart-image";
import { getHomeData } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";
import { formatDate, formatPrice, locationLine, PROPERTY_TYPES } from "@/lib/format";


// Same title/description/OG copy the Express home route set.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Found Projects & Realty Limited - Find Your Dream Property in Nigeria",
    description:
      "Browse thousands of verified properties across Nigeria. From luxury shortlets to commercial spaces, land, and buildings.",
    path: "/",
    absoluteTitle: true,
    keywords: "property, real estate, nigeria, lagos, abuja, rent, sale, shortlet, land, building",
  }),
  title: { absolute: "Found Projects & Realty Limited - Nigeria's Premier Property Platform" },
};

const TYPE_ICONS = {
  shortlet: BedDouble,
  land: LandPlot,
  building: Building2,
  shop: Store,
  business_complex: Warehouse,
} as const;

export default async function HomePage() {
  const { featured, latest, blogs, projects, facets, totalLive } = await getHomeData();

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <Image src="/assets/images/hero-bg.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/80 via-brand-900/65 to-brand-950/85" />
        <div className="container-page flex min-h-[560px] flex-col justify-center py-20 sm:min-h-[620px]">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            <BadgeCheck className="size-3.5 text-emerald-300" /> Verified listings across all 36 states + FCT
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find the right property in Nigeria, <span className="text-coral-200">without the runaround.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            Shortlets, land, homes, shops and commercial space from verified realtors — with agency fees capped at 10%.
          </p>
          <div className="mt-9">
            <HeroSearch />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {["Lekki", "Wuse 2", "Maitama", "Ikoyi", "Port Harcourt", "Gwarinpa"].map((q) => (
              <Link
                key={q}
                href={`/properties?search=${encodeURIComponent(q)}`}
                className="rounded-full bg-white/10 px-3 py-1.5 font-medium text-white/90 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          <Stat value={totalLive.toLocaleString()} label="Live listings" />
          <Stat value="36 + FCT" label="States covered" />
          <Stat value="≤10%" label="Agency fee cap" />
          <Stat value="Free" label="For realtors to list" />
        </div>
      </section>

      {/* Browse by type */}
      <section className="container-page pt-16">
        <SectionHead eyebrow="Browse" title="What are you looking for?" href="/properties" cta="All properties" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PROPERTY_TYPES.map((t) => {
            const Icon = TYPE_ICONS[t.value];
            const count = facets.types[t.value] ?? 0;
            return (
              <Link
                key={t.value}
                href={`/properties?type=${t.value}`}
                className="group card flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{t.plural}</span>
                  <span className="text-sm text-slate-500">
                    {count} {count === 1 ? "listing" : "listings"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured deals */}
      {featured.length ? (
        <section className="container-page pt-20">
          <SectionHead eyebrow="Special arrangements" title="Featured deals" />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {featured.map((f) => (
              <Link
                key={f._id}
                href={`/properties/${f.property!.slug}`}
                className="group relative flex min-h-72 overflow-hidden rounded-3xl bg-ink text-white shadow-card"
              >
                <SmartImage
                  src={f.image || f.property!.images?.[0]?.url}
                  alt={f.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover opacity-80 transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                <div className="relative mt-auto p-6">
                  {f.badge?.text ? (
                    <span
                      className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: f.badge.color || "#cb4850" }}
                    >
                      {f.badge.text}
                    </span>
                  ) : null}
                  <h3 className="text-xl font-bold">{f.title}</h3>
                  {f.description ? <p className="mt-1 line-clamp-2 text-sm text-white/80">{f.description}</p> : null}
                  <p className="mt-3 text-sm font-semibold">
                    {formatPrice(f.property!.price)} · {locationLine(f.property!.location)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Latest */}
      <section className="container-page pt-20">
        <SectionHead eyebrow="Just listed" title="Latest properties" href="/properties?sort=newest" cta="See all" />
        <div className="mt-8">
          <PropertyGrid items={latest} emptyText="New listings are on the way." />
        </div>
      </section>

      {/* Why Found */}
      <section className="mt-24 bg-brand-950 py-20 text-white">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-coral-200">Why Found</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Transparent property deals, start to finish.</h2>
            <p className="mt-4 text-white/70">
              Transact through Found and we facilitate the deal so both sides are protected — from first enquiry to keys in hand.
            </p>
            <Link href="/how-it-works" className="btn mt-8 bg-white text-ink hover:bg-brand-50">
              How it works <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Why icon={ShieldCheck} title="Reviewed listings" text="Every listing is reviewed by our team before it goes live." />
            <Why icon={Percent} title="Fees capped at 10%" text="Agency fees are capped and disclosed up front — no surprises." />
            <Why icon={BadgeCheck} title="Verified realtors" text="Realtors register with company details and are verified." />
            <Why icon={Handshake} title="Agents earn 70%" text="Promote listings with your own link and earn most of the agency fee." />
          </div>
        </div>
      </section>

      {/* Projects */}
      {projects.length ? (
        <section className="container-page pt-20">
          <SectionHead eyebrow="Developments" title="Projects & estates" href="/projects" cta="All projects" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {projects.map((p) => (
              <Link key={p._id} href={`/projects/${p.slug}`} className="group card overflow-hidden transition hover:shadow-lift">
                <div className="relative aspect-[16/10] bg-slate-100">
                  <SmartImage src={p.media?.featuredImage} alt={p.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{p.developer?.name}</p>
                  <h3 className="mt-1 font-semibold text-ink">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description?.short}</p>
                  {p.pricing?.startingPrice ? (
                    <p className="mt-3 text-sm font-semibold text-ink">From {formatPrice(p.pricing.startingPrice)}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Partner CTAs */}
      <section className="container-page grid gap-5 pt-20 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-brand-50 p-8 sm:p-10">
          <p className="text-sm font-semibold text-brand-700">For realtors</p>
          <h3 className="mt-2 text-2xl font-bold text-ink">List unlimited properties for free.</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Reach serious buyers and tenants, manage enquiries in one inbox, and track how every listing performs.
          </p>
          <Link href="/register" className="btn-primary mt-6">
            Start listing <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-coral-50 p-8 sm:p-10">
          <p className="text-sm font-semibold text-coral-700">For agents</p>
          <h3 className="mt-2 text-2xl font-bold text-ink">Share listings. Earn 70% of the fee.</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Get a tracked link and QR code for any property. When your referral closes, you earn the lion&apos;s share.
          </p>
          <Link href="/agent/register" className="btn-accent mt-6">
            Become an agent <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Blog */}
      {blogs.length ? (
        <section className="container-page pt-20">
          <SectionHead eyebrow="Insights" title="From the blog" href="/blog" cta="Read the blog" />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {blogs.map((b) => (
              <Link key={b._id} href={`/blog/${b.slug}`} className="group">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                  <SmartImage src={b.featuredImage} alt={b.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {formatDate(b.publishedAt)} · {b.readingTime || 1} min read
                </p>
                <h3 className="mt-1 font-semibold leading-snug text-ink group-hover:text-brand-600">{b.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function SectionHead({ eyebrow, title, href, cta }: { eyebrow: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-coral-500">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:flex">
          {cta} <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function Why({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <Icon className="size-6 text-coral-200" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-white/65">{text}</p>
    </div>
  );
}
