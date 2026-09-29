import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { HostRegisterForm } from "./host-register-form";

export const metadata: Metadata = pageMetadata({
  title: "Become a Host - List Your Shortlet on Found Apartments",
  absoluteTitle: true,
  description: "Apply to host on Found Apartments. Get vetted, sign the listing agreement online and start receiving booking requests for your shortlet apartments.",
  path: "/host/register",
  image: "/assets/images/og-apartments.jpg",
});

export default function HostRegisterPage() {
  return (
    <>
      <p className="text-sm font-semibold text-coral-500">Found Apartments</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Apply to become a host</h1>
      <p className="mt-2 text-slate-600">
        Tell us about you and your apartments. We vet every host before their listings go live.{" "}
        <Link href="/host" className="font-medium text-brand-600 hover:underline">How hosting works</Link>
      </p>
      <div className="mt-8">
        <HostRegisterForm />
      </div>
    </>
  );
}
