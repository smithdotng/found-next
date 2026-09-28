import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy - Found Properties",
  absoluteTitle: true,
  description: "How Found Projects & Realty Limited collects, uses, shares and protects your personal information.",
  path: "/privacy-policy",
});

export default function PrivacyPage() {
  return <LegalPage file="privacy-policy.md" title="Privacy Policy" updated="June 17, 2026" />;
}
