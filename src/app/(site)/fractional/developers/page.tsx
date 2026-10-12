import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Banknote, ClipboardCheck, FileStack, LayoutDashboard, Megaphone, UserPlus, Users } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { FaqList } from "@/components/site/faq-list";
import { PrelaunchBanner } from "@/components/fractional/regulatory-notice";
import { DEFAULT_FEES, developerProceeds } from "@/lib/fractional";

export const metadata: Metadata = pageMetadata({
  title: "Raise Capital for Your Property Project - Found Fractional for Developers",
  absoluteTitle: true,
  description: `Apply to raise capital for your real estate project through Found Fractional once it opens. Found would handle investor onboarding, the investor register and distributions for ${DEFAULT_FEES.platform}% of funds raised.`,
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
    { icon: Banknote, title: "Receive the capital", text: "Investors pay into a custodial account held with an SEC-registered custodian. If the raise closes above its minimum, the funds are released to the project." },
  ];
  const perks = [
    { icon: Users, title: "Many investors, one relationship", text: "Found deals with investors directly: KYC, subscriptions, questions and the share register." },
    { icon: Megaphone, title: "Listed on Found", text: "Approved offerings are presented to registered Found users, within the limits SEC rules set on advertising investments." },
    { icon: LayoutDashboard, title: "Investor reporting built in", text: "Post progress updates and Found emails every investor. Distributions are calculated and tracked for you." },
    { icon: BadgeCheck, title: "Independent review", text: "Every offering is reviewed against its documents before it can be listed. Found's review is due diligence, not an endorsement." },
  ];
  const faqs = [
    { q: "What can I raise for?", a: "Off-plan residential and commercial developments, completed income-generating property, and shortlet or serviced apartment blocks, usually for part of a project's cost. How much can be raised, and by whom, depends on the SEC rules that apply to the offering; Found will confirm this for each project." },
    { q: "What's an SPV and why do I need one?", a: "A special purpose vehicle is a company set up to own one property. Investors buy shares in it, so their money and ownership are tied to that property alone. Found can introduce you to lawyers who set them up." },
    { q: "What does it cost?", a: `Found charges ${DEFAULT_FEES.platform}% of the funds raised, deducted when the funds are released. There's no fee to apply or list, and nothing to pay if the raise doesn't reach its minimum. Found also earns a ${DEFAULT_FEES.management}% management fee on rental income it distributes.` },
    { q: "What if the raise isn't fully subscribed?", a: "You set a minimum raise (usually 60–80% of the target). If it's reached by the closing date, the raise goes ahead with what was raised. If not, investors are refunded in full and you pay nothing." },
    { q: "What do I owe investors?", a: "What the offering documents say: usually regular progress updates, rent passed through the SPV, and their share of the proceeds when the property is sold or refinanced. Targets you publish must be reasonable and supported, and must never be presented as guaranteed." },
    { q: "Is Found Fractional open now?", a: "Not yet. Found Fractional is in pre-launch and isn't accepting investments until its SEC registration is complete. You can apply and prepare an offering now so it's ready to review when the platform opens." },
  ];
  return (
    <>
      <PrelaunchBanner />
      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image src="/images/cta-bg1.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/85 to-brand-950/30" />
        <div className="container-page py-16 sm:py-24">
          <p className="text-sm font-semibold text-coral-200">Found Fractional for developers</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">Raise part of your project&apos;s capital from many investors.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Apply now to be reviewed for Found Fractional. Once the platform is registered with the SEC and open, approved developers can offer units in their property&apos;s SPV, with Found running onboarding, the register and distributions.
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
