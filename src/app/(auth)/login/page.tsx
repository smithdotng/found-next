import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = pageMetadata({
  title: "Sign in - Found Properties",
  absoluteTitle: true,
  description: "Sign in to manage your listings, enquiries and referrals on Found Properties.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await getSession();
  if (session.userId) redirect("/dashboard");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-2 text-slate-600">Sign in to your realtor, agent or admin account.</p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </>
  );
}
