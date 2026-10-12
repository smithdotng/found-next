import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import clsx from "clsx";
import {
  AlertTriangle, ArrowLeftRight, Building2, CalendarClock, ChevronRight, Clock, Eye, FileLock2, FileText, Landmark, MapPin, ShieldCheck, TrendingUp, Users, Wallet,
} from "lucide-react";
import { connectDB } from "@/lib/db";
import { FractionalOffering, FractionalHolding, FractionalOrder } from "@/lib/models";
import { getSession } from "@/lib/session";
import { pageMetadata, absoluteUrl } from "@/lib/seo";
import { formatDate, formatPrice, plainText, stateLabel } from "@/lib/format";
import { getOfferingBySlug, getOfferingResales } from "@/lib/fractional-data";
import {
  ASSET_LABEL, OFFERING_STATUS, PAYOUT_LABEL, PUBLIC_STATUSES, RISK_META, STAGE_LABEL, TRADABLE_STATUSES, FRACTIONAL_OPEN, daysLeft, fundingProgress, isOpen, opensLater, unitsAvailable,
} from "@/lib/fractional";
import { Gallery } from "@/components/property/gallery";
import { ShareBar } from "@/components/property/share-bar";
import { FundingBar } from "@/components/fractional/offering-card";
import { InvestWidget } from "@/components/fractional/invest-widget";
import { ReturnsCalculator } from "@/components/fractional/returns-calculator";
import { SmartImage } from "@/components/ui/smart-image";
import { PrelaunchBanner, RiskStatement } from "@/components/fractional/regulatory-notice";

export async function generateMetadata({ params }: PageProps<"/fractional/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const o = await getOfferingBySlug(slug);
  if (!o) return { title: "Offering not found" };
  return pageMetadata({
    title: `${o.title} | Found Fractional`,
    absoluteTitle: true,
    description: plainText(o.summary || o.description || "", 160),
    path: `/fractional/${o.slug}`,
    image: o.images?.[0],
    noIndex: !PUBLIC_STATUSES.includes(o.status),
  });
}

export default async function OfferingPage({ params }: PageProps<"/fractional/[slug]">) {
  const { slug } = await params;
  const [o, session] = await Promise.all([getOfferingBySlug(slug), getSession()]);
  if (!o) notFound();
  const dev = typeof o.developer === "string" ? null : o.developer;
  const isOwner = !!session.userId && (session.userType === "admin" || dev?._id === session.userId);
  // Drafts and offerings in review are only visible to their developer and Found.
  if (!PUBLIC_STATUSES.includes(o.status) && !isOwner) notFound();

  if (PUBLIC_STATUSES.includes(o.status)) {
    after(async () => {
      await connectDB();
      await FractionalOffering.updateOne({ _id: o._id }, { $inc: { views: 1 } });
    });
  }

  await connectDB();
  const [resales, investorCount, myHolding, myOpen] = await Promise.all([
    FRACTIONAL_OPEN && TRADABLE_STATUSES.includes(o.status) && o.resaleEnabled ? getOfferingResales(o._id) : Promise.resolve([]),
    FractionalHolding.countDocuments({ offering: o._id, units: { $gt: 0 } }),
    session.userId ? FractionalHolding.findOne({ offering: o._id, investor: session.userId }).select("units").lean<{ units: number }>() : null,
    session.userId
      ? FractionalOrder.find({ offering: o._id, investor: session.userId, status: { $in: ["pending_payment", "payment_submitted"] } }).select("units reference").lean<{ units: number; reference: string }[]>()
      : [],
  ]);
  const openUnits = myOpen.reduce((a, x) => a + x.units, 0);

  const open = isOpen(o);
  const f = fundingProgress(o);
  const left = daysLeft(o.closesAt);
  const p = o.projections ?? {};
  const available = unitsAvailable(o);
  const maxForMe = Math.min(available, o.maxUnitsPerInvestor ? Math.max(0, o.maxUnitsPerInvestor - (myHolding?.units ?? 0) - openUnits) : available);
  const signedIn = !!session.userId;
  const st = OFFERING_STATUS[o.status];
  const notYetOpen = opensLater(o);

  const facts: [string, string][] = [
    ["Property type", ASSET_LABEL[o.assetType]],
    ["Stage", STAGE_LABEL[o.stage]],
    ["Raise", formatPrice(f.target)],
    ["Valuation", formatPrice(o.totalValue)],
    ["Total units", o.totalUnits.toLocaleString()],
    ["Minimum raise", `${o.softCapPercent}% (${f.softCapUnits.toLocaleString()} units)`],
    ...(p.holdMonths ? [["Investment term", `${p.holdMonths} months`] as [string, string]] : []),
    ...(p.completionDate ? [["Expected completion", formatDate(p.completionDate, { month: "long", year: "numeric" })] as [string, string]] : []),
    ["Payouts", PAYOUT_LABEL[p.payoutFrequency ?? "quarterly"]],
    ...(o.closesAt ? [["Raise closes", formatDate(o.closesAt)] as [string, string]] : []),
  ];

  return (
    <>
      {!PUBLIC_STATUSES.includes(o.status) ? (
        <div className="bg-amber-50 py-2.5 text-center text-sm text-amber-900">
          Preview — this offering is <strong>{st.label.toLowerCase()}</strong> and only visible to you{session.userType === "admin" ? " and the developer" : " and Found"}.{" "}
          <Link href={`/dashboard/offerings/${o._id}`} className="font-semibold underline">Manage</Link>
        </div>
      ) : null}
      <PrelaunchBanner />
      <div className="container-page py-6 sm:py-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-slate-500">
          <Link href="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="size-3" />
          <Link href="/fractional" className="hover:text-ink">Found Fractional</Link>
          <ChevronRight className="size-3" />
          <span className="truncate text-slate-700">{o.title}</span>
        </nav>

        <Gallery images={(o.images ?? []).map((url) => ({ url }))} title={o.title} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={clsx("chip", st.tone)}>{open ? "Open for investment" : notYetOpen ? `Opens ${formatDate(o.opensAt)}` : st.label}</span>
              <span className={clsx("chip", RISK_META[o.risk].tone)}>{RISK_META[o.risk].label}</span>
              {o.returnTypes?.includes("rental_income") ? <span className="chip bg-slate-100 text-slate-700 ring-slate-500/20">Rental income</span> : null}
              {o.returnTypes?.includes("capital_growth") ? <span className="chip bg-slate-100 text-slate-700 ring-slate-500/20">Capital growth</span> : null}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{o.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-slate-600">
              <MapPin className="size-4" /> {[o.location?.address, o.location?.city, stateLabel(o.location?.state)].filter(Boolean).join(", ")}
            </p>
            {o.summary ? <p className="mt-4 text-lg leading-8 text-slate-700">{o.summary}</p> : null}

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile icon={Wallet} label="Unit price" value={formatPrice(o.unitPrice)} />
              <Tile icon={TrendingUp} label="Target yield (not guaranteed)" value={p.rentalYield ? `${p.rentalYield}% p.a.` : "—"} />
              <Tile icon={Building2} label="Target growth (not guaranteed)" value={p.appreciation ? `${p.appreciation}% p.a.` : "—"} />
              <Tile icon={Users} label="Investors" value={investorCount.toLocaleString()} />
            </dl>

            <section className="mt-10">
              <h2 className="text-xl font-bold text-ink">About this property</h2>
              <div className="mt-3 space-y-4 text-[15px] leading-7 text-slate-700">
                {(o.description || "").split(/\n{2,}/).filter(Boolean).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
              </div>
              {o.videoUrl ? (
                <a href={o.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-4">Watch the video tour</a>
              ) : null}
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-bold text-ink">Key facts</h2>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {facts.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {o.returnTypes?.length ? (
              <section className="mt-10">
                <ReturnsCalculator
                  unitPrice={o.unitPrice}
                  minUnits={o.minUnits}
                  rentalYield={o.returnTypes.includes("rental_income") ? p.rentalYield : undefined}
                  appreciation={o.returnTypes.includes("capital_growth") ? p.appreciation : undefined}
                  holdMonths={p.holdMonths}
                  managementFee={o.fees?.management ?? 0}
                />
              </section>
            ) : null}

            <section className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Landmark className="size-4 text-brand-600" /> Ownership structure</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <Kv k="Held by (SPV)" v={o.spv?.name} />
                  <Kv k="SPV RC number" v={o.spv?.rcNumber} />
                  <Kv k="Trustee / custodian" v={o.spv?.trustee} />
                  <Kv k="Title" v={o.spv?.titleDocument} />
                </dl>
                <p className="mt-3 text-xs leading-5 text-slate-500">Your units are shares in this company, recorded in your name. The company owns the property and nothing else.</p>
              </div>
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><Building2 className="size-4 text-brand-600" /> Developer</h3>
                <p className="mt-3 font-medium text-ink">{dev?.developerProfile?.company || dev?.name}</p>
                <dl className="mt-2 space-y-2 text-sm">
                  <Kv k="Projects completed" v={dev?.developerProfile?.projectsCompleted ? String(dev.developerProfile.projectsCompleted) : undefined} />
                  <Kv k="Reviewed by Found" v={dev?.developerProfile?.status === "approved" ? "Yes (not an endorsement)" : undefined} />
                </dl>
                {dev?.developerProfile?.website ? (
                  <a href={dev.developerProfile.website} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">Website</a>
                ) : null}
              </div>
            </section>

            {p.exitStrategy ? (
              <section className="mt-10">
                <h2 className="text-xl font-bold text-ink">How investors exit</h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-700">{p.exitStrategy}</p>
              </section>
            ) : null}

            <section className="mt-10">
              <h2 className="text-xl font-bold text-ink">Fees</h2>
              <ul className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <li className="rounded-xl bg-slate-50 p-4"><strong className="block text-lg text-ink">{o.fees.investor}%</strong> service fee, added when you buy units from the developer</li>
                <li className="rounded-xl bg-slate-50 p-4"><strong className="block text-lg text-ink">{o.fees.management}%</strong> of rental income, for managing the property and payouts</li>
                <li className="rounded-xl bg-slate-50 p-4"><strong className="block text-lg text-ink">{o.fees.resale}%</strong> of the price if you transfer units to another investor</li>
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-bold text-ink">Documents</h2>
              {o.documents?.length ? (
                <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                  {o.documents.map((d) => (
                    <li key={d._id} className="flex items-center gap-3 px-4 py-3">
                      {signedIn ? <FileText className="size-5 text-brand-600" /> : <FileLock2 className="size-5 text-slate-400" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{d.label || "Document"}</p>
                        <p className="truncate text-xs text-slate-500">{d.name}</p>
                      </div>
                      {signedIn ? (
                        <a href={`/fractional/${o.slug}/doc/${d._id}`} target="_blank" className="btn-outline btn-sm">Open</a>
                      ) : (
                        <Link href={`/login?next=/fractional/${o.slug}`} className="text-sm font-medium text-brand-600 hover:underline">Sign in to view</Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Documents will be published before the offering opens.</p>
              )}
            </section>

            <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <h2 className="flex items-center gap-2 font-bold text-amber-900"><AlertTriangle className="size-5" /> Risks</h2>
              <div className="mt-2 space-y-2 text-sm leading-6 text-amber-950/80">
                {o.riskNotes ? <p className="whitespace-pre-line">{o.riskNotes}</p> : null}
                <p>
                  You could lose some or all of the money you invest. The value of the property and your units can fall as well as rise. Construction can be delayed or cost more than planned,
                  rent and distributions are not guaranteed, and you may not be able to sell your units at all or at the price you want. Only invest money you can afford to lose and leave in for the full term.
                </p>
              </div>
            </section>

            {o.updates?.length ? (
              <section id="updates" className="mt-10 scroll-mt-20">
                <h2 className="text-xl font-bold text-ink">Progress updates</h2>
                <ol className="mt-4 space-y-5 border-l-2 border-slate-200 pl-5">
                  {[...o.updates].reverse().map((u) => (
                    <li key={u._id} className="relative">
                      <span className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-white bg-brand-600" />
                      <p className="text-xs text-slate-500">{formatDate(u.createdAt)}{u.progress !== undefined && u.progress !== null ? ` · ${u.progress}% complete` : ""}</p>
                      <h3 className="mt-0.5 font-semibold text-ink">{u.title}</h3>
                      {u.body ? <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{u.body}</p> : null}
                      {u.image ? (
                        <div className="relative mt-3 aspect-video max-w-md overflow-hidden rounded-xl bg-slate-100">
                          <SmartImage src={u.image} alt={u.title} fill sizes="448px" className="object-cover" />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {resales.length ? (
              <section id="resale" className="mt-10 scroll-mt-20">
                <h2 className="flex items-center gap-2 text-xl font-bold text-ink"><ArrowLeftRight className="size-5" /> Units offered by investors</h2>
                <p className="mt-1 text-sm text-slate-500">Units existing investors have offered to transfer. Prices are set by sellers and may not reflect value.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {resales.map((r) => {
                    const avail = r.units - r.unitsSold - r.unitsReserved;
                    const diff = Math.round(((r.pricePerUnit - (o.currentUnitValue || o.unitPrice)) / (o.currentUnitValue || o.unitPrice)) * 100);
                    return (
                      <div key={r._id} className="card p-5">
                        <div className="mb-3 flex items-baseline justify-between">
                          <p className="text-lg font-bold text-ink">{formatPrice(r.pricePerUnit)} <span className="text-sm font-normal text-slate-500">/ unit</span></p>
                          <span className={clsx("text-xs font-semibold", diff > 0 ? "text-coral-600" : diff < 0 ? "text-emerald-700" : "text-slate-500")}>
                            {diff === 0 ? "At valuation" : `${Math.abs(diff)}% ${diff > 0 ? "above" : "below"} valuation`}
                          </span>
                        </div>
                        {r.seller === session.userId ? (
                          <p className="text-sm text-slate-500">Your listing · {avail} units. <Link href="/dashboard/investments/sell" className="text-brand-600 hover:underline">Manage</Link></p>
                        ) : (
                          <InvestWidget offeringId={o._id} slug={o.slug} unitPrice={r.pricePerUnit} maxUnits={avail} feePercent={0} signedIn={signedIn} resaleId={r._id} compact />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div id="invest" className="card scroll-mt-24 p-6">
              <FundingBar o={o} />
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Units left</p><p className="font-bold text-ink">{available.toLocaleString()} / {o.totalUnits.toLocaleString()}</p></div>
                <div>
                  <p className="text-slate-500">{open ? "Time left" : "Status"}</p>
                  <p className="font-bold text-ink">{open ? (left === null ? "Until fully funded" : left === 0 ? "Closes today" : `${left} days`) : st.label}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-5">
                {open ? (
                  isOwner && session.userType !== "admin" ? (
                    <p className="text-sm text-slate-500">This is your offering. <Link href={`/dashboard/offerings/${o._id}`} className="font-medium text-brand-600 hover:underline">Manage it</Link></p>
                  ) : session.userType === "admin" ? (
                    <p className="text-sm text-slate-500">Signed in as admin — investing is disabled.</p>
                  ) : (
                    <InvestWidget offeringId={o._id} slug={o.slug} unitPrice={o.unitPrice} minUnits={o.minUnits} maxUnits={maxForMe} feePercent={o.fees.investor} signedIn={signedIn} />
                  )
                ) : notYetOpen ? (
                  <p className="flex items-start gap-2 text-sm text-slate-600"><CalendarClock className="mt-0.5 size-4 shrink-0" /> Opens for investment on {formatDate(o.opensAt)}.</p>
                ) : TRADABLE_STATUSES.includes(o.status) ? (
                  <p className="text-sm text-slate-600">
                    This raise is closed.{" "}
                    {resales.length ? <a href="#resale" className="font-medium text-brand-600 hover:underline">{resales.length} investor transfer offer{resales.length > 1 ? "s" : ""}</a> : "No units are offered for transfer."}
                  </p>
                ) : (
                  <p className="flex items-start gap-2 text-sm text-slate-600"><Clock className="mt-0.5 size-4 shrink-0" /> Not open for investment.</p>
                )}
              </div>
              {myOpen.length ? (
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  You have {openUnits} units reserved.{" "}
                  <Link href={`/dashboard/investments/orders/${myOpen[0].reference}`} className="font-medium underline">Complete payment</Link>
                </p>
              ) : null}
              {myHolding?.units ? (
                <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">You own <strong>{myHolding.units}</strong> units. <Link href="/dashboard/investments" className="underline">Portfolio</Link></p>
              ) : null}
            </div>
            <ul className="mt-4 space-y-2 px-1 text-xs text-slate-500">
              <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-emerald-600" /> Subscription money is returned if the minimum raise isn&apos;t reached, per the offering terms</li>
              <li className="flex gap-2"><Landmark className="size-4 shrink-0 text-emerald-600" /> Units are shares in the property&apos;s own company</li>
              <li className="flex gap-2"><AlertTriangle className="size-4 shrink-0 text-amber-600" /> Your capital is at risk</li>
              <li className="flex gap-2"><Eye className="size-4 shrink-0 text-slate-400" /> {(o.views ?? 0).toLocaleString()} views</li>
            </ul>
            <RiskStatement className="mt-4 px-1" />
            <div className="mt-4">
              <ShareBar url={absoluteUrl(`/fractional/${o.slug}`)} title={o.title} text={`${o.title} on Found Fractional`} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function Tile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <dt className="flex items-center gap-1.5 text-xs text-slate-500"><Icon className="size-3.5" /> {label}</dt>
      <dd className="mt-1 text-lg font-bold text-ink">{value}</dd>
    </div>
  );
}

function Kv({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-ink">{v || "—"}</dd>
    </div>
  );
}
