import Link from "next/link";
import clsx from "clsx";
import { CalendarDays, ChevronLeft, ChevronRight, PlusCircle, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getCalendarData } from "@/lib/bookings-data";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { BlockForm } from "@/components/dashboard/block-form";
import { removeBlock } from "@/app/actions/bookings";
import { formatDate } from "@/lib/format";
import { addDays, isoDay, stayDates, todayLagos } from "@/lib/stay";

export const metadata = { title: "Calendar" };

const REASONS: Record<string, string> = { owner_use: "Personal use", external_booking: "Booked elsewhere", maintenance: "Maintenance", holiday: "Holiday", other: "Blocked" };

export default async function CalendarPage({ searchParams }: PageProps<"/dashboard/calendar">) {
  const session = await requireUser(["host", "realtor", "admin"]);
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const data = await getCalendarData(session, pick("property"));
  const today = todayLagos();
  const offset = Math.max(0, Math.min(18, parseInt(pick("m") ?? "0") || 0));

  if (!data.selected) {
    return (
      <>
        <PageHeader title="Calendar" />
        <EmptyState icon={CalendarDays} title="No apartments yet" text="Add a shortlet apartment to manage its availability here." action={<Link href="/dashboard/listings/new" className="btn-primary"><PlusCircle className="size-4" /> Add apartment</Link>} />
      </>
    );
  }
  const sel = data.selected;

  // Night → what occupies it
  const nights = new Map<string, { kind: "confirmed" | "pending" | "blocked" | "past"; label: string; start: boolean }>();
  for (const b of data.bookings) {
    let d = new Date(b.dates.checkIn);
    const end = new Date(b.dates.checkOut);
    let first = true;
    const kind = b.status === "pending" ? "pending" : b.status === "checked_out" ? "past" : "confirmed";
    while (d < end) {
      const k = isoDay(d);
      if (!nights.has(k) || kind !== "pending") nights.set(k, { kind, label: b.guest.name.split(" ")[0], start: first });
      first = false;
      d = addDays(d, 1);
    }
  }
  for (const x of data.blocks) {
    let d = new Date(x.startDate);
    const end = new Date(x.endDate);
    let first = true;
    while (d < end) {
      nights.set(isoDay(d), { kind: "blocked", label: REASONS[x.reason ?? "other"] ?? "Blocked", start: first });
      first = false;
      d = addDays(d, 1);
    }
  }

  const months = [0, 1, 2].map((i) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset + i, 1)));
  const qs = (patch: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ property: sel._id, m: offset || undefined, ...patch })) if (v) q.set(k, String(v));
    return `/dashboard/calendar?${q}`;
  };
  const upcomingBlocks = data.blocks.filter((b) => new Date(b.endDate) > today);

  return (
    <>
      <PageHeader title="Calendar" description="See confirmed stays and requests, and close nights you don't want booked." />

      {data.apartments.length > 1 ? (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {data.apartments.map((a) => (
            <Link key={a._id} href={`/dashboard/calendar?property=${a._id}`} className={clsx("shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium", a._id === sel._id ? "border-ink bg-ink text-white" : "border-slate-200 text-slate-700 hover:border-slate-400")}>
              {a.title.length > 40 ? a.title.slice(0, 40) + "…" : a.title}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="truncate font-semibold text-ink">{sel.title}</h2>
            <div className="flex items-center gap-1">
              <Link href={qs({ m: Math.max(0, offset - 1) || undefined })} className={clsx("btn-ghost !px-2", offset === 0 && "pointer-events-none opacity-30")} aria-label="Earlier"><ChevronLeft className="size-4" /></Link>
              <Link href={qs({ m: offset + 1 })} className="btn-ghost !px-2" aria-label="Later"><ChevronRight className="size-4" /></Link>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
            <Legend className="bg-emerald-500" label="Confirmed stay" />
            <Legend className="bg-amber-300" label="Request (not held)" />
            <Legend className="bg-slate-400" label="Blocked" />
          </div>
          <div className="mt-5 grid gap-8 lg:grid-cols-3">
            {months.map((first) => {
              const pad = first.getUTCDay();
              const daysIn = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
              return (
                <div key={first.toISOString()}>
                  <p className="text-sm font-semibold text-ink">{first.toLocaleDateString("en-NG", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
                  <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-medium uppercase text-slate-400">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-0.5">
                    {Array.from({ length: pad }, (_, i) => <span key={`p${i}`} />)}
                    {Array.from({ length: daysIn }, (_, i) => {
                      const d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), i + 1));
                      const k = isoDay(d);
                      const n = nights.get(k);
                      const past = d < today;
                      return (
                        <div
                          key={k}
                          title={n ? `${n.label} (${n.kind})` : undefined}
                          className={clsx(
                            "flex h-11 flex-col items-start justify-between rounded-md p-1 text-[11px]",
                            n?.kind === "confirmed" && "bg-emerald-500 text-white",
                            n?.kind === "past" && "bg-emerald-200 text-emerald-900",
                            n?.kind === "pending" && "bg-amber-200 text-amber-900",
                            n?.kind === "blocked" && "bg-slate-300 text-slate-700",
                            !n && "bg-slate-50 text-slate-600",
                            past && "opacity-45",
                            k === isoDay(today) && "ring-2 ring-brand-500",
                          )}
                        >
                          <span className="font-semibold">{i + 1}</span>
                          {n?.start ? <span className="w-full truncate text-[9px] leading-tight">{n.label}</span> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-ink">Block dates</h2>
            <p className="mt-0.5 text-sm text-slate-500">Guests can&apos;t request blocked nights. Confirmed stays block dates automatically.</p>
            <div className="mt-4"><BlockForm propertyId={sel._id} today={isoDay(today)} /></div>
          </section>
          <section className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-ink">Blocked periods</h2>
            {upcomingBlocks.length ? (
              <ul className="divide-y divide-slate-100">
                {upcomingBlocks.map((b) => (
                  <li key={b._id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{stayDates(b.startDate, b.endDate)}</p>
                      <p className="truncate text-xs text-slate-500">{REASONS[b.reason ?? "other"]}{b.notes ? ` · ${b.notes}` : ""} · last night {formatDate(addDays(new Date(b.endDate), -1), { day: "numeric", month: "short" })}</p>
                    </div>
                    <ActionButton action={removeBlock.bind(null, b._id)} confirm="Reopen these dates for booking?" className="btn-ghost btn-sm text-rose-600" label="Remove block">
                      <Trash2 className="size-3.5" />
                    </ActionButton>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-slate-500">No upcoming blocks.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={clsx("size-3 rounded", className)} /> {label}</span>;
}
