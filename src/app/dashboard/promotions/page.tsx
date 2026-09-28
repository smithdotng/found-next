import Link from "next/link";
import { Megaphone, Search } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getAgentOverview } from "@/lib/dashboard";
import { PageHeader, EmptyState, StatCard } from "@/components/dashboard/ui";
import { PromotionList } from "@/components/dashboard/promotion-list";
import { MousePointerClick, Inbox, Share2 } from "lucide-react";

export const metadata = { title: "My promotions" };

export default async function PromotionsPage() {
  const session = await requireUser(["agent"]);
  const d = await getAgentOverview(session.userId);
  const ctr = d.totals.clicks ? ((d.totals.inquiries / d.totals.clicks) * 100).toFixed(1) : "0";
  return (
    <>
      <PageHeader
        title="My promotions"
        description="Your tracked links, QR codes and how each one is performing."
        actions={<Link href="/dashboard/promote" className="btn-primary"><Search className="size-4" /> Find more properties</Link>}
      />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Clicks" value={d.totals.clicks.toLocaleString()} icon={MousePointerClick} />
        <StatCard label="Enquiries" value={d.totals.inquiries} icon={Inbox} tone="coral" />
        <StatCard label="Click → enquiry" value={`${ctr}%`} icon={Share2} tone="emerald" />
      </div>
      {d.promotions.length ? (
        <PromotionList promotions={d.promotions} />
      ) : (
        <EmptyState icon={Megaphone} title="No promotions yet" text="Choose a property and we'll create your personal link and QR code." action={<Link href="/dashboard/promote" className="btn-primary">Find properties</Link>} />
      )}
    </>
  );
}
