import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Briefcase, Globe2, KeyRound, Landmark, Lock, Scale, ShieldCheck, UserRound, Video } from "lucide-react";
import { connectDB, toPlain } from "@/lib/db";
import { Property } from "@/lib/models";
import { prestigeQuery } from "@/lib/prestige";
import { pageMetadata } from "@/lib/seo";
import { PropertyCard } from "@/components/property/property-card";
import { PrivateClientForm } from "@/components/prestige/private-client-form";
import { prestigeSerif } from "@/components/prestige/fonts";
import type { PropertyDoc } from "@/lib/types";

export const metadata: Metadata = pageMetadata({
  title: "Found Prestige: Exceptional Property, Quietly Found",
  absoluteTitle: true,
  description:
    "Found Prestige is a private, Verified-only collection of premium homes and investments in Abuja and Lagos, with a dedicated relationship manager, confidential viewings and fully checked titles.",
  path: "/prestige",
  image: "/assets/images/og-prestige.jpg",
});


const GOLD = "text-[#c8a96a]";

export default async function PrestigePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const partner = one(sp.partner)?.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || undefined;
  const propertyId = one(sp.property);

  await connectDB();
  const docs = await Property.find(prestigeQuery()).sort({ prestige: -1, price: -1 }).limit(12).populate("owner", "name").lean();
  const items = toPlain<PropertyDoc[]>(docs);
  const enquired = propertyId && /^[a-f0-9]{24}$/i.test(propertyId) ? items.find((p) => p._id === propertyId) : undefined;

  const pillars = [
    { icon: BadgeCheck, title: "Verified beyond doubt", text: "Every property is checked by Found: title type and holder, encumbrances, the seller's authority to sell and the survey, before you ever see it." },
    { icon: Lock, title: "Complete discretion", text: "Off-market homes, confidential viewings and NDAs on request. Your name is never shared with a seller or realtor without your permission." },
    { icon: UserRound, title: "One relationship manager", text: "A named person who knows your brief, arranges every viewing, and coordinates with your lawyer and your bank from first call to keys." },
    { icon: ShieldCheck, title: "Protected transactions", text: "We work alongside your lawyer and bank so money moves only when the title documents check out. No pressure, no shortcuts." },
  ];
  const steps = [
    { title: "A private conversation", text: "Tell your relationship manager what you're looking for, and what you'd rather keep confidential." },
    { title: "A curated shortlist", text: "Verified homes and investments that match your brief, including properties that are never advertised." },
    { title: "Private viewings", text: "In person or by live video, at times that suit you, with the full verification file to hand." },
    { title: "A protected close", text: "We coordinate the title search, your lawyer and the payment schedule until the keys are yours." },
  ];

  return (
    <div className={prestigeSerif.variable}>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#0b1622]">
        <Image src="/images/cta-bg1.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1622] via-[#0b1622]/90 to-[#0b1622]/30" />
        <div className="container-page py-20 sm:py-28 lg:py-32">
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${GOLD}`}>Found Prestige</p>
          <h1 className="prestige-display mt-5 max-w-3xl text-[2.6rem] leading-[1.05] text-white sm:text-6xl">
            Exceptional property, <em className="text-[#e9d9b6]">quietly</em> found.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
            A private, Verified-only collection of premium homes and investments in Abuja and Lagos, with a relationship manager who handles everything, and your privacy at the centre of it.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#concierge" className="inline-flex items-center gap-2 rounded-xl bg-[#c8a96a] px-6 py-3.5 text-[15px] font-semibold text-[#0b1622] transition hover:bg-[#d6b97d]">
              Request a private consultation <ArrowRight className="size-4" />
            </a>
            <a href="#collection" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10">
              View the collection
            </a>
          </div>
          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/60">
            {["Verified titles only", "Off-market & confidential", "Diaspora-ready"].map((t) => (
              <li key={t} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#c8a96a]" /> {t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-[#f7f4ee] py-16 sm:py-20">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a7b3f]">The Prestige standard</p>
          <h2 className="prestige-display mt-3 max-w-2xl text-3xl text-ink sm:text-4xl">What you can expect from us</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-[#e4dccb] sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="bg-[#fbf9f5] p-7">
                <p.icon className="size-6 text-[#9a7b3f]" />
                <h3 className="mt-5 font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collection */}
      <section id="collection" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a7b3f]">The collection</p>
              <h2 className="prestige-display mt-3 text-3xl text-ink sm:text-4xl">Verified premium property</h2>
              <p className="mt-2 max-w-xl text-slate-600">Only listings that have passed Found&apos;s verification appear here. Much of what we offer is shared privately, so tell us your brief for the full picture.</p>
            </div>
            <a href="#concierge" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9a7b3f] hover:underline">Ask for the private list <ArrowRight className="size-4" /></a>
          </div>
          {items.length ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p, i) => (
                <PropertyCard key={p._id} p={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid items-center gap-8 overflow-hidden rounded-3xl bg-[#0b1622] p-8 text-white sm:p-12 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <KeyRound className={`size-7 ${GOLD}`} />
                <p className="prestige-display mt-4 text-2xl sm:text-3xl">Our current collection is shared privately.</p>
                <p className="mt-3 max-w-lg text-white/70">Many owners at this level prefer not to advertise. Tell your relationship manager what you&apos;re looking for and we&apos;ll send a curated shortlist of Verified homes, including off-market ones.</p>
              </div>
              <a href="#concierge" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8a96a] px-6 py-4 font-semibold text-[#0b1622] hover:bg-[#d6b97d] lg:justify-self-end">
                Request the private list <ArrowRight className="size-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Diaspora */}
      <section className="bg-[#f7f4ee] py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a7b3f]">Buying from abroad</p>
            <h2 className="prestige-display mt-3 text-3xl text-ink sm:text-4xl">Own in Nigeria with confidence, wherever you live</h2>
            <p className="mt-4 text-slate-600">
              The biggest risk in buying from a distance is not seeing what you&apos;re paying for. Found Prestige removes that risk, so you can buy from London, Houston or Dubai as safely as from Abuja.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: Video, t: "Live video inspections", d: "Walk through the property with your relationship manager, room by room, in real time." },
              { icon: Scale, t: "Independent title report", d: "The full verification file and an official search, reviewed with your lawyer before you commit." },
              { icon: Globe2, t: "A clear payment path", d: "A documented, staged payment schedule agreed with your bank and lawyer, with receipts at every step." },
            ].map((x) => (
              <li key={x.t} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
                <x.icon className="mt-0.5 size-5 shrink-0 text-[#9a7b3f]" />
                <span><strong className="block text-ink">{x.t}</strong><span className="text-sm text-slate-600">{x.d}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a7b3f]">How it works</p>
          <h2 className="prestige-display mt-3 text-3xl text-ink sm:text-4xl">From first call to keys</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-[#e4dccb] pt-5">
                <span className="prestige-display text-4xl text-[#c8a96a]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Concierge */}
      <section id="concierge" className="scroll-mt-16 bg-[#0b1622] py-16 sm:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${GOLD}`}>Private client concierge</p>
            <h2 className="prestige-display mt-4 text-4xl leading-tight text-white sm:text-5xl">Let&apos;s start with a conversation.</h2>
            <p className="mt-5 max-w-md text-white/70">
              Share as much or as little as you like. A relationship manager will call you within one working day, and nothing you tell us is passed on without your permission.
            </p>
            <dl className="mt-10 space-y-4 text-sm">
              <div className="flex gap-3 text-white/80"><UserRound className={`size-5 ${GOLD}`} /> A named relationship manager, not a call centre</div>
              <div className="flex gap-3 text-white/80"><Lock className={`size-5 ${GOLD}`} /> Confidential by default. NDAs on request</div>
              <div className="flex gap-3 text-white/80"><BadgeCheck className={`size-5 ${GOLD}`} /> Only Verified property, always</div>
            </dl>
            <p className="mt-10 text-sm text-white/50">Prefer to call? <a href="tel:+2349092357149" className="text-white/80 underline-offset-4 hover:underline">0909 235 7149</a> · <a href="mailto:admin@found.ng?subject=Found%20Prestige" className="text-white/80 underline-offset-4 hover:underline">admin@found.ng</a></p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-9">
            <PrivateClientForm partner={partner} propertyId={enquired?._id} propertyTitle={enquired?.title} />
          </div>
        </div>
      </section>

      {/* Advisers & owners */}
      <section className="bg-[#f7f4ee] py-16 sm:py-20">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
            <Landmark className="size-6 text-[#9a7b3f]" />
            <h2 className="prestige-display mt-4 text-2xl text-ink sm:text-3xl">For private banks, wealth managers and law firms</h2>
            <p className="mt-3 text-slate-600">
              Refer clients to a property partner you can stand behind: Verified titles, a named point of contact, and reporting you can share with your client. We&apos;ll set you up with your own referral link and a dedicated relationship manager.
            </p>
            <a href="mailto:admin@found.ng?subject=Found%20Prestige%20partnership" className="mt-6 inline-flex items-center gap-2 font-semibold text-[#9a7b3f] hover:underline">
              Become a referral partner <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
            <Briefcase className="size-6 text-[#9a7b3f]" />
            <h2 className="prestige-display mt-4 text-2xl text-ink sm:text-3xl">Selling or letting a premium property?</h2>
            <p className="mt-3 text-slate-600">
              Reach qualified, Verified-ready buyers without advertising to the world. Get your property verified, then ask us about a confidential Prestige listing.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/get-verified" className="inline-flex items-center gap-2 font-semibold text-[#9a7b3f] hover:underline">Get verified <ArrowRight className="size-4" /></Link>
              <a href="#concierge" className="inline-flex items-center gap-2 font-semibold text-ink hover:underline">Talk to us</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
