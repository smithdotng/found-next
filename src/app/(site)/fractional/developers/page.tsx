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
  title: "Found Fractional for Developers - Apply for Review (Pre-launch)",
  absoluteTitle: true,
  description: "Property developers can apply to be reviewed for Found Fractional ahead of launch. Found Fractional is not yet registered with the SEC and no capital is being raised or accepted.",
  path: "/fractional/developers",
  keywords: "raise capital real estate Nigeria, property developer funding, real estate crowdfunding for developers, Found Fractional developers",
});

/** Within the SEC crowdfunding issuer caps (₦50M–₦100M a year, depending on company size). */
const EXAMPLE = 50_000_000;

export default function DevelopersPage() {
  const ex = developerProceeds(EXAMPLE, DEFAULT_FEES.platform);
  const steps = [
    { icon: UserPlus, title: "Apply", text: "Tell us about your company and track record. We check your CAC records, past projects and directors, and whether your company is eligible to raise under SEC rules." },
    { icon: FileStack, title: "Prepare the offering", text: "Set up an SPV for the property and prepare its title, valuation, budget, timeline and exit plan. Offerings stay as drafts until the platform opens." },
    { icon: ClipboardCheck, title: "Found reviews it", text: "We check the documents and test the numbers. Once the platform is registered and open, offerings that pass review can be published, together with the disclosures SEC rules require." },
    { icon: Banknote, title: "Capital released", text: "Once open, investors will pay into an account held by an SEC-registered custodian. Funds are released to the project only if the raise closes above its minimum." },
  ];
  const perks = [
    { icon: Users, title: "One point of contact", text: "Once open, Found would handle investor checks, subscriptions, questions and the share register." },
    { icon: Megaphone, title: "Presented on Found", text: "Approved offerings would be shown to registered Found users, only in the form and with the risk warnings SEC rules allow. Found doesn't promise any level of take-up." },
    { icon: LayoutDashboard, title: "Investor reporting built in", text: "Post progress updates for investors, and have distributions calculated and recorded for you." },
    { icon: BadgeCheck, title: "Independent review", text: "Every offering is reviewed against its documents before it can be listed. Found's review is due diligence, not an endorsement." },
  ];
  const faqs = [
    { q: "Who can raise, and how much?", a: "Under the SEC crowdfunding rules, raises are open to Nigerian-incorporated micro, small and medium enterprises, normally with at least two years of operating history, and are capped at ₦50 million, ₦70 million or ₦100 million in any 12 months depending on the company's size. Offerings run for up to 60 days (extendable by 30). Larger raises need a different SEC route. Found will confirm what applies to your project." },
    { q: "What's an SPV and why do I need one?", a: "A special purpose vehicle is a company set up to own one property. Investors buy shares in it, so their money and ownership are tied to that property alone. Found can introduce you to lawyers who set them up." },
    { q: "What does it cost?", a: `Found charges ${DEFAULT_FEES.platform}% of the funds raised, deducted when the funds are released. There's no fee to apply or list, and nothing to pay if the raise doesn't reach its minimum. Found also earns a ${DEFAULT_FEES.management}% management fee on rental income it distributes.` },
    { q: "What if the raise isn't fully subscribed?", a: "Each offering sets a target and a minimum. If the minimum is reached by the closing date, the raise goes ahead with what was raised. If not, the offering lapses, subscription money is returned to investors in line with the offering terms, and you pay no Found fee." },
    { q: "What do I owe investors?", a: "What the offering documents say: usually regular progress updates, rent passed through the SPV, and their share of the proceeds when the property is sold or refinanced. Any targets you publish must be reasonable, supported by evidence, and never presented as guaranteed. Investors' units are generally locked in for at least a year." },
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
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">Get your project ready for Found Fractional.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Found Fractional is in pre-launch and is not yet registered with the SEC. Developers can apply now to be reviewed, so their projects are ready to be considered when the platform opens. No capital is being raised or accepted.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/developer/register" className="btn-accent px-6 py-3 text-base">Apply for review <ArrowRight className="size-4" /></Link>
            <Link href="/login?next=/dashboard/offerings" className="btn bg-white/10 px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/20">Developer sign in</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">How raising would work</h2>
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
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Proposed fees</h2>
            <p className="mt-3 text-slate-600">
              No application or listing fee. Found would charge <strong className="text-ink">{DEFAULT_FEES.platform}% of the funds raised</strong>, taken when the money is released to your project.
              If a raise doesn&apos;t reach its minimum, it lapses and you pay no Found fee. Fees are confirmed in each offering agreement.
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
            <p className="text-sm font-semibold text-slate-500">Fee illustration</p>
            <p className="mt-1 text-sm text-slate-500">1,000 units at {formatPrice(50_000)}, if fully subscribed</p>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div className="flex justify-between"><dt className="text-slate-600">Subscribed by investors</dt><dd className="font-medium">{formatPrice(ex.raised)}</dd></div>
              <div className="flex justify-between text-coral-600"><dt>Found fee ({DEFAULT_FEES.platform}%)</dt><dd>−{formatPrice(ex.fee)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-ink"><dt>Released to the project</dt><dd>{formatPrice(ex.net)}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">Illustrative only; there is no guarantee any raise will be subscribed. Investors would pay a separate {DEFAULT_FEES.investor}% service fee on top of the unit price.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Questions developers ask</h2>
        <div className="mt-6 max-w-3xl"><FaqList items={faqs} /></div>
        <div className="mt-12 text-center">
          <Link href="/developer/register" className="btn-accent px-6 py-3 text-base">Apply for review <ArrowRight className="size-4" /></Link>
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-5 text-slate-500">
          Found Fractional is in pre-launch and is not registered with the Securities and Exchange Commission, Nigeria. Nothing on this page is an offer to raise or invest capital, and
          applying does not mean an offering will be approved or published. Any offering will be made only once the required SEC registration is in place, and only with its offering
          documents and risk disclosures.
        </p>
      </section>
    </>
  );
}
