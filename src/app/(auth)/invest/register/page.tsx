import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { InvestorRegisterForm } from "./investor-register-form";

export const metadata: Metadata = pageMetadata({
  title: "Create an Investor Account - Found Fractional",
  absoluteTitle: true,
  description: "Create a free Found Fractional account to invest in vetted Nigerian property from the price of one unit.",
  path: "/invest/register",
});

export default async function InvestorRegisterPage({ searchParams }: PageProps<"/invest/register">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  return (
    <>
      <p className="text-sm font-semibold text-coral-500">Found Fractional</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Start investing in property</h1>
      <p className="mt-2 text-slate-600">
        Free to join. Already have a Found account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand-600 hover:underline">Sign in</Link> and invest with it.
      </p>
      <div className="mt-8">
        <InvestorRegisterForm next={next} />
      </div>
    </>
  );
}
