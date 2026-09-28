import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = pageMetadata({
  title: "Forgot password - Found Properties",
  absoluteTitle: true,
  description: "Reset the password for your Found Properties account.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-ink">Reset your password</h1>
      <p className="mt-2 text-slate-600">Enter your account email and we&apos;ll send you a link to choose a new password.</p>
      <div className="mt-8">
        <ForgotForm />
      </div>
    </>
  );
}
