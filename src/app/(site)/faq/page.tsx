import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { FaqList, faqJsonLd } from "@/components/site/faq-list";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Frequently Asked Questions - Found Properties",
  absoluteTitle: true,
  description: "Answers about listing properties, becoming an agent, commissions, verification and coverage on Found Properties.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />
      <PageHero eyebrow="Quick answers" title="Frequently asked questions" crumbs={[{ label: "FAQ" }]} />
      <div className="container-page max-w-3xl py-14">
        <FaqList />
        <p className="mt-8 text-center text-sm text-slate-600">
          Still have questions?{" "}
          <Link href="/contact" className="font-semibold text-brand-600 hover:underline">
            Contact our support team
          </Link>
        </p>
      </div>
    </>
  );
}
