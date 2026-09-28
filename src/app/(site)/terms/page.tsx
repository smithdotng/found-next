import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use - Found Properties",
  absoluteTitle: true,
  description: "The terms that govern your use of the Found Properties platform operated by Found Projects & Realty Limited.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage file="terms.md" title="Terms of Use" updated="June 17, 2026" />;
}
