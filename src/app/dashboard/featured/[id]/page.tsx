import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { FeaturedProperty, Property } from "@/lib/models";
import { PageHeader } from "@/components/dashboard/ui";
import { FeaturedForm, type FeaturedDoc } from "@/components/dashboard/content-forms";

export const metadata = { title: "Featured deal" };

export default async function FeaturedEditor({ params }: PageProps<"/dashboard/featured/[id]">) {
  await requireUser(["admin"]);
  const { id } = await params;
  await connectDB();
  let doc: FeaturedDoc | undefined;
  if (id !== "new") {
    if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
    const d = await FeaturedProperty.findById(id).lean();
    if (!d) notFound();
    doc = toPlain<FeaturedDoc>(d);
  }
  const properties = toPlain<{ _id: string; title: string }[]>(await Property.find({ status: "available" }).select("title").sort("-createdAt").limit(500).lean());
  return (
    <>
      <Link href="/dashboard/featured" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink"><ArrowLeft className="size-4" /> Featured deals</Link>
      <PageHeader title={doc ? "Edit featured deal" : "Add featured deal"} />
      <FeaturedForm doc={doc} properties={properties} />
    </>
  );
}
