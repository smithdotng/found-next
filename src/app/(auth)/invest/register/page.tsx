import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { InvestorRegisterForm } from "./investor-register-form";

export const metadata: Metadata = pageMetadata({
  title: "Register Your Interest - Found Fractional",
  absoluteTitle: true,
  description: "Register your interest in Found Fractional, a planned platform for fractional ownership of Nigerian property. Pre-launch: no investments are being accepted yet.",
  path: "/invest/register",
});

export default async function InvestorRegisterPage({ searchParams }: PageProps<"/invest/register">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  return (
    <>
      <p className="text-sm font-semibold text-coral-500">Found Fractional</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Register your interest</h1>
      <p className="mt-2 text-slate-600">
        Found Fractional isn&apos;t open for investment yet and no money is being accepted. Register and we&apos;ll email you when it opens. Already have a Found account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand-600 hover:underline">Sign in</Link> instead.
      </p>
      <div className="mt-8">
        <InvestorRegisterForm next={next} />
      </div>
    </>
  );
}
