import Link from "next/link";
import clsx from "clsx";
import { BadgeCheck, Clock, FileSignature } from "lucide-react";
import { getSession } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { User } from "@/lib/models";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import {
  agentAgreementSections,
  AGENT_AGREEMENT_VERSION,
  AGENT_COMMISSION_PCT,
  AGENT_ADMIN_FEE_PCT,
  AGENT_WHT_PCT,
  AGENT_PAYOUT_DAYS,
} from "@/lib/agreement";
import { AgentAgreementSign } from "@/components/agent/agent-agreement-sign";

export const metadata = pageMetadata({
  title: "Agent Referral Agreement",
  description: `The terms between Found and its referral agents: ${AGENT_COMMISSION_PCT}% of the agency fee on referred sales, tracked referrals, deductions and payout within one week.`,
  path: "/agent/agreement",
});

type AgentView = {
  name: string;
  agentProfile?: {
    isApproved?: boolean;
    businessName?: string;
    agreement?: { status?: string; version?: string; acceptedAt?: string; signedName?: string; signedIp?: string };
  };
} | null;

export default async function AgentAgreementPage() {
  const session = await getSession().catch(() => null);
  const isAgent = session?.userType === "agent";
  let viewer: AgentView = null;
  if (isAgent && session?.userId) {
    await connectDB();
    viewer = toPlain<AgentView>(
      await User.findById(session.userId).select("name agentProfile.isApproved agentProfile.businessName agentProfile.agreement").lean(),
    );
  }

  const ag = viewer?.agentProfile?.agreement ?? {};
  const signed = ag.status === "accepted";
  const outdated = signed && ag.version !== AGENT_AGREEMENT_VERSION;
  const approved = !!viewer?.agentProfile?.isApproved;
  const canSign = isAgent && approved && (!signed || outdated);
  const sections = agentAgreementSections({
    agentName: isAgent ? viewer?.name : undefined,
    businessName: viewer?.agentProfile?.businessName,
  });

  const banner = !isAgent
    ? null
    : outdated
      ? { icon: Clock, tone: "bg-amber-50 text-amber-900 ring-amber-600/20", text: `We've updated the agreement. You signed version ${ag.version}; please review and sign version ${AGENT_AGREEMENT_VERSION} to keep your account active.` }
      : signed
        ? { icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-800 ring-emerald-600/20", text: `Signed by ${ag.signedName} on ${formatDate(ag.acceptedAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}.` }
        : approved
          ? { icon: FileSignature, tone: "bg-brand-50 text-brand-800 ring-brand-600/20", text: "You've been verified. Sign the agreement to activate your account and start creating referral links." }
          : { icon: Clock, tone: "bg-amber-50 text-amber-900 ring-amber-600/20", text: "You can review the agreement now. It can be signed once the Found team has verified your account." };

  return (
    <div className="container-page py-10 lg:py-14">
      <p className="text-sm font-semibold text-coral-500">Found agent programme</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Agent Referral Agreement</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        The terms between Found Projects &amp; Realty Limited and its independent referral agents. Signing this agreement is the final step of agent verification.
      </p>

      {banner ? (
        <div className={clsx("mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ring-inset print:hidden", banner.tone)}>
          <banner.icon className="mt-0.5 size-5 shrink-0" /> {banner.text}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <article className="card p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Found · Agent programme · Version {signed && !outdated ? ag.version : AGENT_AGREEMENT_VERSION}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">Agent Referral Agreement</h2>
          <div className="mt-6 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <p><span className="text-slate-500">Your commission:</span> <strong>{AGENT_COMMISSION_PCT}% of the agency fee collected</strong></p>
            <p><span className="text-slate-500">Deducted from payout:</span> <strong>{AGENT_ADMIN_FEE_PCT}% admin fee + {AGENT_WHT_PCT}% withholding tax</strong></p>
            <p><span className="text-slate-500">You get paid:</span> <strong>within one week ({AGENT_PAYOUT_DAYS} days) of a concluded sale</strong></p>
            <p><span className="text-slate-500">Client funds:</span> <strong>never collected by the agent</strong></p>
          </div>
          <div className="mt-8 space-y-6">
            {sections.map((sxn) => (
              <section key={sxn.title}>
                <h3 className="font-semibold text-ink">{sxn.title}</h3>
                <p className="mt-1.5 text-[15px] leading-7 text-slate-700">{sxn.body}</p>
              </section>
            ))}
          </div>
          {signed && !outdated ? (
            <div className="mt-10 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Signed by the Agent</p>
                <p className="mt-1 font-serif text-2xl italic text-ink">{ag.signedName}</p>
                <p className="text-xs text-slate-500">{formatDate(ag.acceptedAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}{ag.signedIp ? ` · IP ${ag.signedIp}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">For Found Projects &amp; Realty Limited</p>
                <p className="mt-1 font-semibold text-ink">Found Projects &amp; Realty Limited</p>
                <p className="text-xs text-slate-500">Accepted electronically via found.ng</p>
              </div>
            </div>
          ) : null}
        </article>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          {canSign ? (
            <div className="card p-5">
              <h2 className="font-semibold text-ink">Sign electronically</h2>
              <p className="mb-4 mt-1 text-sm text-slate-500">Your typed name, the time and your IP address are recorded as your signature.</p>
              <AgentAgreementSign name={viewer!.name} />
            </div>
          ) : isAgent ? (
            <div className="card p-5 text-sm text-slate-600 print:hidden">
              <p className="font-semibold text-ink">Questions about the agreement?</p>
              <p className="mt-1">Email hello@found.ng or call 0909 235 7149 before signing.</p>
            </div>
          ) : (
            <div className="card p-5 print:hidden">
              <h2 className="font-semibold text-ink">Become a Found agent</h2>
              <p className="mt-1 text-sm text-slate-500">Register free, get verified, sign this agreement, then share tracked links and earn {AGENT_COMMISSION_PCT}% of the agency fee on every referred sale.</p>
              <Link href="/agent/register" className="btn-primary mt-4 w-full justify-center py-3">Register as an agent</Link>
              <p className="mt-3 text-xs text-slate-500">Questions? Email hello@found.ng or call 0909 235 7149.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
