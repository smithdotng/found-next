import { CalendarCheck, Search } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getCommissionSummary, getManagedBookings } from "@/lib/bookings-data";
import { EmptyState, PageHeader, StatCard, Tabs } from "@/components/dashboard/ui";
import { BookingsBoard } from "@/components/dashboard/bookings-board";
import { Pagination } from "@/components/ui/pagination";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Bookings" };

const TAB_LABELS: Record<string, string> = { requests: "Requests", upcoming: "Upcoming", current: "In-house", past: "Completed", closed: "Declined / cancelled", all: "All" };
const EMPTY: Record<string, string> = {
  requests: "No booking requests waiting. New requests show up here and in your email.",
  upcoming: "No confirmed stays coming up.",
  current: "Nobody is checked in right now.",
  past: "Completed stays will appear here.",
  closed: "Nothing declined or cancelled.",
  all: "No bookings yet.",
};

export default async function BookingsPage({ searchParams }: PageProps<"/dashboard/bookings">) {
  const session = await requireUser(["host", "realtor", "admin"]);
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const f = { tab: pick("tab") ?? "requests", q: pick("q"), property: pick("property"), commission: pick("commission"), payout: pick("payout"), payment: pick("payment"), page: pick("page") };
  const isAdmin = session.userType === "admin";
  const [data, summary] = await Promise.all([getManagedBookings(session, f), getCommissionSummary(session)]);
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...f, page: undefined, open: undefined, ...patch })) if (v) q.set(k, v);
    return `/dashboard/bookings?${q}`;
  };
  const tabs = Object.keys(TAB_LABELS).map((k) => ({ key: k, label: TAB_LABELS[k], count: data.counts[k as keyof typeof data.counts], href: href({ tab: k }) }));

  return (
    <>
      <PageHeader
        title={isAdmin ? "Found Apartments bookings" : "Bookings"}
        description={isAdmin ? "Every booking across hosts: guest payments to Found, commission and payouts to hosts." : "Answer requests quickly. Guests pay Found, and Found remits your payout after check-in."}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Booked value" value={formatPrice(summary.bookedValue)} hint={`${summary.bookedCount} stays · ${summary.bookedNights} nights`} icon={CalendarCheck} />
        <StatCard label="Awaiting guest payment" value={formatPrice(summary.awaitingPayment)} hint={`${summary.awaitingCount} accepted stay${summary.awaitingCount === 1 ? "" : "s"} · paid to Found`} tone="amber" href={href({ tab: "all", payment: "awaiting" })} />
        <StatCard label={isAdmin ? "Payouts due to hosts" : "Payouts due to you"} value={formatPrice(summary.payoutDue)} hint={`${summary.payoutDueCount} stay${summary.payoutDueCount === 1 ? "" : "s"} · after check-in`} tone="coral" href={href({ tab: "all", payout: "due" })} />
        {isAdmin ? (
          <StatCard label="Commission kept" value={formatPrice(summary.paid)} hint={`VAT collected ${formatPrice(summary.vatCollected)}`} tone="emerald" href={href({ tab: "all", commission: "paid" })} />
        ) : (
          <StatCard label="Paid to you" value={formatPrice(summary.payoutPaid)} hint={summary.payoutUpcoming ? `${formatPrice(summary.payoutUpcoming)} more after upcoming check-ins` : "Payouts sent by Found"} tone="emerald" href={href({ tab: "all", payout: "paid" })} />
        )}
      </div>

      <Tabs tabs={tabs} active={f.tab} />
      <form className="mb-4 mt-4 flex gap-2" action="/dashboard/bookings">
        <input type="hidden" name="tab" value={f.tab} />
        {f.property ? <input type="hidden" name="property" value={f.property} /> : null}
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={f.q} className="field !pl-9" placeholder="Search guest, phone, reference or apartment" />
        </label>
        <button className="btn-outline">Search</button>
      </form>
      {f.commission ? <p className="mb-3 text-sm text-slate-600">Showing bookings with commission <strong>{f.commission}</strong>. <a href={href({ commission: undefined })} className="text-brand-600 hover:underline">Clear</a></p> : null}
      {f.payout ? <p className="mb-3 text-sm text-slate-600">Showing bookings with payout <strong>{f.payout.replace("_", " ")}</strong>. <a href={href({ payout: undefined })} className="text-brand-600 hover:underline">Clear</a></p> : null}
      {f.payment ? <p className="mb-3 text-sm text-slate-600">Showing accepted stays awaiting the guest&apos;s payment to Found. <a href={href({ payment: undefined })} className="text-brand-600 hover:underline">Clear</a></p> : null}

      {data.items.length ? (
        <>
          <BookingsBoard items={data.items} isAdmin={isAdmin} initialOpen={pick("open")} />
          <div className="mt-6">
            <Pagination page={data.page} totalPages={data.totalPages} basePath="/dashboard/bookings" params={{ ...f }} />
          </div>
        </>
      ) : (
        <EmptyState icon={CalendarCheck} title={`No ${TAB_LABELS[f.tab]?.toLowerCase() ?? "bookings"}`} text={EMPTY[f.tab] ?? EMPTY.all} />
      )}
    </>
  );
}
