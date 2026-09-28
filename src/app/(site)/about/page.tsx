import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Lightbulb, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Found Properties - Nigeria's Trusted Property Marketplace",
  absoluteTitle: true,
  description:
    "Found connects property seekers with verified realtors and agents across all 36 states. Our mission: transparent, secure and accessible property transactions in Nigeria.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Nigeria's trusted property marketplace"
        lead="Found Properties connects property seekers with verified realtors and agents across all 36 states and the FCT."
        crumbs={[{ label: "About us" }]}
      />
      <section className="container-page grid gap-12 py-16 lg:grid-cols-2">
        <div className="prose-found text-base">
          <p>
            Founded in 2020, Found Properties has grown to become one of Nigeria&apos;s most trusted property listing platforms. We connect
            property seekers with verified realtors and agents across all 36 states.
          </p>
          <p>
            Our mission is to make property transactions in Nigeria transparent, secure, and accessible to everyone. We&apos;ve created a platform
            where buyers can find their dream homes, sellers can reach qualified buyers, and agents can build successful businesses.
          </p>
          <p>
            Found is operated by <strong>Found Projects &amp; Realty Limited</strong>, headquartered at Suite 5 Gwandal Centre, 1015 Frai Close,
            Wuse 2, Abuja.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Value icon={ShieldCheck} title="Trust & transparency" text="We verify every property and agent to ensure you can transact with confidence." />
          <Value icon={HeartHandshake} title="Customer first" text="Your satisfaction is our priority. We're here to support you every step of the way." />
          <Value icon={Lightbulb} title="Innovation" text="We continuously improve our platform to make property transactions easier and faster." />
        </div>
      </section>
      <section className="container-page">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-950 p-8 text-white sm:p-12 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Ready to find your next property?</h2>
            <p className="mt-2 text-white/70">Browse verified listings or list your own for free.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/properties" className="btn bg-white text-ink hover:bg-brand-50">Browse properties</Link>
            <Link href="/contact" className="btn border border-white/30 text-white hover:bg-white/10">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Value({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div className="card p-6">
      <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
