import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { User } from "@/lib/models";
import { PageHeader } from "@/components/dashboard/ui";
import { OfferingForm } from "@/components/fractional/offering-form";

export const metadata = { title: "New offering" };

export default async function NewOfferingPage() {
  const session = await requireUser(["developer", "admin"]);
  const isAdmin = session.userType === "admin";
  let developers: { _id: string; label: string }[] = [];
  if (isAdmin) {
    await connectDB();
    const list = toPlain<{ _id: string; name: string; developerProfile?: { company?: string; status?: string } }[]>(
      await User.find({ userType: "developer" }).select("name developerProfile.company developerProfile.status").sort({ name: 1 }).lean(),
    );
    developers = list.map((d) => ({ _id: d._id, label: `${d.developerProfile?.company || d.name}${d.developerProfile?.status === "approved" ? "" : " (not yet approved)"}` }));
  }
  return (
    <>
      <Link href="/dashboard/offerings" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink"><ArrowLeft className="size-4" /> Offerings</Link>
      <PageHeader title="New offering" description="Start with the basics and save a draft. You can add photos and documents and come back as often as you like before submitting." />
      <div className="card p-6 sm:p-8">
        <OfferingForm isAdmin={isAdmin} developers={developers} />
      </div>
    </>
  );
}
