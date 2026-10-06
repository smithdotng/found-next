import { ClipboardCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Property } from "@/lib/models";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { ApprovalCard } from "@/components/dashboard/approval-card";
import type { PropertyDoc } from "@/lib/types";

export const metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  await requireUser(["admin"]);
  await connectDB();
  const items = toPlain<PropertyDoc[]>(
    await Property.find({ status: "pending" }).sort({ "verification.verified": -1, createdAt: 1 }).populate("owner", "name email phone realtorProfile createdAt userType hostProfile.businessName hostProfile.status hostProfile.agreement.status").lean(),
  );
  return (
    <>
      <PageHeader title="Approval queue" description={`${items.length} listing${items.length === 1 ? "" : "s"} waiting, oldest first. Check photos, price and address before approving.`} />
      {items.length ? (
        <div className="space-y-5">
          {items.map((p) => (
            <ApprovalCard key={p._id} p={p} />
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardCheck} title="All caught up" text="New listings submitted by realtors will appear here." />
      )}
    </>
  );
}
