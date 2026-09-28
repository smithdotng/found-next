import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { RegisterForm } from "../../register/register-form";

export const metadata: Metadata = pageMetadata({
  title: "Become an Agent - Earn 70% Commission with Found Properties",
  absoluteTitle: true,
  description: "Join Found as an agent for free. Share tracked links to verified listings and earn 70% of the agency fee on every successful referral.",
  path: "/agent/register",
});

export default function AgentRegisterPage() {
  return (
    <>
      <p className="text-sm font-semibold text-coral-500">Free to join · earn 70%</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Become a Found agent</h1>
      <p className="mt-2 text-slate-600">
        Get tracked links and QR codes for verified listings. Listing your own properties?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">Register as a realtor</Link>.
      </p>
      <div className="mt-8">
        <RegisterForm kind="agent" />
      </div>
    </>
  );
}
