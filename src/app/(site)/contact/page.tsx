import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { FaqList } from "@/components/site/faq-list";
import { FAQS } from "@/lib/faqs";
import { pageMetadata } from "@/lib/seo";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us - Found Properties",
  absoluteTitle: true,
  description: "Get in touch with Found Projects & Realty Limited. Call +234 806 300 6890, email hello@found.ng or visit us in Wuse 2, Abuja.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="We're here to help" title="Contact us" lead="Questions about a listing, your account or partnering with us? Drop us a line." crumbs={[{ label: "Contact" }]} />
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <Info icon={Phone} title="Phone" lines={[<a key="p" href="tel:+2348063006890" className="hover:text-brand-600">+234 806 300 6890</a>]} />
          <Info icon={Mail} title="Email" lines={[<a key="e" href="mailto:hello@found.ng" className="hover:text-brand-600">hello@found.ng</a>]} />
          <Info icon={MapPin} title="Office" lines={["Suite 5 Gwandal Centre", "1015 Frai Close, Wuse 2", "Abuja, Nigeria"]} />
          <Info icon={Clock} title="Response time" lines={["We aim to respond within 24 hours on business days."]} />
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">Send us a message</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
      <section className="container-page max-w-3xl pb-10">
        <h2 className="mb-6 text-2xl font-bold text-ink">Quick answers</h2>
        <FaqList items={FAQS.slice(6)} />
      </section>
    </>
  );
}

function Info({ icon: Icon, title, lines }: { icon: typeof Phone; title: string; lines: React.ReactNode[] }) {
  return (
    <div className="card flex gap-4 p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-5" />
      </span>
      <div className="text-sm">
        <p className="font-semibold text-ink">{title}</p>
        {lines.map((l, i) => (
          <p key={i} className="text-slate-600">{l}</p>
        ))}
      </div>
    </div>
  );
}
