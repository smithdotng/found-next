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
import { DEFAULT_FEES, FRACTIONAL_OPEN, RESERVATION_HOURS, RETAIL_ANNUAL_LIMIT_PERCENT } from "@/lib/fractional";
import { PrelaunchBanner, RiskStatement } from "@/components/fractional/regulatory-notice";

export const metadata: Metadata = pageMetadata({
  title: "Found Fractional - Fractional Property Ownership in Nigeria",
  absoluteTitle: true,
  description:
    "Found Fractional is a planned platform for owning units in individual Nigerian properties, each held by its own company. Pre-launch: no investments are being accepted until SEC registration is complete.",
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
    { icon: Search, title: "Review a property", text: "Each offering comes with its title, valuation, developer track record and the company that will hold the property. Found's checks are due diligence, not a recommendation to invest." },
    { icon: UserCheck, title: "Verify once", text: "Create a free investor account and verify your ID. One profile works for every offering." },
    { icon: Wallet, title: "Subscribe for units", text: `Choose how many units you want and read the offering documents. Units are held for ${RESERVATION_HOURS} hours while you pay into the offering's custodial account.` },
    { icon: HandCoins, title: "Distributions and exit", text: "If the property earns rent or is sold, net proceeds are shared between unit holders in proportion to their units. Nothing is paid unless the property earns it." },
  ];
  const safeguards = [
    { icon: Landmark, title: "One SPV per property", text: "Each property is held by its own company. Units are shares in that company, recorded in the investor's name and kept separate from other offerings." },
    { icon: FileCheck2, title: "Documents up front", text: "The information memorandum, title, valuation and SPV papers are available to read before any decision to invest." },
    { icon: ShieldCheck, title: "A minimum raise", text: "Each offering sets a minimum raise. If it isn't reached by the closing date, the offering lapses and subscription money is returned to investors, as set out in the offering terms." },
    { icon: LineChart, title: "Regular reporting", text: "Developers post construction updates, and valuations and distributions are recorded in each investor's dashboard." },
  ];
  const faqs = [
    { q: "What exactly do I own?", a: "Each property is held by its own special purpose vehicle (SPV), a company created only to own that property. Units are shares in the SPV. When the SPV earns rent or sells the property, the money is shared between unit holders in proportion to the units they hold." },
    { q: "What is the minimum investment?", a: "The minimum is set for each offering and shown on its page, together with Found's service fee (usually 1% of the amount subscribed)." },
    { q: "How are distributions paid?", a: "If a property earns rent, the net amount after costs and the management fee may be distributed to unit holders at the frequency stated in the offering documents. If the property is sold, net proceeds are shared in proportion to units held. Distributions depend on the property's performance and are not guaranteed." },
    { q: "Can I sell my units early?", a: `You should expect to hold your units for the full term. Where the law and SEC rules allow, and after any lock-in period, Found may let investors transfer units to each other at an agreed price (a ${DEFAULT_FEES.resale}% fee applies to the seller). There may be no buyer, and a sale may be at a loss.` },
    { q: "Is there a limit on how much I can invest?", a: `Yes. In line with SEC rules, retail investors may invest no more than ${RETAIL_ANNUAL_LIMIT_PERCENT}% of their net annual income each year. Investors who qualify as sophisticated or high-net-worth under SEC criteria are not subject to this limit, but may be asked for evidence.` },
    { q: "What are the risks?", a: "You could lose some or all of the money you invest. Property values can fall, construction can be delayed or cost more, tenants can leave, and you may not be able to sell your units. Only invest money you can afford to lose and leave in for the full term, and consider spreading it across more than one property." },
    { q: "Is Found Fractional regulated?", a: "Investing in units of property is regulated by the Securities and Exchange Commission, Nigeria, under the Investments and Securities Act 2025. Found Fractional is in pre-launch and is not accepting investments. It will open only once the required SEC registration is in place, and each offering will name the registered custodian and trustee involved." },
  ];

  return (
    <>
      <PrelaunchBanner />
      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image src="/images/featured-bg.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/90 to-brand-950/40" />
        <div className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-coral-200"><Layers className="size-4" /> Found Fractional</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">Property ownership, one unit at a time.</h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">
              Own units in individual Nigerian properties, each held by its own company, with the documents, structure and reporting laid out before you decide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {FRACTIONAL_OPEN ? (
                <Link href="#offerings" className="btn-accent px-6 py-3 text-base">See offerings <ArrowRight className="size-4" /></Link>
              ) : (
                <Link href="/invest/register" className="btn-accent px-6 py-3 text-base">Register your interest <ArrowRight className="size-4" /></Link>
              )}
              <Link href="/fractional/developers" className="btn bg-white/10 px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/20">Raise capital as a developer</Link>
            </div>
          </div>
          {stats.offerings ? (
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Subscribed", formatCompactPrice(stats.raised)],
                ["Investors", stats.investors.toLocaleString()],
                ["Offerings", String(stats.offerings)],
                ["Distributed", formatCompactPrice(stats.distributed)],
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
            <Link href="/fractional/market" className="btn-outline"><ArrowLeftRight className="size-4" /> Investor transfers</Link>
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
            <p className="mt-3 font-semibold text-ink">{view || q ? "No offerings match" : "No offerings yet"}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {view || q ? "Try another filter." : "Register your interest and we'll email you when Found Fractional opens."}
            </p>
            <Link href={view || q ? "/fractional#offerings" : "/invest/register"} className="btn-primary mt-6">
              {view || q ? "Show all offerings" : "Register your interest"}
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
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">How each offering is structured</h2>
          <p className="mt-3 text-slate-600">These features are designed to protect investors, but they don&apos;t remove the risk of loss.</p>
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
          <p className="text-sm font-semibold text-slate-500">Fee example: 10 units at {formatPrice(50_000)}</p>
          <dl className="mt-4 space-y-3 text-[15px]">
            <div className="flex justify-between"><dt className="text-slate-600">10 × {formatPrice(50_000)}</dt><dd className="font-medium">{formatPrice(500_000)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Found service fee ({DEFAULT_FEES.investor}%)</dt><dd>{formatPrice(5_000)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 font-bold text-ink"><dt>Total payable</dt><dd>{formatPrice(505_000)}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">How fees work on a subscription. Illustrative only: unit prices and fees are set for each offering.</p>
        </div>
      </section>

      <section className="bg-brand-950 py-16 text-white">
        <div className="container-page grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-coral-200"><Building2 className="size-4" /> For developers</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Raising capital for a property project?</h2>
            <p className="mt-3 max-w-xl text-white/75">
              Developers can apply now to be reviewed for future offerings. Found would handle investor onboarding, the investor register and distributions once the platform opens.
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
        <RiskStatement className="mt-8 max-w-3xl" />
      </section>
    </>
  );
}
