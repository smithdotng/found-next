import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getOfferingForManage } from "@/lib/fractional-data";
import { PageHeader, StatCard } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { OfferingForm } from "@/components/fractional/offering-form";
import { DistributionForm, PromptAction, UpdateForm } from "@/components/fractional/forms";
import { FundingBar } from "@/components/fractional/offering-card";
import { closeRaise, markDistributionPaid, markExited, reviewOffering, setValuation, submitOffering, toggleFeatured } from "@/app/actions/fractional";
import { formatCompactPrice, formatDate, formatPrice } from "@/lib/format";
import { OFFERING_STATUS, ORDER_STATUS, developerProceeds, fundingProgress } from "@/lib/fractional";

export const metadata = { title: "Manage offering" };

export default async function ManageOfferingPage({ params }: PageProps<"/dashboard/offerings/[id]">) {
  const session = await requireUser(["developer", "admin"]);
  const isAdmin = session.userType === "admin";
  const { id } = await params;
  const data = await getOfferingForManage(id, session.userId, isAdmin);
  if (!data) notFound();
  const { offering: o, holders, orders, distributions } = data;
  const dev = typeof o.developer === "string" ? null : o.developer;
  const f = fundingProgress(o);
  const proceeds = developerProceeds(f.raised, o.fees.platform);
  const editable = isAdmin || o.status === "draft" || o.status === "changes_requested";
  const st = OFFERING_STATUS[o.status];
  const unitsHeld = holders.reduce((a, h) => a + h.units, 0);

  return (
    <>
      <Link href="/dashboard/offerings" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink"><ArrowLeft className="size-4" /> Offerings</Link>
      <PageHeader
        title={o.title}
        description={<>{isAdmin ? <>{dev?.developerProfile?.company || dev?.name} · {dev?.email} · </> : null}Created {formatDate(o.createdAt)}</>}
        actions={
          <>
            <span className={clsx("chip", st.tone)}>{st.label}</span>
            <Link href={`/fractional/${o.slug}`} target="_blank" className="btn-outline btn-sm"><ExternalLink className="size-3.5" /> {["draft", "in_review", "changes_requested"].includes(o.status) ? "Preview" : "View page"}</Link>
          </>
        }
      />

      {o.reviewNote && o.status === "changes_requested" ? (
        <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900"><strong>Changes requested:</strong> {o.reviewNote}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {["live", "funded", "active", "exited", "cancelled"].includes(o.status) ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Raised" value={formatCompactPrice(f.raised)} hint={`${f.soldPct}% of ${formatCompactPrice(f.target)}`} tone="emerald" />
              <StatCard label="Investors" value={holders.length} hint={`${unitsHeld.toLocaleString()} units held`} icon={Users} />
              <StatCard label="Reserved" value={o.unitsReserved.toLocaleString()} hint="Units awaiting payment" tone="amber" />
              <StatCard label="Net to project" value={formatCompactPrice(proceeds.net)} hint={`After ${o.fees.platform}% Found fee`} tone="slate" />
            </div>
          ) : null}

          <section className="card p-6 sm:p-8">
            {!editable ? (
              <p className="mb-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                This offering is {st.label.toLowerCase()}, so its details are locked. Post progress updates below, or contact Found to change anything.
              </p>
            ) : null}
            <OfferingForm offering={o} isAdmin={isAdmin} locked={!editable} />
          </section>

          {["live", "funded", "active", "exited"].includes(o.status) ? (
            <section className="card p-6">
              <h2 className="font-semibold text-ink">Post a progress update</h2>
              <p className="mb-4 text-sm text-slate-500">Updates appear on the offering page. Regular updates keep investors confident and the resale market healthy.</p>
              <UpdateForm offeringId={o._id} />
              {o.updates?.length ? (
                <ul className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-sm">
                  {[...o.updates].reverse().map((u) => (
                    <li key={u._id} className="py-2.5"><span className="font-medium text-ink">{u.title}</span> <span className="text-slate-500">· {formatDate(u.createdAt)}{u.progress != null ? ` · ${u.progress}%` : ""}</span></li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {holders.length ? (
            <section className="card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-ink">Investor register</h2>
                <p className="text-sm text-slate-500">Unit holders of {o.spv?.name || "the SPV"}. Keep the SPV&apos;s share register in line with this list.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="text-left text-xs text-slate-500"><tr><th className="px-5 py-2 font-medium">Investor</th><th className="px-5 py-2 text-right font-medium">Units</th><th className="px-5 py-2 text-right font-medium">Share</th><th className="px-5 py-2 text-right font-medium">Paid</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {holders.map((h) => (
                      <tr key={h._id}>
                        <td className="px-5 py-2.5"><span className="font-medium text-ink">{h.investor?.name}</span>{isAdmin ? <span className="block text-xs text-slate-500">{h.investor?.email}</span> : null}</td>
                        <td className="px-5 py-2.5 text-right">{h.units.toLocaleString()}</td>
                        <td className="px-5 py-2.5 text-right">{((h.units / o.totalUnits) * 100).toFixed(2)}%</td>
                        <td className="px-5 py-2.5 text-right">{formatPrice(h.costBasis)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {isAdmin && orders.length ? (
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-ink">Orders</h2>
                <Link href={`/dashboard/fractional-orders?q=${encodeURIComponent(o.title)}`} className="text-sm font-medium text-brand-600 hover:underline">Manage payments</Link>
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                {orders.slice(0, 15).map((r) => (
                  <li key={r._id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <span className="min-w-0 truncate"><span className="font-medium text-ink">{typeof r.investor === "string" ? "" : r.investor.name}</span> <span className="text-slate-500">· {r.reference} · {r.units} units{r.source === "resale" ? " (resale)" : ""}</span></span>
                    <span className={clsx("chip shrink-0", ORDER_STATUS[r.status].tone)}>{ORDER_STATUS[r.status].label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {isAdmin && ["funded", "active", "exited"].includes(o.status) ? (
            <section className="card p-6">
              <h2 className="font-semibold text-ink">Distributions</h2>
              <p className="mb-4 text-sm text-slate-500">Split between current unit holders pro rata. Investors are emailed their share.</p>
              <DistributionForm offeringId={o._id} managementFee={o.fees.management} units={unitsHeld} />
              {distributions.length ? (
                <ul className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                  {distributions.map((d) => {
                    const due = d.lines.filter((l) => l.status === "due").length;
                    return (
                      <li key={d._id} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-sm sm:flex-row sm:items-center">
                        <div className="flex-1">
                          <p className="font-medium text-ink">{formatPrice(d.net)} {d.kind === "exit" ? "sale proceeds" : d.kind === "rental" ? "rental income" : ""}{d.period ? ` · ${d.period}` : ""}</p>
                          <p className="text-xs text-slate-500">{formatDate(d.declaredAt)} · {d.lines.length} investors · {formatPrice(d.perUnit)} / unit{d.managementFee ? ` · fee ${formatPrice(d.managementFee)}` : ""}</p>
                        </div>
                        {due ? (
                          <PromptAction action={markDistributionPaid.bind(null, d._id)} prompt={`Bulk transfer reference for ${due} payouts`} placeholder="e.g. Zenith bulk ref" confirmLabel="Mark all paid">Mark {due} paid</PromptAction>
                        ) : (
                          <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-600/20">All paid</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-ink">Funding</h2>
            <FundingBar o={o} />
            <dl className="mt-4 space-y-1.5 text-sm">
              <Row k="Units sold" v={`${o.unitsSold.toLocaleString()} / ${o.totalUnits.toLocaleString()}`} />
              <Row k="Minimum raise" v={`${f.softCapUnits.toLocaleString()} units ${f.softCapMet ? "✓" : ""}`} />
              <Row k="Opens" v={o.opensAt ? formatDate(o.opensAt) : o.goLiveAt ? formatDate(o.goLiveAt) : "On approval"} />
              <Row k="Closes" v={o.closesAt ? formatDate(o.closesAt) : "When funded"} />
              {o.currentUnitValue ? <Row k="Latest valuation" v={`${formatPrice(o.currentUnitValue)} / unit`} /> : null}
            </dl>
          </div>

          <div className="card space-y-3 p-5">
            <h2 className="font-semibold text-ink">Actions</h2>
            {(o.status === "draft" || o.status === "changes_requested") ? (
              <>
                <ActionButton action={submitOffering.bind(null, o._id)} className="btn-primary w-full">Submit for review</ActionButton>
                <p className="text-xs text-slate-500">Needs a photo, at least two documents (information memorandum, title, valuation, SPV papers), the SPV name, a 200+ character description and an exit strategy.</p>
              </>
            ) : null}
            {o.status === "in_review" && !isAdmin ? <p className="text-sm text-slate-600">Found is reviewing this offering. We&apos;ll email you when it&apos;s live or if we need changes.</p> : null}
            {isAdmin && ["in_review", "changes_requested", "draft"].includes(o.status) ? (
              <>
                <PromptAction action={reviewOffering.bind(null, o._id, "live")} prompt="Note to the developer (optional)" className="btn w-full bg-emerald-600 text-white hover:bg-emerald-700" confirmLabel="Approve & go live">Approve & go live</PromptAction>
                <PromptAction action={reviewOffering.bind(null, o._id, "changes_requested")} prompt="What needs to change? (sent to the developer)" required className="btn-outline w-full" confirmLabel="Send back">Request changes</PromptAction>
              </>
            ) : null}
            {isAdmin && ["live", "funded"].includes(o.status) ? (
              <ActionButton
                action={closeRaise.bind(null, o._id)}
                confirm={f.softCapMet ? "Close the raise? Unpaid reservations will be cancelled and the offering becomes active." : "The minimum raise hasn't been met. Closing will CANCEL the raise and every paid investor must be refunded. Continue?"}
                className={clsx("w-full", f.softCapMet ? "btn-outline" : "btn-danger")}
              >
                {f.softCapMet ? "Close raise" : "Close raise (below minimum)"}
              </ActionButton>
            ) : null}
            {isAdmin && ["funded", "active", "exited"].includes(o.status) ? (
              <PromptAction action={setValuation.bind(null, o._id)} prompt="New independent valuation per unit (₦)" required placeholder={String(o.currentUnitValue || o.unitPrice)} className="btn-outline w-full" confirmLabel="Save valuation">Update valuation</PromptAction>
            ) : null}
            {isAdmin && o.status === "active" ? (
              <ActionButton action={markExited.bind(null, o._id)} confirm="Mark the property as sold? Resale listings will be closed." className="btn-outline w-full">Mark as exited (sold)</ActionButton>
            ) : null}
            {isAdmin ? (
              <ActionButton action={toggleFeatured.bind(null, o._id)} className="btn-ghost w-full">{o.featured ? "Unfeature" : "Feature on /fractional"}</ActionButton>
            ) : null}
          </div>

          {isAdmin && o.history?.length ? (
            <div className="card p-5">
              <h2 className="mb-2 font-semibold text-ink">History</h2>
              <ol className="space-y-1.5 text-xs text-slate-600">
                {[...o.history].reverse().map((h, i) => (
                  <li key={i}><span className="font-medium text-ink">{OFFERING_STATUS[h.status as keyof typeof OFFERING_STATUS]?.label ?? h.status}</span> · {formatDate(h.at)}{h.by ? ` · ${h.by}` : ""}{h.note ? ` — ${h.note}` : ""}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
