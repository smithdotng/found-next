import Link from "next/link";
import clsx from "clsx";
import { Clock, Landmark, PlusCircle, Star } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { getDeveloperOfferings } from "@/lib/fractional-data";
import { EmptyState, PageHeader, StatCard, Tabs } from "@/components/dashboard/ui";
import { SmartImage } from "@/components/ui/smart-image";
import { FundingBar } from "@/components/fractional/offering-card";
import { formatCompactPrice, formatDate } from "@/lib/format";
import { OFFERING_STATUS, type OfferingStatus } from "@/lib/fractional";

export const metadata = { title: "Offerings" };

export default async function OfferingsPage({ searchParams }: PageProps<"/dashboard/offerings">) {
  const session = await requireUser(["developer", "admin"]);
  const isAdmin = session.userType === "admin";
  const sp = await searchParams;
  const all = await getDeveloperOfferings(isAdmin ? undefined : session.userId);
  await connectDB();
  const me = isAdmin ? null : await User.findById(session.userId).select("developerProfile").lean<{ developerProfile?: { status?: string; reviewNote?: string; company?: string } }>();

  const tab = typeof sp.status === "string" ? sp.status : isAdmin && all.some((o) => o.status === "in_review") ? "in_review" : "all";
  const groups: Record<string, OfferingStatus[]> = {
    in_review: ["in_review"],
    drafts: ["draft", "changes_requested"],
    live: ["live", "funded"],
    active: ["active", "exited"],
    cancelled: ["cancelled"],
  };
  const count = (k: string) => all.filter((o) => groups[k].includes(o.status)).length;
  const list = tab === "all" ? all : all.filter((o) => groups[tab]?.includes(o.status));
  const raised = all.reduce((a, o) => a + o.unitsSold * o.unitPrice, 0);
  const investors = all.reduce((a, o) => a + o.investorCount, 0);

  return (
    <>
      <PageHeader
        title={isAdmin ? "Fractional offerings" : "My offerings"}
        description={isAdmin ? "Review developer offerings, manage live raises and track funding." : "Raise capital for your projects from Found Fractional investors."}
        actions={<Link href="/dashboard/offerings/new" className="btn-primary"><PlusCircle className="size-4" /> New offering</Link>}
      />
      {me?.developerProfile?.status && me.developerProfile.status !== "approved" ? (
        <div className={clsx("mb-6 rounded-2xl p-4 text-sm", me.developerProfile.status === "pending" ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-800")}>
          <p className="flex items-center gap-2 font-semibold"><Clock className="size-4" /> {me.developerProfile.status === "pending" ? "Your company is being vetted" : "Your application wasn't approved"}</p>
          <p className="mt-1">
            {me.developerProfile.status === "pending"
              ? "You can draft and submit offerings now. They go live once we've approved your company and reviewed the offering."
              : me.developerProfile.reviewNote || "Contact hello@found.ng for details."}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Offerings" value={all.length} hint={`${count("live")} open now`} icon={Landmark} />
        <StatCard label="Raised" value={formatCompactPrice(raised)} hint="Confirmed payments" tone="emerald" />
        <StatCard label="Investors" value={investors.toLocaleString()} hint="Across all offerings" tone="coral" />
        <StatCard label="Awaiting review" value={count("in_review")} hint={isAdmin ? "Check documents and numbers" : "Usually 3 working days"} tone="amber" icon={Clock} />
      </div>

      <div className="mt-8">
        <Tabs
          active={tab}
          tabs={[
            { key: "all", label: "All", count: all.length },
            { key: "in_review", label: "In review", count: count("in_review") },
            { key: "drafts", label: "Drafts", count: count("drafts") },
            { key: "live", label: "Open / funded", count: count("live") },
            { key: "active", label: "Active / exited", count: count("active") },
            { key: "cancelled", label: "Cancelled", count: count("cancelled") },
          ].map((t) => ({ ...t, href: `/dashboard/offerings?status=${t.key}` }))}
        />
      </div>

      {list.length ? (
        <div className="mt-5 space-y-3">
          {list.map((o) => {
            const dev = typeof o.developer === "string" ? null : o.developer;
            return (
              <Link key={o._id} href={`/dashboard/offerings/${o._id}`} className="card flex flex-col gap-4 p-4 transition hover:border-brand-200 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <SmartImage src={o.images?.[0]} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-semibold text-ink">{o.featured ? <Star className="size-3.5 fill-amber-400 text-amber-400" /> : null}{o.title}</p>
                    <p className="text-xs text-slate-500">
                      {isAdmin ? `${dev?.developerProfile?.company || dev?.name} · ` : ""}
                      {formatCompactPrice(o.totalUnits * o.unitPrice)} · {o.totalUnits.toLocaleString()} units · updated {formatDate(o.updatedAt)}
                    </p>
                    <span className={clsx("chip mt-1.5", OFFERING_STATUS[o.status].tone)}>{OFFERING_STATUS[o.status].label}</span>
                  </div>
                </div>
                <div className="sm:w-72">
                  <FundingBar o={o} size="sm" />
                  <p className="mt-1 text-right text-xs text-slate-500">{o.investorCount} investors</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={Landmark}
            title={tab === "all" ? "No offerings yet" : "Nothing here"}
            text={tab === "all" ? "Create an offering for a property: the raise, targets, SPV and documents. Save it as a draft and submit when it's ready." : undefined}
            action={tab === "all" ? <Link href="/dashboard/offerings/new" className="btn-primary"><PlusCircle className="size-4" /> New offering</Link> : undefined}
          />
        </div>
      )}
    </>
  );
}
