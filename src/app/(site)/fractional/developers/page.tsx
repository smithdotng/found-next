import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Banknote, ClipboardCheck, FileStack, LayoutDashboard, Megaphone, UserPlus, Users } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { FaqList } from "@/components/site/faq-list";
import { DEFAULT_FEES, developerProceeds } from "@/lib/fractional";

export const metadata: Metadata = pageMetadata({
  title: "Raise Capital for Your Property Project - Found Fractional for Developers",
  absoluteTitle: true,
  description: `Unlock capital for your real estate project by offering fractional units to vetted investors on Found Fractional. Found handles onboarding, payments, the investor register and payouts for ${DEFAULT_FEES.platform}% of funds raised.`,
  path: "/fractional/developers",
  keywords: "raise capital real estate Nigeria, property developer funding, real estate crowdfunding for developers, Found Fractional developers",
});

const EXAMPLE = 150_000_000;

export default function DevelopersPage() {
  const ex = developerProceeds(EXAMPLE, DEFAULT_FEES.platform);
  const steps = [
    { icon: UserPlus, title: "Apply", text: "Tell us about your company and track record. We verify your CAC records, past projects and directors." },
    { icon: FileStack, title: "Prepare the offering", text: "Set up an SPV for the property, then add the title, valuation, budget, timeline and exit plan in your dashboard." },
    { icon: ClipboardCheck, title: "Found reviews it", text: "We check the documents and stress-test the numbers. Once it passes, the offering goes live to Found's investors." },
    { icon: Banknote, title: "Receive the capital", text: "Investors pay into the SPV's escrow account. When the raise closes above its minimum, the funds are released to the project." },
  ];
  const perks = [
    { icon: Users, title: "Hundreds of investors, one relationship", text: "Found deals with every investor: KYC, payments, questions and the share register." },
    { icon: Megaphone, title: "Marketing included", text: "Your offering is promoted to Found's audience of buyers, investors, realtors and agents." },
    { icon: LayoutDashboard, title: "Investor reporting built in", text: "Post progress updates and Found emails every investor. Distributions are calculated and tracked for you." },
    { icon: BadgeCheck, title: "Credibility that sells units", text: "A Found-reviewed offering gives your off-plan buyers and partners confidence too." },
  ];
  const faqs = [
    { q: "What can I raise for?", a: "Off-plan residential and commercial developments, completed income-generating property, and shortlet or serviced apartment blocks. You can raise part of a project's cost; most developers raise 20–60% and fund the rest themselves or through debt." },
    { q: "What's an SPV and why do I need one?", a: "A special purpose vehicle is a company set up to own one property. Investors buy shares in it, so their money and ownership are tied to that property alone. Found can introduce you to lawyers who set them up." },
    { q: "What does it cost?", a: `Found charges ${DEFAULT_FEES.platform}% of the funds raised, deducted when the funds are released. There's no fee to apply or list, and nothing to pay if the raise doesn't reach its minimum. Found also earns a ${DEFAULT_FEES.management}% management fee on rental income it distributes.` },
    { q: "What if the raise isn't fully subscribed?", a: "You set a minimum raise (usually 60–80% of the target). If it's reached by the closing date, the raise goes ahead with what was raised. If not, investors are refunded in full and you pay nothing." },
    { q: "What do I owe investors?", a: "What the offering documents say: usually regular progress updates, rent passed through the SPV, and their share of the proceeds when the property is sold or refinanced at the end of the term." },
  ];
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image src="/images/cta-bg1.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/85 to-brand-950/30" />
        <div className="container-page py-16 sm:py-24">
          <p className="text-sm font-semibold text-coral-200">Found Fractional for developers</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">Unlock capital for your project from investors who believe in it.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Offer fractional units of your property to Found&apos;s vetted investors. We run the raise, the register and the payouts, so you can focus on building.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/developer/register" className="btn-accent px-6 py-3 text-base">Apply to raise <ArrowRight className="size-4" /></Link>
            <Link href="/login?next=/dashboard/offerings" className="btn bg-white/10 px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/20">Developer sign in</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">How raising works</h2>
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
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">One fee, only when you raise</h2>
            <p className="mt-3 text-slate-600">
              No application or listing fee. Found charges <strong className="text-ink">{DEFAULT_FEES.platform}% of the funds raised</strong>, taken when the money is released to your project.
              If the raise doesn&apos;t reach its minimum, investors are refunded and you pay nothing.
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
            <p className="text-sm font-semibold text-slate-500">Example raise</p>
            <p className="mt-1 text-sm text-slate-500">3,000 units at {formatPrice(50_000)} towards a {formatPrice(400_000_000)} development</p>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div className="flex justify-between"><dt className="text-slate-600">Raised from investors</dt><dd className="font-medium">{formatPrice(ex.raised)}</dd></div>
              <div className="flex justify-between text-coral-600"><dt>Found fee ({DEFAULT_FEES.platform}%)</dt><dd>−{formatPrice(ex.fee)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-ink"><dt>Released to the project</dt><dd>{formatPrice(ex.net)}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">Investors pay a separate {DEFAULT_FEES.investor}% service fee on top of the unit price, so it doesn&apos;t come out of your raise.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Questions developers ask</h2>
        <div className="mt-6 max-w-3xl"><FaqList items={faqs} /></div>
        <div className="mt-12 text-center">
          <Link href="/developer/register" className="btn-accent px-6 py-3 text-base">Apply to raise <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </>
  );
}
