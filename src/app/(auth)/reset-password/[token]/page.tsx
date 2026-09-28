import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { pageMetadata } from "@/lib/seo";
import { ResetForm } from "../../forgot-password/forgot-form";

export const metadata: Metadata = pageMetadata({ title: "Choose a new password", path: "/reset-password", noIndex: true });

export default async function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  const { token } = await params;
  await connectDB();
  const valid = await User.exists({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-ink">Choose a new password</h1>
      {valid ? (
        <div className="mt-8">
          <ResetForm token={token} />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>.
        </div>
      )}
    </>
  );
}
