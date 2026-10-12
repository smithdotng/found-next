import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import {
  ArrowLeftRight, ArrowRight, Building2, FileCheck2, HandCoins, Landmark, Layers, LineChart, Search, ShieldCheck, SearchX, UserCheck, Wallet,
} from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { formatCompactPrice, formatPrice } from "@/lib/format";
import { getFractionalStats, getPublicOfferings } from "@/lib/fractional-data";
import { OfferingCard } from "@/components/fractional/offering-card";
import { FaqList } from "@/components/site/faq-list";
import { DEFAULT_FEES, RESERVATION_HOURS, RETAIL_ANNUAL_LIMIT_PERCENT } from "@/lib/fractional";

export const metadata: Metadata = pageMetadata({
  title: "Found Fractional - Own a Share of Nigerian Real Estate",
  absoluteTitle: true,
  description:
    "Invest in vetted Nigerian property from the price of one unit. Found Fractional lets you own shares in individual buildings, earn rental income and capital growth, and sell your units to other investors.",
  path: "/fractional",
  keywords: "fractional property investment Nigeria, real estate crowdfunding Nigeria, invest in property Abuja, invest in property Lagos, property shares, Found Fractional",
});

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "All" },
  { key: "open", label: "Open now" },
  { key: "off_plan", label: "Off-plan" },
  { key: "income", label: "Income-generating" },
  { key: "closed", label: "Funded" },
];

export default async function FractionalPage({ searchParams }: PageProps<"/fractional">) {
  const sp = await searchParams;
  const view = typeof sp.view === "string" ? sp.view : "";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const [offerings, stats] = await Promise.all([
    getPublicOfferings({
      status: view === "open" || view === "closed" ? view : undefined,
      stage: view === "off_plan" || view === "income" ? view : undefined,
      q,
    }),
    getFractionalStats(),
  ]);

  const steps = [
    { icon: Search, title: "Pick a property", text: "Every offering is checked by Found: title, valuation, developer track record and the company that will hold the property." },
    { icon: UserCheck, title: "Verify once", text: "Create a free investor account and verify your ID. One profile works for every offering." },
    { icon: Wallet, title: "Buy units", text: `Choose how many units you want. We hold them for ${RESERVATION_HOURS} hours while you pay by bank transfer.` },
    { icon: HandCoins, title: "Earn and exit", text: "Receive your share of rent, then your share of the sale. Need your money earlier? Sell units to other investors." },
  ];
  const safeguards = [
    { icon: Landmark, title: "One SPV per property", text: "Each property sits in its own company. Your units are shares in that company, recorded in your name, so your investment isn't mixed with anyone else's." },
    { icon: FileCheck2, title: "Documents up front", text: "Read the information memorandum, title, valuation and SPV papers before you invest." },
    { icon: ShieldCheck, title: "Minimum raise or your money back", text: "Each raise has a minimum. If it isn't reached by the closing date, the project doesn't go ahead and every investor is refunded in full." },
    { icon: LineChart, title: "Progress you can see", text: "Developers post construction updates and Found publishes valuations, payouts and every distribution in your dashboard." },
  ];
  const faqs = [
    { q: "What exactly do I own?", a: "Each property is held by its own special purpose vehicle (SPV), a company created only to own that property. Units are shares in the SPV. When the SPV earns rent or sells the property, the money is shared between unit holders in proportion to the units they hold." },
    { q: "How much do I need to start?", a: "The price of one unit, which the developer and Found set for each offering. Many start from ₦50,000. Found adds a small service fee to each purchase (usually 1%), shown before you reserve." },
    { q: "How do I get paid?", a: "Rental income is paid to your bank account at the frequency stated on the offering, after the property's management fee. When the property is sold you receive your share of the proceeds." },
    { q: "Can I sell before the end?", a: `Yes, once a raise has closed you can list your units on the Found Fractional resale market at a price you choose. When a buyer pays, Found sends you the proceeds less a ${DEFAULT_FEES.resale}% fee. Sales depend on demand, so there's no guarantee of a quick sale.` },
    { q: "Is there a limit on how much I can invest?", a: `To protect everyday investors, retail investors can invest up to ${RETAIL_ANNUAL_LIMIT_PERCENT}% of their annual income in a 12-month period. Sophisticated and high-net-worth investors self-certify and aren't limited.` },
    { q: "What are the risks?", a: "Property values can fall, construction can be delayed or cost more, tenants can leave and you may not be able to sell your units when you want. Only invest money you can leave in for the full term and spread it across more than one property." },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image src="/images/featured-bg.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/90 to-brand-950/40" />
        <div className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-coral-200"><Layers className="size-4" /> Found Fractional</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">Own a share of a building, not just a dream of one.</h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">
              Invest in vetted Nigerian property from the price of one unit. Earn your share of the rent and the growth, and sell your units when you need to.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#offerings" className="btn-accent px-6 py-3 text-base">See open offerings <ArrowRight className="size-4" /></Link>
              <Link href="/fractional/developers" className="btn bg-white/10 px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/20">Raise capital as a developer</Link>
            </div>
          </div>
          {stats.offerings ? (
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Raised for projects", formatCompactPrice(stats.raised)],
                ["Investors", stats.investors.toLocaleString()],
                ["Offerings", String(stats.offerings)],
                ["Paid to investors", formatCompactPrice(stats.distributed)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                  <dt className="text-xs text-white/70">{k}</dt>
                  <dd className="mt-1 text-2xl font-bold text-white">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      <section id="offerings" className="container-page scroll-mt-20 py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Offerings</h2>
            <p className="mt-1 text-slate-600">Each one is a single property, held by its own company.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/fractional/market" className="btn-outline"><ArrowLeftRight className="size-4" /> Resale market</Link>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={`/fractional${f.key ? `?view=${f.key}` : ""}#offerings`}
                scroll={false}
                className={clsx("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition", view === f.key ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:text-ink")}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <form action="/fractional#offerings" className="flex gap-2">
            {view ? <input type="hidden" name="view" value={view} /> : null}
            <input name="q" defaultValue={q} className="field sm:w-60" placeholder="Search city or name" aria-label="Search offerings" />
            <button className="btn-outline">Search</button>
          </form>
        </div>

        {offerings.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((o) => <OfferingCard key={o._id} o={o} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <SearchX className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 font-semibold text-ink">{view || q ? "No offerings match" : "The first offerings are being vetted"}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {view || q ? "Try another filter." : "Create your investor account now and we'll email you as soon as the first property opens."}
            </p>
            <Link href={view || q ? "/fractional#offerings" : "/invest/register"} className="btn-primary mt-6">
              {view || q ? "Show all offerings" : "Create investor account"}
            </Link>
          </div>
        )}
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">How it works</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-coral-50 text-coral-600"><s.icon className="size-5" /></span>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page grid gap-10 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Built so your money stays yours</h2>
          <p className="mt-3 text-slate-600">Fractional ownership only works if investors can trust the structure. Here&apos;s how every offering is set up.</p>
          <ul className="mt-8 space-y-5">
            {safeguards.map((g) => (
              <li key={g.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><g.icon className="size-5" /></span>
                <span>
                  <strong className="block text-ink">{g.title}</strong>
                  <span className="text-sm leading-6 text-slate-600">{g.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card self-start p-6 sm:p-8">
          <p className="text-sm font-semibold text-slate-500">Example: 10 units at {formatPrice(50_000)}</p>
          <dl className="mt-4 space-y-3 text-[15px]">
            <div className="flex justify-between"><dt className="text-slate-600">10 × {formatPrice(50_000)}</dt><dd className="font-medium">{formatPrice(500_000)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Found service fee ({DEFAULT_FEES.investor}%)</dt><dd>{formatPrice(5_000)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 font-bold text-ink"><dt>You transfer</dt><dd>{formatPrice(505_000)}</dd></div>
          </dl>
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            At an 8% rental yield, less the {DEFAULT_FEES.management}% management fee, that&apos;s about <strong>{formatPrice(36_000)} a year</strong> in rent, plus your share of any rise in the
            property&apos;s value when it&apos;s sold.
          </div>
          <p className="mt-3 text-xs text-slate-500">Illustrative only. Returns depend on each property and aren&apos;t guaranteed.</p>
        </div>
      </section>

      <section className="bg-brand-950 py-16 text-white">
        <div className="container-page grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-coral-200"><Building2 className="size-4" /> For developers</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Unlock capital for your next project</h2>
            <p className="mt-3 max-w-xl text-white/75">
              Raise part of your project&apos;s funding from hundreds of investors instead of one lender. Found handles investor onboarding, payments, the register and payouts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/fractional/developers" className="btn-accent px-6 py-3">How raising works <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Questions</h2>
        <div className="mt-6 max-w-3xl">
          <FaqList items={faqs} />
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-5 text-slate-500">
          Investing in unlisted property carries risk, including the loss of capital. Past performance and projections are not a reliable indicator of future results. Units are not deposits and are not
          insured. Found Projects &amp; Realty Limited operates Found Fractional; read each offering&apos;s documents before investing.
        </p>
      </section>
    </>
  );
}
