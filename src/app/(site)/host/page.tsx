import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, CalendarDays, ClipboardCheck, FileSignature, Inbox, LayoutDashboard, UserPlus } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { DEFAULT_COMMISSION, commissionFor } from "@/lib/stay";

export const metadata: Metadata = pageMetadata({
  title: "Host on Found Apartments - List Your Shortlet Apartments",
  absoluteTitle: true,
  description: `List your shortlet apartments on Found Apartments. Free to list, vetted hosts, live booking calendar and your own dashboard. Found earns ${DEFAULT_COMMISSION}% only on completed stays.`,
  path: "/host",
  image: "/assets/images/og-apartments.jpg",
  keywords: "list shortlet apartment, become a host Nigeria, shortlet hosting Abuja, shortlet hosting Lagos, Found Apartments host",
});

const EXAMPLE = { nightly: 80000, nights: 3 };

export default function HostPage() {
  const total = EXAMPLE.nightly * EXAMPLE.nights;
  const fee = commissionFor(total);
  const steps = [
    { icon: UserPlus, title: "Apply", text: "Create a host account and tell us about your apartments. It takes five minutes." },
    { icon: ClipboardCheck, title: "Get vetted", text: "We verify your ID and ownership or authority to let, and may inspect the apartment." },
    { icon: FileSignature, title: "Sign the agreement", text: `Review and sign the listing agreement online — ${DEFAULT_COMMISSION}% commission, no listing fees.` },
    { icon: Inbox, title: "Accept bookings", text: "Guests request dates; you confirm, collect payment directly and welcome them in." },
  ];
  const perks = [
    { icon: LayoutDashboard, title: "Your own host dashboard", text: "Requests, confirmed stays, payments and commission in one place." },
    { icon: CalendarDays, title: "Live availability calendar", text: "Confirmed stays block dates automatically. Close dates for your own use in a tap." },
    { icon: BadgeCheck, title: "A 'Vetted by Found' badge", text: "Guests book with confidence knowing we've checked you and your apartment." },
  ];
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image src="/images/featured-bg.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/85 to-brand-950/30" />
        <div className="container-page py-16 sm:py-24">
          <p className="text-sm font-semibold text-coral-200">Found Apartments for hosts</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">Fill your shortlet calendar with guests you can trust.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Free to list. We vet every host, send you verified booking requests, and only earn when a guest actually stays.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/host/register" className="btn-accent px-6 py-3 text-base">Apply to host <ArrowRight className="size-4" /></Link>
            <Link href="/login" className="btn bg-white/10 px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/20">Host sign in</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">How hosting works</h2>
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
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Simple, transparent pricing</h2>
            <p className="mt-3 text-slate-600">
              No sign-up fee and no listing fee. Found&apos;s commission is <strong className="text-ink">{DEFAULT_COMMISSION}% of the accommodation total</strong> of each stay booked through
              Found Apartments — agreed in writing before you go live. The refundable caution fee is yours and isn&apos;t included.
            </p>
            <ul className="mt-6 space-y-3">
              {perks.map((p) => (
                <li key={p.title} className="flex gap-3">
                  <p.icon className="mt-0.5 size-5 shrink-0 text-brand-600" />
                  <span><strong className="text-ink">{p.title}.</strong> <span className="text-slate-600">{p.text}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6 sm:p-8">
            <p className="text-sm font-semibold text-slate-500">Example stay</p>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div className="flex justify-between"><dt className="text-slate-600">{formatPrice(EXAMPLE.nightly)} × {EXAMPLE.nights} nights</dt><dd className="font-medium">{formatPrice(total)}</dd></div>
              <div className="flex justify-between text-coral-600"><dt>Found commission ({DEFAULT_COMMISSION}%)</dt><dd>−{formatPrice(fee)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-ink"><dt>You keep</dt><dd>{formatPrice(total - fee)}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">You collect payment from the guest directly; commission is settled with Found within 7 days of check-out.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Ready to host?</h2>
        <p className="mx-auto mt-2 max-w-lg text-slate-600">Apply today and start adding your apartments while we review your account.</p>
        <Link href="/host/register" className="btn-accent mt-6 px-6 py-3 text-base">Apply to host <ArrowRight className="size-4" /></Link>
      </section>
    </>
  );
}
