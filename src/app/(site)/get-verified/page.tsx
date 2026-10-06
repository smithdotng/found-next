import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Building2, Check, FileCheck2, Landmark, Send, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { VERIFICATION_PLANS } from "@/lib/verification";
import { PaymentAccount } from "@/components/site/payment-account";

const { property: PER_PROPERTY, annual: ANNUAL } = VERIFICATION_PLANS;
const BREAK_EVEN = Math.ceil(ANNUAL.price / PER_PROPERTY.price);

export const metadata: Metadata = pageMetadata({
  title: "Get Verified on Found - Verified Realtors and Listings",
  absoluteTitle: true,
  description: `Earn the Verified by Found badge. Verify a single property for ${formatPrice(PER_PROPERTY.price)}, or become a verified realtor for ${formatPrice(ANNUAL.price)} a year and every listing is verified automatically.`,
  path: "/get-verified",
  keywords: "verified realtor Nigeria, verified property listing, Found verified badge, property verification Abuja, realtor verification",
});

export default function GetVerifiedPage() {
  const benefits = [
    { icon: ShieldCheck, title: "The Verified by Found badge", text: "Shown on your listing cards and property pages, so buyers and tenants know you've been checked." },
    { icon: Zap, title: "Faster listing approval", text: "Verified listings move to the front of our review queue." },
    { icon: TrendingUp, title: "More serious enquiries", text: "Clients reach out with confidence when they know the listing and the realtor are genuine." },
    { icon: Sparkles, title: "Stand out in search", text: "Verified listings are easy to spot among similar properties." },
  ];
  const steps = [
    { icon: Building2, title: "Choose a plan", text: "Verify individual properties, or get verified as a realtor for the year." },
    { icon: Landmark, title: "Pay by transfer", text: "Transfer the fee to Found Projects & Realty Limited's Zenith Bank account below." },
    { icon: Send, title: "Submit your payment", text: "Tell us about your transfer from your dashboard, and attach the receipt if you have it." },
    { icon: FileCheck2, title: "We verify you", text: "We confirm your payment, identity and authority to list, then switch on your badge." },
  ];
  const faqs = [
    {
      q: "Can I still list without being verified?",
      a: "Yes. Listing on Found is still free and your properties go live after our usual review. They just won't carry the Verified by Found badge.",
    },
    {
      q: "Which plan is better for me?",
      a: `Property verification is ${formatPrice(PER_PROPERTY.price)} per listing. The verified realtor plan is ${formatPrice(ANNUAL.price)} a year and covers every listing you publish in that year, so it works out cheaper once you have ${BREAK_EVEN} or more listings.`,
    },
    {
      q: "How long does a property verification last?",
      a: "A property verification stays with that listing. The verified realtor plan runs for 12 months from approval, and you can renew it to keep your badge.",
    },
    {
      q: "What do you check?",
      a: "We confirm your payment and your identity, and that you own the property or have the authority to list it. We may ask for documents or arrange an inspection.",
    },
    {
      q: "How long does it take?",
      a: "Usually within 2 working days of receiving your payment details. We'll email you as soon as your badge is live.",
    },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image src="/images/cta-bg1.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/90 to-brand-950/40" />
        <div className="container-page py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-200 ring-1 ring-white/15">
            <BadgeCheck className="size-4" /> Verified by Found
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">Get verified. Earn trust. Close more deals.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Clients choose realtors they can trust. The Verified by Found badge tells them you and your listings have been checked by us.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard/verification" className="btn-accent px-6 py-3 text-base">
              Get verified <ArrowRight className="size-4" />
            </Link>
            <a href="#plans" className="btn bg-white/10 px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/20">
              See plans
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <b.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{b.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="plans" className="scroll-mt-20 bg-slate-50 py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Choose your plan</h2>
            <p className="mt-2 text-slate-600">One-off verification for a single property, or a yearly plan that covers everything you list.</p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="card flex flex-col p-6 sm:p-8">
              <p className="text-sm font-semibold text-brand-600">{PER_PROPERTY.name}</p>
              <p className="mt-3 text-4xl font-extrabold tracking-tight text-ink">
                {formatPrice(PER_PROPERTY.price)}
                <span className="ml-1 text-base font-medium text-slate-500">{PER_PROPERTY.unit}</span>
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{PER_PROPERTY.summary}</p>
              <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
                {["Badge on the listings you choose", "Pay only for what you need", "Verification stays with the listing"].map((t) => (
                  <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {t}</li>
                ))}
              </ul>
              <Link href="/dashboard/verification?plan=property" className="btn-outline mt-8 w-full py-3">
                Verify a property
              </Link>
            </div>

            <div className="relative flex flex-col rounded-2xl bg-ink p-6 text-white shadow-lift sm:p-8">
              <span className="absolute -top-3 right-6 rounded-full bg-coral-500 px-3 py-1 text-xs font-bold uppercase tracking-wide">Best value</span>
              <p className="text-sm font-semibold text-emerald-300">{ANNUAL.name}</p>
              <p className="mt-3 text-4xl font-extrabold tracking-tight">
                {formatPrice(ANNUAL.price)}
                <span className="ml-1 text-base font-medium text-white/60">{ANNUAL.unit}</span>
              </p>
              <p className="mt-3 text-sm leading-6 text-white/75">{ANNUAL.summary}</p>
              <ul className="mt-6 space-y-2.5 text-sm text-white/90">
                {[
                  "Verified realtor badge on your profile",
                  "All your listings verified automatically",
                  "New listings verified the moment you publish",
                  `Cheaper from ${BREAK_EVEN} listings`,
                ].map((t) => (
                  <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" /> {t}</li>
                ))}
              </ul>
              <Link href="/dashboard/verification?plan=annual" className="btn-accent mt-8 w-full py-3">
                Become a verified realtor
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-6 flex max-w-4xl items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <Building2 className="mt-0.5 size-5 shrink-0 text-slate-400" />
            <p>
              <strong className="text-ink">Not ready yet?</strong> You can still list your properties on Found for free. They&apos;ll go live after our usual review,
              just without the Verified by Found badge. You can verify them any time.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">How it works</h2>
            <ol className="mt-8 space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral-50 text-coral-600">
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Step {i + 1}</p>
                    <h3 className="font-semibold text-ink">{s.title}</h3>
                    <p className="mt-0.5 text-sm leading-6 text-slate-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-4">
            <PaymentAccount />
            <Link href="/dashboard/verification" className="btn-primary w-full py-3">
              I&apos;ve paid, submit my details <ArrowRight className="size-4" />
            </Link>
            <p className="text-center text-xs text-slate-500">You&apos;ll be asked to sign in to your realtor account.</p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Questions</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-ink">
                  {f.q}
                  <span className="text-xl leading-none text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            Still have questions? <Link href="/contact" className="font-semibold text-brand-600 hover:underline">Contact us</Link>
          </p>
        </div>
      </section>
    </>
  );
}
