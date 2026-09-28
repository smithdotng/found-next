import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = pageMetadata({
  title: "Register as a Realtor - List Properties Free on Found",
  absoluteTitle: true,
  description: "Create a free realtor account on Found Properties and list unlimited properties to buyers and tenants across Nigeria.",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <>
      <p className="text-sm font-semibold text-coral-500">Free for realtors</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Create your realtor account</h1>
      <p className="mt-2 text-slate-600">
        List unlimited properties and manage enquiries in one place. Want to earn by promoting listings instead?{" "}
        <Link href="/agent/register" className="font-medium text-brand-600 hover:underline">Join as an agent</Link>.
      </p>
      <div className="mt-8">
        <RegisterForm kind="realtor" />
      </div>
    </>
  );
}
