import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/dashboard/ui";
import { ListingForm } from "@/components/dashboard/listing-form";

export const metadata = { title: "Add listing" };

export default async function NewListingPage() {
  const session = await requireUser(["realtor", "admin", "host"]);
  const host = session.userType === "host";
  return (
    <>
      <Link href="/dashboard/listings" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink">
        <ArrowLeft className="size-4" /> {host ? "My apartments" : "Listings"}
      </Link>
      <PageHeader
        title={host ? "Add an apartment" : "Add a listing"}
        description={host ? "Describe your shortlet, set your nightly price and house rules. You can edit everything later." : "Fill in the essentials — you can edit everything later."}
      />
      <ListingForm isAdmin={session.userType === "admin"} shortletOnly={host} />
    </>
  );
}
