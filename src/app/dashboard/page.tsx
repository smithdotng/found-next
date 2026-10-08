import Link from "next/link";
import {
  KeyRound, Building2, Clock, Eye, Inbox, PlusCircle, TrendingUp, ClipboardCheck, Users, MousePointerClick, Wallet, Megaphone, AlertTriangle, ArrowRight, Landmark, Newspaper,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { getAdminOverview, getAgentOverview, getRealtorOverview } from "@/lib/dashboard";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/dashboard/ui";
import { HostHome } from "@/components/dashboard/host-home";
import { getApartmentsAdminSnapshot } from "@/lib/bookings-data";
import { SmartImage } from "@/components/ui/smart-image";
import { formatCompactPrice, formatPrice, primaryImage, timeAgo, typeLabel, PROPERTY_TYPES } from "@/lib/format";
import type { PropertyDoc } from "@/lib/types";

export const metadata = { title: "Overview" };

function greeting() {
  const h = Number(new Date().toLocaleString("en-NG", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardHome() {
  const session = await requireUser();
  const first = session.userName.split(" ")[0];
  if (session.userType === "admin") return <AdminHome name={first} />;
  if (session.userType === "agent") return <AgentHome name={first} userId={session.userId} />;
  if (session.userType === "host") return <HostHome name={first} userId={session.userId} greeting={greeting()} />;
  return <RealtorHome name={first} userId={session.userId} />;
}

async function RealtorHome({ name, userId }: { name: string; userId: string }) {
  const d = await getRealtorOverview(userId);
  const attention = d.recent.filter((p) => p.status === "rejected" || p.status === "pending");
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name}`}
        description="Here's how your listings are doing."
        actions={
          <Link href="/dashboard/listings/new" className="btn-primary">
            <PlusCircle className="size-4" /> Add listing
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live listings" value={d.counts.live} hint={`${d.counts.total} total`} icon={Building2} href="/dashboard/listings?status=available" />
        <StatCard label="Awaiting review" value={d.counts.pending} hint={d.counts.rejected ? `${d.counts.rejected} need changes` : "Usually within 24h"} icon={Clock} tone="amber" href="/dashboard/listings?status=pending" />
        <StatCard label="Total views" value={d.views.toLocaleString()} hint={`Portfolio ${formatCompactPrice(d.value)}`} icon={Eye} tone="emerald" />
        <StatCard label="Unread enquiries" value={d.unread} hint={`${d.totalLeads} enquiries all-time`} icon={Inbox} tone="coral" href="/dashboard/inquiries?filter=unread" />
      </div>

      {d.counts.total === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Building2}
            title="Add your first listing"
            text="It takes about five minutes. Add photos, price and location — we'll review it and put it live."
            action={<Link href="/dashboard/listings/new" className="btn-primary"><PlusCircle className="size-4" /> Add listing</Link>}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-ink">Top performing</h2>
              <Link href="/dashboard/listings?sort=views" className="text-sm font-medium text-brand-600 hover:underline">All listings</Link>
            </div>
            {d.topViewed.length ? (
              <ul className="divide-y divide-slate-100">
                {d.topViewed.map((p) => (
                  <li key={p._id} className="flex items-center gap-4 px-5 py-3">
                    <Thumb p={p} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/dashboard/listings/${p._id}/edit`} className="block truncate text-sm font-semibold text-ink hover:text-brand-600">{p.title}</Link>
                      <p className="text-xs text-slate-500">{formatPrice(p.price)}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p><span className="font-semibold text-ink">{p.views.toLocaleString()}</span> views</p>
                      <p><span className="font-semibold text-ink">{p.leads}</span> enquiries</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-slate-500">Once your listings are live you&apos;ll see views and enquiries here.</p>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-ink">Latest enquiries</h2>
              <Link href="/dashboard/inquiries" className="text-sm font-medium text-brand-600 hover:underline">Inbox</Link>
            </div>
            {d.inquiries.length ? (
              <ul className="divide-y divide-slate-100">
                {d.inquiries.map((q) => (
                  <li key={q._id}>
                    <Link href={`/dashboard/inquiries?open=${q._id}`} className="flex gap-3 px-5 py-3 hover:bg-slate-50">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${q.read ? "bg-transparent" : "bg-coral-500"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="flex justify-between gap-2 text-sm">
                          <span className={q.read ? "font-medium text-slate-700" : "font-semibold text-ink"}>{q.name}</span>
                          <span className="shrink-0 text-xs text-slate-400">{timeAgo(q.createdAt)}</span>
                        </p>
                        <p className="truncate text-xs text-slate-500">{q.propertyTitle}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">{q.message}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-slate-500">No enquiries yet. Share your listings to get the ball rolling.</p>
            )}
          </section>

          {attention.length ? (
            <section className="card xl:col-span-2">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <AlertTriangle className="size-4 text-amber-500" />
                <h2 className="font-semibold text-ink">Needs your attention</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {attention.map((p) => (
                  <li key={p._id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                    <Thumb p={p} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                      <p className="text-xs text-slate-500">
                        {p.status === "rejected" ? p.rejectionReason || "Changes requested by the Found team." : "Submitted " + timeAgo(p.createdAt) + " — we'll email you when it's live."}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                    <Link href={`/dashboard/listings/${p._id}/edit`} className="btn-outline btn-sm">Edit</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

async function AdminHome({ name }: { name: string }) {
  const d = await getAdminOverview();
  const max = Math.max(1, ...d.days.map((x) => x.count));
  const totalLive = Object.values(d.byType).reduce((a, b) => a + b, 0) || 1;
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name}`}
        description="Platform activity at a glance."
        actions={
          <>
            <Link href="/dashboard/approvals" className="btn-primary">
              <ClipboardCheck className="size-4" /> Review queue {d.listings.pending ? `(${d.listings.pending})` : ""}
            </Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live listings" value={d.listings.live.toLocaleString()} hint={`${d.listings.closed} sold / rented`} icon={Building2} href="/dashboard/listings?status=available" />
        <StatCard label="Awaiting approval" value={d.listings.pending} hint={d.listings.rejected ? `${d.listings.rejected} rejected` : undefined} icon={ClipboardCheck} tone="amber" href="/dashboard/approvals" />
        <StatCard label="Enquiries (30 days)" value={d.inquiries30} icon={Inbox} tone="coral" href="/dashboard/inquiries" />
        <StatCard label="Users" value={(d.users.realtors + d.users.agents).toLocaleString()} hint={`${d.users.realtors} realtors · ${d.users.agents} agents · +${d.users.new30} this month`} icon={Users} tone="emerald" href="/dashboard/users" />
      </div>
      <ApartmentsSnapshot />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Enquiries, last 14 days</h2>
            <TrendingUp className="size-4 text-slate-400" />
          </div>
          <div className="mt-6 flex h-40 items-end gap-1.5" role="img" aria-label="Daily enquiries for the last 14 days">
            {d.days.map((x) => (
              <div key={x.date} className="group relative flex flex-1 flex-col items-center justify-end">
                <span className="pointer-events-none absolute -top-6 hidden rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">{x.count}</span>
                <div className="w-full rounded-t-md bg-brand-500/85 transition group-hover:bg-brand-600" style={{ height: `${Math.max(3, (x.count / max) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>{new Date(d.days[0].date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-ink">Live inventory by type</h2>
          <ul className="mt-5 space-y-3">
            {PROPERTY_TYPES.map((t) => {
              const c = d.byType[t.value] ?? 0;
              return (
                <li key={t.value}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{t.plural}</span>
                    <span className="font-semibold text-ink">{c}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(c / totalLive) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Link href="/dashboard/projects" className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 hover:bg-slate-100"><Landmark className="size-4 text-brand-600" /> {d.projects} projects</Link>
            <Link href="/dashboard/blog" className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 hover:bg-slate-100"><Newspaper className="size-4 text-brand-600" /> {d.blogs} posts</Link>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-ink">Oldest in the review queue</h2>
            <Link href="/dashboard/approvals" className="text-sm font-medium text-brand-600 hover:underline">Open queue</Link>
          </div>
          {d.pending.length ? (
            <ul className="divide-y divide-slate-100">
              {d.pending.map((p) => (
                <li key={p._id} className="flex items-center gap-4 px-5 py-3">
                  <Thumb p={p} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                    <p className="text-xs text-slate-500">
                      {typeof p.owner === "object" ? p.owner.name : ""} · {typeLabel(p.propertyType)} · {timeAgo(p.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink">{formatCompactPrice(p.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-sm text-slate-500">All caught up — nothing waiting for review.</p>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-ink">Recent enquiries</h2>
            <Link href="/dashboard/inquiries" className="text-sm font-medium text-brand-600 hover:underline">All</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {d.recentInquiries.map((q) => (
              <li key={q._id} className="px-5 py-3">
                <p className="flex justify-between text-sm">
                  <span className="font-semibold text-ink">{q.name}</span>
                  <span className="text-xs text-slate-400">{timeAgo(q.createdAt)}</span>
                </p>
                <p className="truncate text-xs text-slate-500">{q.propertyTitle}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

async function AgentHome({ name, userId }: { name: string; userId: string }) {
  const d = await getAgentOverview(userId);
  const top = [...d.promotions].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name}`}
        description="Track your referral links and earnings."
        actions={<Link href="/dashboard/promote" className="btn-accent"><Megaphone className="size-4" /> Promote a property</Link>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active promotions" value={d.totals.count} icon={Megaphone} href="/dashboard/promotions" />
        <StatCard label="Link clicks" value={d.totals.clicks.toLocaleString()} icon={MousePointerClick} tone="emerald" />
        <StatCard label="Enquiries generated" value={d.totals.inquiries} icon={Inbox} tone="coral" />
        <StatCard label="Earnings" value={formatPrice(d.user?.agentProfile?.totalEarnings ?? d.totals.earnings)} hint={`${formatPrice(d.user?.agentProfile?.pendingWithdrawal ?? 0)} available`} icon={Wallet} tone="amber" href="/dashboard/earnings" />
      </div>
      <section className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-ink">Your best links</h2>
          <Link href="/dashboard/promotions" className="text-sm font-medium text-brand-600 hover:underline">All promotions</Link>
        </div>
        {top.length ? (
          <ul className="divide-y divide-slate-100">
            {top.map((p) =>
              p.property ? (
                <li key={p._id} className="flex items-center gap-4 px-5 py-3">
                  <Thumb p={p.property} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{p.property.title}</p>
                    <p className="truncate font-mono text-[11px] text-slate-500">{p.referralCode}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p><span className="font-semibold text-ink">{p.clicks}</span> clicks</p>
                    <p><span className="font-semibold text-ink">{p.inquiries}</span> enquiries</p>
                  </div>
                </li>
              ) : null,
            )}
          </ul>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={Megaphone}
              title="No promotions yet"
              text="Pick any live property, get your tracked link and QR code, and share it with your network."
              action={<Link href="/dashboard/promote" className="btn-primary">Find properties to promote <ArrowRight className="size-4" /></Link>}
            />
          </div>
        )}
      </section>
    </>
  );
}

function Thumb({ p }: { p: Pick<PropertyDoc, "images" | "title"> }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
      <SmartImage src={primaryImage(p)} alt="" fill sizes="48px" className="object-cover" />
    </div>
  );
}

async function ApartmentsSnapshot() {
  const s = await getApartmentsAdminSnapshot();
  return (
    <section className="card mt-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-ink"><KeyRound className="size-4 text-coral-500" /> Found Apartments</h2>
        <Link href="/apartments" target="_blank" className="text-sm font-medium text-brand-600 hover:underline">View site</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Mini href="/dashboard/hosts?status=pending" label="Hosts to vet" value={s.hostsPending} alert={s.hostsPending > 0} />
        <Mini href="/dashboard/hosts?status=unsigned" label="Awaiting signature" value={s.unsigned} />
        <Mini href="/dashboard/bookings?tab=requests" label="Open requests" value={s.requests} alert={s.requests > 0} />
        <Mini href="/dashboard/bookings?tab=upcoming" label="Upcoming stays" value={s.upcoming} />
        <Mini href="/dashboard/bookings?tab=all&payment=awaiting" label="Awaiting guest payment" value={s.awaitingPayment} alert={s.awaitingPayment > 0} />
        <Mini href="/dashboard/bookings?tab=all&payout=due" label="Payouts due to hosts" value={formatCompactPrice(s.payoutDue)} />
      </div>
    </section>
  );
}

function Mini({ href, label, value, alert }: { href: string; label: string; value: string | number; alert?: boolean }) {
  return (
    <Link href={href} className="rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100">
      <span className={`block text-xl font-bold ${alert ? "text-coral-600" : "text-ink"}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </Link>
  );
}
