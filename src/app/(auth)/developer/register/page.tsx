import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { DeveloperRegisterForm } from "./developer-register-form";

export const metadata: Metadata = pageMetadata({
  title: "Developer Application - Found Fractional (Pre-launch)",
  absoluteTitle: true,
  description: "Apply to have your company and project reviewed for Found Fractional ahead of launch. No capital is being raised yet.",
  path: "/developer/register",
});

export default function DeveloperRegisterPage() {
  return (
    <>
      <p className="text-sm font-semibold text-coral-500">Found Fractional for developers</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Apply for review</h1>
      <p className="mt-2 text-slate-600">
        Tell us about your company. Found Fractional is in pre-launch, so no capital can be raised yet; we review developers now so projects are ready when it opens.{" "}
        <Link href="/fractional/developers" className="font-medium text-brand-600 hover:underline">How it would work</Link>
      </p>
      <div className="mt-8">
        <DeveloperRegisterForm />
      </div>
    </>
  );
}
