import Link from "next/link";
import clsx from "clsx";
import { Building2, CalendarCheck, FileSignature, KeyRound, Mail, MapPin, Phone, Search } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getHosts } from "@/lib/bookings-data";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";
import { HostReview } from "@/components/dashboard/host-review";
import { formatDate, formatPrice, stateLabel } from "@/lib/format";
import { DEFAULT_COMMISSION } from "@/lib/stay";

export const metadata = { title: "Hosts" };

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
};
const ID_LABEL: Record<string, string> = { nin: "NIN", drivers_licence: "Driver's licence", passport: "Passport", voters_card: "Voter's card", cac: "CAC certificate" };

export default async function HostsPage({ searchParams }: PageProps<"/dashboard/hosts">) {
  await requireUser(["admin"]);
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "pending";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const { hosts, counts } = await getHosts({ status, q });
  const tabs = [
    { key: "pending", label: "To vet", count: counts.pending },
    { key: "unsigned", label: "Awaiting signature", count: counts.unsigned },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "all", label: "All", count: counts.all },
  ].map((t) => ({ ...t, href: `/dashboard/hosts?status=${t.key}` }));

  return (
    <>
      <PageHeader title="Hosts" description="Vet Found Apartments hosts, set their commission and track agreements." />
      <Tabs tabs={tabs} active={status} />
      <form className="mb-5 mt-4 flex gap-2" action="/dashboard/hosts">
        <input type="hidden" name="status" value={status} />
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} className="field !pl-9" placeholder="Search name, business, phone or city" />
        </label>
        <button className="btn-outline">Search</button>
      </form>

      {hosts.length ? (
        <div className="space-y-4">
          {hosts.map((h) => {
            const hp = h.hostProfile ?? {};
            const ag = hp.agreement ?? {};
            const total = Object.values(h.listings).reduce((a, b) => a + b, 0);
            return (
              <article key={h._id} className="card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-ink">{h.name}</h2>
                      {hp.businessName ? <span className="text-sm text-slate-500">· {hp.businessName}</span> : null}
                      <span className={clsx("chip capitalize", STATUS_TONE[hp.status ?? "pending"])}>{hp.status === "pending" ? "To vet" : hp.status}</span>
                      {ag.status === "accepted" ? (
                        <span className="chip bg-brand-50 text-brand-700 ring-brand-600/20"><FileSignature className="size-3" /> Signed {ag.commissionRate}%</span>
                      ) : ag.status === "sent" ? (
                        <span className="chip bg-slate-100 text-slate-600 ring-slate-500/20">Agreement sent</span>
                      ) : null}
                      {h.isSuspended ? <span className="chip bg-rose-50 text-rose-700 ring-rose-600/20">Suspended</span> : null}
                    </div>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <a href={`tel:${h.phone}`} className="flex items-center gap-1 hover:text-ink"><Phone className="size-3.5" /> {h.phone}</a>
                      <a href={`mailto:${h.email}`} className="flex items-center gap-1 hover:text-ink"><Mail className="size-3.5" /> {h.email}</a>
                      <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {hp.city}, {stateLabel(hp.state)}</span>
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                      <Fact label="Apartments declared" value={String(hp.units ?? "—")} />
                      <Fact label="Experience" value={hp.experience || "—"} />
                      <Fact label="ID to provide" value={ID_LABEL[hp.idType ?? ""] ?? "—"} />
                      <Fact label="Applied" value={formatDate(h.createdAt)} />
                    </dl>
                    {hp.address ? <p className="mt-2 text-sm text-slate-600"><span className="text-slate-500">Address:</span> {hp.address}</p> : null}
                    {hp.about ? <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{hp.about}</p> : null}
                    {hp.reviewNote ? <p className="mt-2 text-xs text-slate-500">Review note: {hp.reviewNote}</p> : null}
                  </div>
                  <div className="shrink-0 space-y-3 lg:w-80">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <Link href={`/dashboard/listings?owner=${h._id}`} className="rounded-xl bg-slate-50 p-2 hover:bg-slate-100">
                        <Building2 className="mx-auto size-4 text-slate-400" />
                        <span className="mt-1 block text-base font-bold text-ink">{total}</span>
                        {h.listings.pending ? `${h.listings.pending} pending` : `${h.listings.available ?? 0} live`}
                      </Link>
                      <div className="rounded-xl bg-slate-50 p-2">
                        <CalendarCheck className="mx-auto size-4 text-slate-400" />
                        <span className="mt-1 block text-base font-bold text-ink">{h.bookings}</span>
                        bookings
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2">
                        <KeyRound className="mx-auto size-4 text-slate-400" />
                        <span className="mt-1 block text-base font-bold text-ink">{formatPrice(h.payoutDue)}</span>
                        payout due
                      </div>
                    </div>
                    <HostReview id={h._id} status={hp.status} rate={hp.commissionRate ?? DEFAULT_COMMISSION} />
                    <Link href={`/dashboard/agreement?host=${h._id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                      <FileSignature className="size-3.5" /> View agreement
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={KeyRound} title="No hosts here" text={status === "pending" ? "New host applications will appear here for vetting." : "Nothing matches this filter."} />
      )}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium capitalize text-ink">{value}</dd>
    </div>
  );
}
