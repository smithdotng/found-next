import type { Metadata } from "next";
import Link from "next/link";
import { MailX } from "lucide-react";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Unsubscribed", path: "/unsubscribe", noIndex: true });

// Same behaviour as the Express /unsubscribe/:id route used in newsletter footers.
export default async function UnsubscribePage({ params }: PageProps<"/unsubscribe/[id]">) {
  const { id } = await params;
  let ok = true;
  try {
    if (/^[a-f0-9]{24}$/i.test(id)) {
      await connectDB();
      await User.updateOne(
        { _id: id },
        { $set: { newsletter: false, "preferences.weeklyNewsletter": false, "preferences.marketingEmails": false } },
      );
    }
  } catch (e) {
    console.error("Unsubscribe error:", e);
    ok = false;
  }
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16">
      <div className="card max-w-md p-10 text-center">
        <MailX className="mx-auto size-10 text-brand-600" />
        <h1 className="mt-4 text-2xl font-bold text-ink">{ok ? "You've been unsubscribed" : "Something went wrong"}</h1>
        <p className="mt-2 text-slate-600">
          {ok
            ? "You will no longer receive newsletter or marketing emails from Found Projects & Realty."
            : "We couldn't process your request. Please contact hello@found.ng."}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Changed your mind? Update your preferences anytime from your{" "}
          <Link href="/dashboard/profile" className="font-medium text-brand-600 hover:underline">dashboard</Link>.
        </p>
      </div>
    </div>
  );
}
