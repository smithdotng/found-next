import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, Coins, Eye, Inbox, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "For Realtors - List Properties Free on Found Properties",
  absoluteTitle: true,
  description: "List unlimited properties for free and reach thousands of qualified buyers and tenants across Nigeria. Manage enquiries and track performance from one dashboard.",
  path: "/for-realtors",
});

export default function ForRealtorsPage() {
  return (
    <>
      <PageHero
        eyebrow="For realtors"
        title="Grow your real estate business with Found"
        lead="List unlimited properties for free and reach thousands of qualified buyers and tenants across Nigeria."
        crumbs={[{ label: "For realtors" }]}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary">
            Create your free account <ArrowRight className="size-4" />
          </Link>
          <Link href="/contact" className="btn-outline">Talk to sales</Link>
        </div>
        <ul className="mt-8 grid max-w-2xl gap-2 sm:grid-cols-2">
          {["100% free to list", "Unlimited property listings", "Verified leads", "Analytics dashboard", "Agent network access", "Featured opportunities"].map((x) => (
            <li key={x} className="flex items-center gap-2 text-sm text-slate-700">
              <Check className="size-4 text-emerald-600" /> {x}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Why realtors choose Found</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Card icon={Eye} title="Increased visibility" text="Your properties are seen by thousands of buyers and tenants actively searching across Nigeria." />
          <Card icon={ShieldCheck} title="Qualified leads" text="Receive enquiries from serious buyers and tenants, straight to your inbox and dashboard." />
          <Card icon={Coins} title="Additional income" text="Earn a promoter commission when agents refer buyers to your properties and deals close." />
        </div>
      </section>

      <section className="bg-slate-50/70 py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">A dashboard built for managing listings</h2>
            <p className="mt-3 text-slate-600">Everything you need to run your portfolio on Found, on desktop or from your phone.</p>
            <ul className="mt-6 space-y-4">
              <Feature icon={BarChart3} title="Portfolio at a glance" text="Live, pending and closed listings, total views and portfolio value." />
              <Feature icon={Inbox} title="One enquiry inbox" text="See every enquiry by property, mark them handled and reply by email or WhatsApp in a tap." />
              <Feature icon={Check} title="Fast listing editor" text="Drag in photos, pick a cover image and update status to sold or rented in seconds." />
            </ul>
          </div>
          <ol className="grid gap-4">
            {[
              ["Create account", "Register for free and verify your realtor status with your company details."],
              ["List properties", "Add your properties with high-quality photos, detailed descriptions and pricing."],
              ["Manage & grow", "Track views, manage enquiries and grow your business with our analytics tools."],
            ].map(([t, d], i) => (
              <li key={t} className="card flex gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-semibold text-ink">{t}</p>
                  <p className="text-sm text-slate-600">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

function Card({ icon: Icon, title, text }: { icon: typeof Eye; title: string; text: string }) {
  return (
    <div className="card p-6">
      <Icon className="size-6 text-brand-600" />
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Eye; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 ring-1 ring-slate-200">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
    </li>
  );
}
