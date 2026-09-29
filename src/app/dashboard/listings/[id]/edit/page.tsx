import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Eye, Inbox } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Inquiry, Property } from "@/lib/models";
import { PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { ListingForm } from "@/components/dashboard/listing-form";
import { formatDate } from "@/lib/format";
import type { PropertyDoc } from "@/lib/types";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: PageProps<"/dashboard/listings/[id]/edit">) {
  const session = await requireUser(["realtor", "admin", "host"]);
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  await connectDB();
  const doc = await Property.findById(id).lean();
  if (!doc) notFound();
  const p = toPlain<PropertyDoc>(doc);
  if (session.userType !== "admin" && String(p.owner) !== session.userId) notFound();
  const leads = await Inquiry.countDocuments({ property: id });

  return (
    <>
      <Link href="/dashboard/listings" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink">
        <ArrowLeft className="size-4" /> {session.userType === "host" ? "My apartments" : "Listings"}
      </Link>
      <PageHeader
        title={session.userType === "host" ? "Edit apartment" : "Edit listing"}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <StatusBadge status={p.status} />
            <span className="flex items-center gap-1"><Eye className="size-3.5" /> {p.views} views</span>
            <Link href={`/dashboard/inquiries?property=${p._id}`} className="flex items-center gap-1 hover:text-brand-600"><Inbox className="size-3.5" /> {leads} enquiries</Link>
            <span>Listed {formatDate(p.createdAt)}</span>
          </span>
        }
        actions={
          <Link href={`/${p.propertyType === "shortlet" ? "apartments" : "properties"}/${p.slug}`} target="_blank" className="btn-outline">
            <ExternalLink className="size-4" /> View
          </Link>
        }
      />
      <>
        {p.propertyType === "shortlet" ? (
          <p className="mb-4 flex flex-wrap gap-3 text-sm">
            <Link href={`/dashboard/bookings?property=${p._id}`} className="btn-outline btn-sm">Bookings for this apartment</Link>
            <Link href={`/dashboard/calendar?property=${p._id}`} className="btn-outline btn-sm">Availability calendar</Link>
          </p>
        ) : null}
        <ListingForm listing={p} isAdmin={session.userType === "admin"} shortletOnly={session.userType === "host"} />
      </>
    </>
  );
}
