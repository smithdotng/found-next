import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Building2, CalendarCheck, CalendarDays, Check, Clock, FileSignature, Inbox, PlusCircle, ShieldCheck, Wallet } from "lucide-react";
import { getHostOverview, type ManagedBooking } from "@/lib/bookings-data";
import { PageHeader, StatCard } from "@/components/dashboard/ui";
import { SmartImage } from "@/components/ui/smart-image";
import { formatPrice, primaryImage, timeAgo } from "@/lib/format";
import { BOOKING_STATUS, stayDates } from "@/lib/stay";
import { AGREEMENT_VERSION } from "@/lib/agreement";

export async function HostHome({ name, userId, greeting }: { name: string; userId: string; greeting: string }) {
  const d = await getHostOverview(userId);
  const hp = d.hostProfile;
  const vetted = hp.status === "approved";
  const signedAny = hp.agreement?.status === "accepted";
  const signed = signedAny && hp.agreement?.version === AGREEMENT_VERSION;
  const steps = [
    { done: true, title: "Apply as a host", text: "Account created", href: undefined },
    {
      done: vetted,
      title: "Get vetted by Found",
      text: hp.status === "rejected" ? hp.reviewNote || "We couldn't approve your account. Contact hello@found.ng." : vetted ? "Approved" : "We're reviewing your details — we may call to arrange an inspection.",
      failed: hp.status === "rejected",
    },
    { done: signed, title: "Sign the listing agreement", text: signed ? `Signed at ${hp.agreement?.commissionRate ?? hp.commissionRate}% commission` : signedAny ? "Updated terms: guests now pay Found. Please sign again" : vetted ? "Ready for your signature" : "Available once you're vetted", href: vetted && !signed ? "/dashboard/agreement" : undefined },
    { done: d.listings.live > 0, title: "Get your first apartment live", text: d.listings.live ? `${d.listings.live} live` : d.listings.total ? `${d.listings.pending} awaiting review` : "Add your first apartment", href: d.listings.total ? "/dashboard/listings" : "/dashboard/listings/new" },
  ];
  const onboarding = !(vetted && signed && d.listings.live > 0);

  return (
    <>
      <PageHeader
        title={`${greeting}, ${name}`}
        description="Your Found Apartments hosting at a glance."
        actions={<Link href="/dashboard/listings/new" className="btn-primary"><PlusCircle className="size-4" /> Add apartment</Link>}
      />

      {onboarding ? (
        <section className="card mb-8 p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Getting you live</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-4">
            {steps.map((s, i) => {
              const body = (
                <div className={clsx("h-full rounded-2xl border p-4", s.done ? "border-emerald-200 bg-emerald-50/50" : s.failed ? "border-rose-200 bg-rose-50/50" : s.href ? "border-brand-300 bg-brand-50/50" : "border-slate-200")}>
                  <span className={clsx("grid size-7 place-items-center rounded-full text-xs font-bold", s.done ? "bg-emerald-600 text-white" : s.failed ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-500")}>
                    {s.done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink">{s.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{s.text}</p>
                  {s.href && !s.done ? <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-600">Continue <ArrowRight className="size-3" /></p> : null}
                </div>
              );
              return <li key={s.title}>{s.href ? <Link href={s.href}>{body}</Link> : body}</li>;
            })}
          </ol>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Booking requests" value={d.requests.length} hint="Respond within 24 hours" icon={Inbox} tone="coral" href="/dashboard/bookings?tab=requests" />
        <StatCard label="Upcoming stays" value={d.upcoming.length} hint="Confirmed & in-house" icon={CalendarCheck} tone="emerald" href="/dashboard/bookings?tab=upcoming" />
        <StatCard label="Booked value" value={formatPrice(d.summary.bookedValue)} hint={`${d.summary.bookedNights} nights · ${d.summary.bookedCount} stays`} icon={Wallet} />
        <StatCard
          label="Payouts due to you"
          value={formatPrice(d.summary.payoutDue)}
          hint={d.summary.payoutDueCount ? `${d.summary.payoutDueCount} stay${d.summary.payoutDueCount > 1 ? "s" : ""} · sent by Found after check-in` : d.summary.payoutPaid ? `${formatPrice(d.summary.payoutPaid)} paid so far` : "Nothing due yet"}
          icon={FileSignature}
          tone="amber"
          href="/dashboard/bookings?tab=all&payout=due"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <BookingList title="Waiting for your answer" empty="No open requests. New requests appear here and in your email." items={d.requests} href="/dashboard/bookings?tab=requests" showAge />
        <BookingList title="Upcoming arrivals" empty="No confirmed stays coming up yet." items={d.upcoming} href="/dashboard/bookings?tab=upcoming" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Shortcut href="/dashboard/calendar" icon={CalendarDays} title="Update your calendar" text="Close dates you're using yourself so guests can't request them." />
        <Shortcut href="/dashboard/listings" icon={Building2} title={`My apartments (${d.listings.total})`} text={`${d.listings.live} live · ${d.listings.pending} in review`} />
        <Shortcut href="/dashboard/agreement" icon={ShieldCheck} title="Listing agreement" text={signed ? `Signed · ${hp.agreement?.commissionRate ?? hp.commissionRate}% commission` : "Not signed yet"} />
      </div>
    </>
  );
}

function BookingList({ title, items, empty, href, showAge = false }: { title: string; items: ManagedBooking[]; empty: string; href: string; showAge?: boolean }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-ink">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
      </div>
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((b) => (
            <li key={b._id}>
              <Link href={`/dashboard/bookings?open=${b._id}&tab=${b.status === "pending" ? "requests" : "upcoming"}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <SmartImage src={b.property ? primaryImage(b.property) : undefined} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{b.guest.name} · {b.guest.numberOfGuests} guest{b.guest.numberOfGuests > 1 ? "s" : ""}</p>
                  <p className="truncate text-xs text-slate-500">{b.property?.title ?? b.propertyTitle}</p>
                  <p className="text-xs text-slate-600">{stayDates(b.dates.checkIn, b.dates.checkOut)} · {formatPrice(b.pricing.total)}</p>
                </div>
                {showAge ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-amber-700"><Clock className="size-3.5" /> {timeAgo(b.createdAt)}</span>
                ) : (
                  <span className={`chip shrink-0 ${BOOKING_STATUS[b.status]?.tone}`}>{BOOKING_STATUS[b.status]?.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-5 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

function Shortcut({ href, icon: Icon, title, text }: { href: string; icon: typeof Inbox; title: string; text: string }) {
  return (
    <Link href={href} className="card flex items-start gap-3 p-4 transition hover:border-brand-200 hover:shadow-lift">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-[18px]" /></span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-slate-500">{text}</span>
      </span>
    </Link>
  );
}
