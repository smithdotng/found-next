import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { DeveloperRegisterForm } from "./developer-register-form";

export const metadata: Metadata = pageMetadata({
  title: "Apply to Raise Capital - Found Fractional for Developers",
  absoluteTitle: true,
  description: "Apply to raise capital for your real estate project from Found Fractional investors.",
  path: "/developer/register",
});

export default function DeveloperRegisterPage() {
  return (
    <>
      <p className="text-sm font-semibold text-coral-500">Found Fractional for developers</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Apply to raise capital</h1>
      <p className="mt-2 text-slate-600">
        Tell us about your company. We vet every developer before their offerings go live.{" "}
        <Link href="/fractional/developers" className="font-medium text-brand-600 hover:underline">How raising works</Link>
      </p>
      <div className="mt-8">
        <DeveloperRegisterForm />
      </div>
    </>
  );
}
