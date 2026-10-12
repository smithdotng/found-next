import clsx from "clsx";
import { requireUser } from "@/lib/session";
import { getInvestorProfile, investedLast12Months } from "@/lib/fractional-data";
import { PageHeader } from "@/components/dashboard/ui";
import { KYC_STATUS, RETAIL_ANNUAL_LIMIT_PERCENT } from "@/lib/fractional";
import { formatPrice } from "@/lib/format";
import { InvestorProfileForm } from "@/components/fractional/investor-profile-form";

export const metadata = { title: "Investor profile" };

export default async function InvestorProfilePage({ searchParams }: PageProps<"/dashboard/investments/profile">) {
  const session = await requireUser();
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "";
  const [u, used] = await Promise.all([getInvestorProfile(session.userId), investedLast12Months(session.userId)]);
  const ip = u?.investorProfile ?? {};
  const kyc = ip.kycStatus ?? "none";
  const limit = ip.category === "retail" || !ip.category ? Math.floor(((ip.annualIncome ?? 0) * RETAIL_ANNUAL_LIMIT_PERCENT) / 100) : null;

  if (session.userType === "admin") {
    return <PageHeader title="Investor profile" description="Admin accounts can't invest. Use a personal account." />;
  }

  return (
    <>
      <PageHeader
        title="Investor profile"
        description="We verify every investor once, as Nigerian law requires. Your details are only seen by the Found compliance team."
        actions={<span className={clsx("chip", KYC_STATUS[kyc].tone)}>{KYC_STATUS[kyc].label}</span>}
      />
      {kyc === "rejected" && ip.kycNote ? <p className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{ip.kycNote}</p> : null}
      {limit !== null && ip.annualIncome ? (
        <p className="mb-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Retail limit: <strong className="text-ink">{formatPrice(limit)}</strong> in any 12 months. Used: {formatPrice(used)} · Available: <strong className="text-ink">{formatPrice(Math.max(0, limit - used))}</strong>
        </p>
      ) : null}
      <div className="card max-w-3xl p-6 sm:p-8">
        <InvestorProfileForm
          next={next}
          defaults={{
            category: ip.category ?? "retail",
            annualIncome: ip.annualIncome,
            occupation: ip.occupation,
            address: ip.address,
            city: ip.city,
            state: ip.state,
            idType: ip.idType,
            idDocumentName: ip.idDocument?.name,
            bankName: ip.bankDetails?.bankName,
            accountNumber: ip.bankDetails?.accountNumber,
            accountName: ip.bankDetails?.accountName ?? u?.name,
            riskAcknowledged: !!ip.riskAcknowledgedAt,
          }}
        />
      </div>
    </>
  );
}
