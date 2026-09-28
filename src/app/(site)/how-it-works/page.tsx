import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Search, LayoutGrid, Handshake, UserPlus, ListPlus, Inbox, Link2, BadgePercent } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { FaqList } from "@/components/site/faq-list";
import { FAQS } from "@/lib/faqs";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How Found Properties Works - Found Properties",
  absoluteTitle: true,
  description: "Whether you're looking to buy, rent, list or earn commissions, here's how Found Properties works for buyers, tenants, realtors and agents.",
  path: "/how-it-works",
});

const tracks = [
  {
    id: "buyers",
    label: "Buyers & tenants",
    color: "brand",
    steps: [
      { icon: Search, title: "Search properties", text: "Browse verified properties across Nigeria. Filter by type, location, price and more." },
      { icon: LayoutGrid, title: "View & compare", text: "See full details and photos, save favourites to your shortlist and compare options." },
      { icon: Handshake, title: "Connect & close", text: "Send an enquiry, schedule an inspection and complete your transaction through Found." },
    ],
    cta: { href: "/properties", label: "Browse properties" },
  },
  {
    id: "realtors",
    label: "Realtors",
    color: "brand",
    steps: [
      { icon: UserPlus, title: "Create an account", text: "Register as a realtor for free with your company details and get verified by our team." },
      { icon: ListPlus, title: "List properties", text: "Add unlimited listings with detailed information and high-quality photos." },
      { icon: Inbox, title: "Get leads", text: "Receive enquiries from buyers and tenants in one inbox and track views on every listing." },
    ],
    cta: { href: "/register", label: "Start listing today" },
  },
  {
    id: "agents",
    label: "Agents",
    color: "coral",
    steps: [
      { icon: UserPlus, title: "Register for free", text: "Sign up as an agent and get instant access to your agent dashboard." },
      { icon: Link2, title: "Get unique links", text: "Generate a tracked referral link and QR code for any property to share on social media." },
      { icon: BadgePercent, title: "Earn 70% commission", text: "Earn 70% of the agency fee on every successful transaction from your referrals." },
    ],
    cta: { href: "/agent/register", label: "Become an agent today" },
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="Simple & transparent"
        title="Three ways to use Found"
        lead="Whether you're looking to buy, rent, list or earn commissions, we've got you covered."
        crumbs={[{ label: "How it works" }]}
      >
        <div className="mt-8 flex flex-wrap gap-2">
          {tracks.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="btn-outline">
              {t.label}
            </a>
          ))}
        </div>
      </PageHero>

      {tracks.map((t, idx) => (
        <section key={t.id} id={t.id} className={idx % 2 ? "bg-slate-50/70 py-16" : "py-16"}>
          <div className="container-page">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">For {t.label.toLowerCase()}</h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {t.steps.map((s, i) => (
                <li key={s.title} className="card relative p-6">
                  <span className="absolute right-5 top-5 text-5xl font-black text-slate-100">{i + 1}</span>
                  <span className={`grid size-12 place-items-center rounded-2xl ${t.color === "coral" ? "bg-coral-50 text-coral-600" : "bg-brand-50 text-brand-600"}`}>
                    <s.icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{s.text}</p>
                </li>
              ))}
            </ol>
            {t.id === "agents" ? (
              <div className="mt-8 grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:grid-cols-3">
                <Split pct="70%" label="Agent commission" strong />
                <Split pct="10%" label="Promoter (realtor)" />
                <Split pct="20%" label="Found platform" />
                <p className="text-sm text-slate-600 sm:col-span-3">
                  Example: on a ₦100,000 agency fee, you earn <strong className="text-ink">₦70,000</strong>.
                </p>
              </div>
            ) : null}
            {t.id === "realtors" ? (
              <ul className="mt-8 grid gap-2 sm:grid-cols-3">
                {["Free to list", "Unlimited properties", "Verified leads", "Analytics dashboard", "Agent network access", "Featured opportunities"].map((x) => (
                  <li key={x} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="size-4 text-emerald-600" /> {x}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href={t.cta.href} className={`${t.color === "coral" ? "btn-accent" : "btn-primary"} mt-8`}>
              {t.cta.label} <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      ))}

      <section className="container-page max-w-3xl py-16">
        <h2 className="mb-6 text-2xl font-bold text-ink">Frequently asked questions</h2>
        <FaqList items={FAQS.slice(0, 6)} />
      </section>
    </>
  );
}

function Split({ pct, label, strong }: { pct: string; label: string; strong?: boolean }) {
  return (
    <div className={strong ? "rounded-2xl bg-coral-50 p-5" : "rounded-2xl bg-slate-50 p-5"}>
      <p className={`text-3xl font-extrabold ${strong ? "text-coral-600" : "text-ink"}`}>{pct}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}
