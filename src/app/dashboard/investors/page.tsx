import clsx from "clsx";
import { Building2, FileText, Mail, Phone, Search, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getInvestorsForReview } from "@/lib/fractional-data";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";
import { PromptAction } from "@/components/fractional/forms";
import { reviewDeveloper, reviewInvestor } from "@/app/actions/fractional";
import { formatDate, formatPrice, stateLabel } from "@/lib/format";
import { INVESTOR_CATEGORY, KYC_STATUS, type KycStatus } from "@/lib/fractional";

export const metadata = { title: "Investors & developers" };

const ID_LABEL: Record<string, string> = { nin: "NIN", drivers_licence: "Driver's licence", passport: "Passport", voters_card: "Voter's card" };
const DEV_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export default async function InvestorsPage({ searchParams }: PageProps<"/dashboard/investors">) {
  await requireUser(["admin"]);
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "pending";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const { investors, developers, counts } = await getInvestorsForReview({ status: tab === "developers" ? "pending" : tab, q });
  const pendingDevs = developers.filter((d) => d.developerProfile?.status === "pending").length;

  return (
    <>
      <PageHeader title="Investors & developers" description="Verify investor IDs before confirming their payments, and vet developers before their offerings go live." />
      <Tabs
        active={tab}
        tabs={[
          { key: "pending", label: "Investors to verify", count: counts.pending ?? 0 },
          { key: "approved", label: "Verified", count: counts.approved ?? 0 },
          { key: "rejected", label: "Needs attention", count: counts.rejected ?? 0 },
          { key: "developers", label: "Developers", count: pendingDevs || developers.length },
        ].map((t) => ({ ...t, href: `/dashboard/investors?tab=${t.key}` }))}
      />

      {tab !== "developers" ? (
        <>
          <form className="mb-5 mt-4 flex gap-2" action="/dashboard/investors">
            <input type="hidden" name="tab" value={tab} />
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} className="field !pl-9" placeholder="Name, email or phone" />
            </label>
            <button className="btn-outline">Search</button>
          </form>
          {investors.length ? (
            <div className="space-y-3">
              {investors.map((u) => {
                const ip = u.investorProfile ?? {};
                const kyc = (ip.kycStatus ?? "none") as KycStatus;
                return (
                  <article key={u._id} className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-ink">{u.name}</h2>
                        <span className={clsx("chip", KYC_STATUS[kyc].tone)}>{KYC_STATUS[kyc].label}</span>
                        <span className="chip bg-slate-100 text-slate-700 ring-slate-500/20">{INVESTOR_CATEGORY[ip.category ?? "retail"].label}</span>
                        {u.userType !== "investor" ? <span className="chip bg-brand-50 text-brand-700 ring-brand-600/20 capitalize">{u.userType} account</span> : null}
                      </div>
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <a href={`mailto:${u.email}`} className="flex items-center gap-1 hover:text-ink"><Mail className="size-3.5" /> {u.email}</a>
                        <a href={`tel:${u.phone}`} className="flex items-center gap-1 hover:text-ink"><Phone className="size-3.5" /> {u.phone}</a>
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                        <Fact k="Occupation" v={ip.occupation} />
                        <Fact k="Annual income" v={ip.annualIncome ? formatPrice(ip.annualIncome) : undefined} />
                        <Fact k="ID" v={ID_LABEL[ip.idType ?? ""]} />
                        <Fact k="Submitted" v={formatDate(ip.kycSubmittedAt)} />
                        <Fact k="Address" v={[ip.address, ip.city, stateLabel(ip.state)].filter(Boolean).join(", ")} />
                        <Fact k="Payout account" v={ip.bankDetails?.accountNumber ? `${ip.bankDetails.bankName} ${ip.bankDetails.accountNumber} (${ip.bankDetails.accountName})` : undefined} />
                        <Fact k="Invested" v={formatPrice(u.invested)} />
                      </dl>
                      {ip.kycNote ? <p className="mt-2 text-xs text-slate-500">Note: {ip.kycNote}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 lg:w-64">
                      {ip.idDocument?.key ? (
                        <a href={`/dashboard/investors/${u._id}/id-document`} target="_blank" className="btn-outline btn-sm"><FileText className="size-3.5" /> View ID document</a>
                      ) : null}
                      {kyc !== "approved" ? (
                        <PromptAction action={reviewInvestor.bind(null, u._id, "approved")} prompt="Note (optional)" className="btn bg-emerald-600 text-white hover:bg-emerald-700 btn-sm" confirmLabel="Verify">
                          <ShieldCheck className="size-3.5" /> Verify investor
                        </PromptAction>
                      ) : null}
                      {kyc !== "rejected" ? (
                        <PromptAction action={reviewInvestor.bind(null, u._id, "rejected")} prompt="What do they need to fix? (sent to them)" required className="btn-ghost btn-sm text-rose-600" confirmLabel="Send">
                          Ask for changes
                        </PromptAction>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={ShieldCheck} title="No investors here" text={tab === "pending" ? "New investor profiles appear here for ID checks." : undefined} />
          )}
        </>
      ) : developers.length ? (
        <div className="mt-5 space-y-3">
          {developers.map((d) => {
            const dp = d.developerProfile ?? {};
            return (
              <article key={d._id} className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ink">{dp.company || d.name}</h2>
                    <span className={clsx("chip capitalize", DEV_TONE[dp.status ?? "pending"])}>{dp.status === "pending" ? "To vet" : dp.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{d.name} · <a href={`mailto:${d.email}`} className="hover:text-ink">{d.email}</a> · <a href={`tel:${d.phone}`} className="hover:text-ink">{d.phone}</a></p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <Fact k="RC number" v={dp.rcNumber} />
                    <Fact k="Location" v={[dp.city, stateLabel(dp.state)].filter(Boolean).join(", ")} />
                    <Fact k="Projects completed" v={String(dp.projectsCompleted ?? 0)} />
                    <Fact k="Applied" v={formatDate(d.createdAt)} />
                  </dl>
                  {dp.website ? <a href={dp.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-brand-600 hover:underline">{dp.website}</a> : null}
                  {dp.about ? <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{dp.about}</p> : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2 lg:w-64">
                  {dp.status !== "approved" ? (
                    <PromptAction action={reviewDeveloper.bind(null, d._id, "approved")} prompt="Note (optional)" className="btn bg-emerald-600 text-white hover:bg-emerald-700 btn-sm" confirmLabel="Approve">
                      <Building2 className="size-3.5" /> Approve developer
                    </PromptAction>
                  ) : null}
                  {dp.status !== "rejected" ? (
                    <PromptAction action={reviewDeveloper.bind(null, d._id, "rejected")} prompt="Reason (sent to the developer)" required className="btn-ghost btn-sm text-rose-600" confirmLabel="Reject">Reject</PromptAction>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5"><EmptyState icon={Building2} title="No developers yet" text="Developer applications from /developer/register appear here." /></div>
      )}
    </>
  );
}

function Fact({ k, v }: { k: string; v?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="truncate font-medium text-ink" title={v}>{v || "—"}</dd>
    </div>
  );
}
