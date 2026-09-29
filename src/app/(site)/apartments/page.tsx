import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { ArrowRight, BadgeCheck, CalendarCheck, KeyRound, SearchX, ShieldCheck, X } from "lucide-react";
import { getApartmentCities, parseApartmentFilters, searchApartments } from "@/lib/apartments";
import { ApartmentCard } from "@/components/apartments/apartment-card";
import { ApartmentSearchBar } from "@/components/apartments/search-bar";
import { SortSelect } from "@/components/property/filters";
import { Pagination } from "@/components/ui/pagination";
import { SmartImage } from "@/components/ui/smart-image";
import { pageMetadata } from "@/lib/seo";
import { formatCompactPrice, stateLabel } from "@/lib/format";
import { stayDates } from "@/lib/stay";

const OG = "/assets/images/og-apartments.jpg";
const BUDGETS = [
  { label: "Under ₦50k", min: "", max: "50000" },
  { label: "₦50k – ₦100k", min: "50000", max: "100000" },
  { label: "₦100k – ₦200k", min: "100000", max: "200000" },
  { label: "₦200k+", min: "200000", max: "" },
];
const AMENITY_CHIPS = ["wifi", "air conditioning", "pool", "gym", "parking", "workspace", "kitchen", "security"];

export async function generateMetadata({ searchParams }: PageProps<"/apartments">): Promise<Metadata> {
  const f = parseApartmentFilters(await searchParams);
  const where = f.where || (f.state ? stateLabel(f.state) : "");
  return pageMetadata({
    title: where ? `Shortlet apartments in ${where} - Found Apartments` : "Found Apartments - Book Verified Shortlet Apartments in Nigeria",
    absoluteTitle: true,
    description: where
      ? `Book vetted shortlet apartments in ${where}. See real availability, transparent nightly prices and request to book in minutes on Found Apartments.`
      : "Book vetted shortlet apartments across Lagos, Abuja, Port Harcourt and beyond. Real availability, transparent nightly prices and hosts vetted by Found.",
    keywords: "shortlet apartments, short let Abuja, shortlet Lagos, serviced apartments Nigeria, book shortlet, Found Apartments",
    path: where && f.where ? `/apartments?where=${encodeURIComponent(f.where)}` : "/apartments",
    image: OG,
    imageAlt: "Found Apartments — shortlet apartments in Nigeria",
  });
}

export default async function ApartmentsPage({ searchParams }: PageProps<"/apartments">) {
  const sp = await searchParams;
  const f = parseApartmentFilters(sp);
  const [{ items, total, page, totalPages }, cities] = await Promise.all([searchApartments(f), getApartmentCities()]);
  const searching = !!(f.where || f.state || f.checkIn || f.guests || f.minPrice || f.maxPrice || f.bedrooms || f.amenities?.length || f.sort);

  // Build links that keep everything except the keys being changed.
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) {
    if (k === "page" || v == null) continue;
    if (Array.isArray(v)) { if (v.length) base[k] = v.join(","); }
    else base[k] = v;
  }
  const link = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) q.set(k, v);
    return `/apartments${q.size ? `?${q}` : ""}#results`;
  };
  const toggleAmenity = (a: string) => {
    const set = new Set(f.amenities);
    if (set.has(a)) set.delete(a); else set.add(a);
    return link({ amenities: [...set].join(",") || undefined });
  };
  const stayQuery = f.checkIn && f.checkOut ? `?checkIn=${f.checkIn}&checkOut=${f.checkOut}${f.guests ? `&guests=${f.guests}` : ""}` : f.guests ? `?guests=${f.guests}` : "";

  const heading = f.where ? `Stays in ${f.where}` : f.state ? `Stays in ${stateLabel(f.state)}` : "Apartments available now";
  const sub = [
    f.checkIn && f.checkOut ? stayDates(f.checkIn, f.checkOut) : null,
    f.guests ? `${f.guests} guest${+f.guests > 1 ? "s" : ""}` : null,
    `${total} apartment${total === 1 ? "" : "s"}`,
  ].filter(Boolean).join(" · ");

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image src="/images/hero-bg.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/40 via-brand-950/60 to-brand-950" />
        <div className="container-page pb-10 pt-12 sm:pb-14 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            <KeyRound className="size-3.5 text-coral-200" /> Found Apartments
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Shortlets you can <span className="text-coral-200">actually trust.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            Vetted hosts, real availability and clear nightly prices across Nigeria. Request your dates — the host confirms before you pay.
          </p>
          <div className="mt-8 max-w-4xl">
            <ApartmentSearchBar initial={{ where: f.where, checkIn: f.checkIn, checkOut: f.checkOut, guests: f.guests }} />
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
            <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-coral-200" /> Every host vetted by Found</li>
            <li className="flex items-center gap-2"><CalendarCheck className="size-4 text-coral-200" /> Live calendars, no double-booking</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-coral-200" /> Pay only after the host confirms</li>
          </ul>
        </div>
      </section>

      {!searching && cities.length ? (
        <section className="container-page pt-12">
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Popular destinations</h2>
          <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
            {cities.map((c) => (
              <Link key={`${c.city}-${c.state}`} href={`/apartments?where=${encodeURIComponent(c.city)}#results`} className="group relative h-44 w-56 shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-100">
                <SmartImage src={c.image} alt="" fill sizes="224px" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="font-semibold">{c.city}</p>
                  <p className="text-xs text-white/75">{stateLabel(c.state)} · {c.count} stay{c.count > 1 ? "s" : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="results" className="container-page scroll-mt-20 py-10 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">{heading}</h2>
            <p className="mt-1 text-sm text-slate-500">{sub}</p>
          </div>
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {BUDGETS.map((b) => {
            const on = (f.minPrice ?? "") === b.min && (f.maxPrice ?? "") === b.max;
            return (
              <Link key={b.label} href={on ? link({ minPrice: undefined, maxPrice: undefined }) : link({ minPrice: b.min || undefined, maxPrice: b.max || undefined })} className={chip(on)}>
                {b.label}
              </Link>
            );
          })}
          <span className="mx-1 w-px shrink-0 bg-slate-200" />
          {[1, 2, 3].map((n) => (
            <Link key={n} href={link({ bedrooms: f.bedrooms === String(n) ? undefined : String(n) })} className={chip(f.bedrooms === String(n))}>
              {n}+ bedroom{n > 1 ? "s" : ""}
            </Link>
          ))}
          <span className="mx-1 w-px shrink-0 bg-slate-200" />
          {AMENITY_CHIPS.map((a) => (
            <Link key={a} href={toggleAmenity(a)} className={clsx(chip(!!f.amenities?.includes(a)), "capitalize")}>
              {a}
            </Link>
          ))}
        </div>

        {searching ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {f.minPrice || f.maxPrice ? <span className="text-slate-500">{f.minPrice ? formatCompactPrice(+f.minPrice) : "₦0"} – {f.maxPrice ? formatCompactPrice(+f.maxPrice) : "any"} per night</span> : null}
            <Link href="/apartments#results" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
              <X className="size-3.5" /> Clear all
            </Link>
          </div>
        ) : null}

        {items.length ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => <ApartmentCard key={p._id} p={p} query={stayQuery} priority={i < 4} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
            <SearchX className="mx-auto size-8 text-slate-400" />
            <p className="mt-3 font-semibold text-ink">No apartments match{f.checkIn ? " those dates" : ""}</p>
            <p className="mt-1 text-sm text-slate-500">Try other dates, fewer filters or a nearby area.</p>
            <Link href="/apartments" className="btn-outline mt-5">See all apartments</Link>
          </div>
        )}

        <div className="mt-10">
          <Pagination page={page} totalPages={totalPages} basePath="/apartments" params={base} />
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-coral-50 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-coral-600">Own or manage shortlets?</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Host on Found Apartments</h2>
            <p className="mt-3 max-w-lg text-slate-600">
              Reach guests across Nigeria with a free listing, a live booking calendar and your own host dashboard. Found only earns when you do — a flat commission on completed stays.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/host/register" className="btn-accent">Become a host <ArrowRight className="size-4" /></Link>
              <Link href="/host" className="btn-outline">How hosting works</Link>
            </div>
          </div>
          <ol className="space-y-3 text-sm">
            {["Sign up and tell us about your apartments", "We vet you and inspect where needed", "Sign the listing agreement online", "Accept booking requests from your dashboard"].map((t, i) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-coral-500 text-sm font-bold text-white">{i + 1}</span>
                <span className="font-medium text-ink">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

function chip(on: boolean) {
  return clsx(
    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
    on ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
  );
}
