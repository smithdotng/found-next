import { redirect } from "next/navigation";
import clsx from "clsx";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { User } from "@/lib/models";
import { PageHeader } from "@/components/dashboard/ui";
import { AgreementSign, PrintButton } from "@/components/dashboard/agreement-sign";
import { AGREEMENT_VERSION, agreementSections } from "@/lib/agreement";
import { formatDate } from "@/lib/format";
import { DEFAULT_COMMISSION, PAYOUT_DAYS } from "@/lib/stay";
import type { HostProfile } from "@/lib/types";

export const metadata = { title: "Listing agreement" };

export default async function AgreementPage({ searchParams }: PageProps<"/dashboard/agreement">) {
  const session = await requireUser(["host", "admin"]);
  const sp = await searchParams;
  // Admins can view any host's agreement with ?host=<id>
  const hostId = session.userType === "admin" && typeof sp.host === "string" ? sp.host : session.userId;
  if (session.userType === "admin" && hostId === session.userId) redirect("/dashboard/hosts");
  await connectDB();
  const user = toPlain<{ name: string; email: string; hostProfile?: HostProfile } | null>(await User.findById(hostId).select("name email hostProfile").lean());
  if (!user) redirect("/dashboard");
  const hp = user.hostProfile ?? {};
  const ag = hp.agreement ?? {};
  const signed = ag.status === "accepted";
  const outdated = signed && ag.version !== AGREEMENT_VERSION;
  const rate = signed ? ag.commissionRate ?? hp.commissionRate ?? DEFAULT_COMMISSION : hp.commissionRate ?? DEFAULT_COMMISSION;
  const canSign = session.userType === "host" && hp.status === "approved" && (!signed || outdated);
  const sections = agreementSections({ rate, hostName: user.name, businessName: hp.businessName });

  const banner = outdated
    ? { icon: Clock, tone: "bg-amber-50 text-amber-900 ring-amber-600/20", text: `We've updated the agreement: guests now pay Found, and Found sends you your payout after check-in. You signed version ${ag.version}; please review and sign version ${AGREEMENT_VERSION}.` }
    : signed
    ? { icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-800 ring-emerald-600/20", text: `Signed by ${ag.signedName} on ${formatDate(ag.acceptedAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}` }
    : hp.status === "approved"
      ? { icon: Clock, tone: "bg-brand-50 text-brand-800 ring-brand-600/20", text: "Ready for your signature. Your apartments go live once you've signed and they're approved." }
      : hp.status === "rejected"
        ? { icon: XCircle, tone: "bg-rose-50 text-rose-800 ring-rose-600/20", text: "Your host account wasn't approved, so this agreement can't be signed." }
        : { icon: Clock, tone: "bg-amber-50 text-amber-900 ring-amber-600/20", text: "You can review the agreement now. It can be signed once the Found team has vetted your account." };

  return (
    <>
      <PageHeader title="Listing agreement" description={session.userType === "admin" ? `${user.name} · ${user.email}` : "The terms between you and Found for listing on Found Apartments."} actions={<PrintButton />} />
      <div className={clsx("mb-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ring-inset print:hidden", banner.tone)}>
        <banner.icon className="mt-0.5 size-5 shrink-0" /> {banner.text}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <article className="card p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Found Apartments · Version {signed && !outdated ? ag.version : AGREEMENT_VERSION}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">Host Listing Agreement</h2>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm">
            <p><span className="text-slate-500">Host:</span> <strong>{user.name}</strong>{hp.businessName ? ` (${hp.businessName})` : ""}</p>
            <p className="mt-1"><span className="text-slate-500">Found&apos;s commission:</span> <strong>{rate}% of the accommodation total per booking</strong></p>
            <p className="mt-1"><span className="text-slate-500">Payments:</span> <strong>guests pay Found; Found pays you the accommodation total less commission, within {PAYOUT_DAYS} working days of check-in</strong></p>
            {hp.bankDetails?.accountNumber ? <p className="mt-1"><span className="text-slate-500">Payout account:</span> <strong>{hp.bankDetails.bankName} · {hp.bankDetails.accountNumber} · {hp.bankDetails.accountName}</strong></p> : null}
          </div>
          <div className="mt-8 space-y-6">
            {sections.map((s) => (
              <section key={s.title}>
                <h3 className="font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[15px] leading-7 text-slate-700">{s.body}</p>
              </section>
            ))}
          </div>
          {signed && !outdated ? (
            <div className="mt-10 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Signed by the Host</p>
                <p className="mt-1 font-serif text-2xl italic text-ink">{ag.signedName}</p>
                <p className="text-xs text-slate-500">{formatDate(ag.acceptedAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}{ag.signedIp ? ` · IP ${ag.signedIp}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">For Found Projects &amp; Realty Limited</p>
                <p className="mt-1 font-semibold text-ink">Found Apartments</p>
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
              <AgreementSign name={session.userName} rate={rate} bank={hp.bankDetails} />
            </div>
          ) : (
            <div className="card p-5 text-sm text-slate-600 print:hidden">
              <p className="font-semibold text-ink">Questions about the agreement?</p>
              <p className="mt-1">Email hello@found.ng or call 0909 235 7149 before signing.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
