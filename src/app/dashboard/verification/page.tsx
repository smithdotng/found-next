import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { BadgeCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Property, User, VerificationRequest } from "@/lib/models";
import { formatDate, formatPrice, locationLine } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { VERIFICATION_PLANS, isPropertyVerified, isRealtorVerified, type VerificationPlan } from "@/lib/verification";
import { PageHeader, EmptyState, Tabs } from "@/components/dashboard/ui";
import { PaymentAccount } from "@/components/site/payment-account";
import { ReviewButtons, VerificationRequestForm } from "@/components/dashboard/verification-forms";

export const metadata: Metadata = { title: "Verification" };

type Req = {
  _id: string;
  plan: VerificationPlan;
  amount: number;
  status: "pending" | "approved" | "rejected";
  payerName: string;
  paymentReference?: string;
  paidOn?: string;
  proofImage?: string;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
  properties: { _id: string; title: string; slug: string }[];
  user?: { _id: string; name: string; email: string; phone?: string; realtorProfile?: { company?: string } };
};

const STATUS = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

export default async function VerificationPage({ searchParams }: PageProps<"/dashboard/verification">) {
  const session = await requireUser(["realtor", "admin"]);
  const sp = await searchParams;
  await connectDB();
  return session.userType === "admin" ? <AdminView sp={sp} /> : <RealtorView userId={session.userId} sp={sp} />;
}

async function RealtorView({ userId, sp }: { userId: string; sp: Record<string, string | string[] | undefined> }) {
  const [user, listings, requests] = await Promise.all([
    User.findById(userId).select("realtorProfile").lean<{ realtorProfile?: { verified?: boolean; verifiedUntil?: Date } }>(),
    Property.find({ owner: userId, status: { $ne: "rejected" } }).select("title location status verification").sort("-createdAt").lean(),
    VerificationRequest.find({ user: userId }).sort("-createdAt").limit(20).populate("properties", "title slug").lean(),
  ]);
  const realtorVerified = isRealtorVerified(user?.realtorProfile);
  const until = user?.realtorProfile?.verifiedUntil;
  const reqs = toPlain<Req[]>(requests);
  const inReview = new Set(reqs.filter((r) => r.status === "pending").flatMap((r) => r.properties.map((p) => String(p._id))));
  const all = toPlain<{ _id: string; title: string; location: never; status: string; verification?: { verified?: boolean; until?: string } }[]>(listings);
  const unverified = all
    .filter((l) => !isPropertyVerified(l))
    .map((l) => ({ _id: l._id, title: l.title, location: locationLine(l.location), status: l.status, pending: inReview.has(String(l._id)) }));
  const verifiedCount = all.length - unverified.length;
  const annualPending = reqs.some((r) => r.plan === "annual" && r.status === "pending");
  const plan: VerificationPlan = sp.plan === "property" || sp.plan === "annual" ? sp.plan : realtorVerified ? "property" : "annual";
  const annualBlocked = realtorVerified
    ? `You're verified until ${formatDate(until)}.`
    : annualPending
      ? "Your realtor verification request is awaiting review."
      : undefined;

  return (
    <>
      <PageHeader
        title="Get verified"
        description="Earn the Verified by Found badge for your listings and build instant trust with clients."
        actions={<Link href="/get-verified" className="btn-ghost btn-sm">How verification works <ExternalLink className="size-3.5" /></Link>}
      />

      <div className={clsx("mb-6 flex items-start gap-4 rounded-2xl p-5", realtorVerified ? "bg-emerald-50 ring-1 ring-emerald-100" : "bg-white ring-1 ring-slate-200")}>
        <span className={clsx("grid size-11 shrink-0 place-items-center rounded-xl", realtorVerified ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500")}>
          {realtorVerified ? <BadgeCheck className="size-6" /> : <ShieldCheck className="size-6" />}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{realtorVerified ? "You're a verified realtor" : "You're not verified yet"}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {realtorVerified
              ? `All your listings carry the Verified by Found badge${until ? ` until ${formatDate(until)}` : ""}. New listings are verified automatically.`
              : `${verifiedCount} of ${all.length} listing${all.length === 1 ? "" : "s"} verified. Unverified listings stay live, just without the badge.`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <VerificationRequestForm listings={unverified} defaultPlan={plan} annualBlocked={annualBlocked} />
        <div className="space-y-4">
          <PaymentAccount compact />
          <p className="px-1 text-xs leading-5 text-slate-500">
            Transfer the amount shown, then submit the form. We&apos;ll confirm your payment and switch on your badge, usually within 2 working days.
          </p>
        </div>
      </div>

      {reqs.length ? (
        <section className="mt-10">
          <h2 className="font-semibold text-ink">Your requests</h2>
          <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {reqs.map((r) => (
              <div key={r._id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {VERIFICATION_PLANS[r.plan].name}
                    {r.plan === "property" ? ` · ${r.properties.length} listing${r.properties.length === 1 ? "" : "s"}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatPrice(r.amount)} · submitted {formatDate(r.createdAt)}
                    {r.status === "rejected" && r.adminNote ? ` · ${r.adminNote}` : ""}
                  </p>
                </div>
                <span className={clsx("chip self-start capitalize sm:self-auto", STATUS[r.status])}>{r.status === "pending" ? "Awaiting review" : r.status}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

async function AdminView({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const tab = sp.status === "approved" || sp.status === "rejected" ? sp.status : "pending";
  const open = typeof sp.open === "string" ? sp.open : "";
  const [requests, counts] = await Promise.all([
    VerificationRequest.find({ status: tab })
      .sort(tab === "pending" ? "createdAt" : "-reviewedAt")
      .limit(50)
      .populate("user", "name email phone realtorProfile")
      .populate("properties", "title slug")
      .lean(),
    VerificationRequest.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const c = Object.fromEntries(counts.map((x: { _id: string; n: number }) => [x._id, x.n]));
  const reqs = toPlain<Req[]>(requests);

  return (
    <>
      <PageHeader
        title="Verifications"
        description="Confirm each transfer in the Zenith Bank account (1228640735) before approving. Approving switches on the Verified by Found badge."
        actions={<Link href="/get-verified" className="btn-ghost btn-sm">Public page <ExternalLink className="size-3.5" /></Link>}
      />
      <Tabs
        active={tab}
        tabs={[
          { key: "pending", label: "Awaiting review", href: "/dashboard/verification", count: c.pending ?? 0 },
          { key: "approved", label: "Approved", href: "/dashboard/verification?status=approved", count: c.approved ?? 0 },
          { key: "rejected", label: "Rejected", href: "/dashboard/verification?status=rejected", count: c.rejected ?? 0 },
        ]}
      />
      <div className="mt-6 space-y-4">
        {reqs.length ? (
          reqs.map((r) => (
            <article key={r._id} className={clsx("card p-5", open === r._id && "ring-2 ring-brand-500")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {r.user?.realtorProfile?.company || r.user?.name || "Deleted account"}
                    {r.user?.realtorProfile?.company ? <span className="font-normal text-slate-500"> · {r.user.name}</span> : null}
                  </p>
                  <p className="text-sm text-slate-500">{[r.user?.email, r.user?.phone].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-ink">{formatPrice(r.amount)}</p>
                  <p className="text-xs text-slate-500">{VERIFICATION_PLANS[r.plan].name}</p>
                </div>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs text-slate-500">Paid by</dt><dd className="font-medium text-ink">{r.payerName}</dd></div>
                <div><dt className="text-xs text-slate-500">Reference</dt><dd className="font-medium text-ink">{r.paymentReference || "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Paid on</dt><dd className="font-medium text-ink">{r.paidOn ? formatDate(r.paidOn) : "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Submitted</dt><dd className="font-medium text-ink">{formatDate(r.createdAt)}</dd></div>
              </dl>
              {r.plan === "property" ? (
                <div className="mt-4">
                  <p className="text-xs text-slate-500">Listings ({r.properties.length})</p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {r.properties.map((p) => (
                      <li key={p._id}>
                        <Link href={`/properties/${p.slug}`} target="_blank" className="chip bg-slate-100 text-slate-700 hover:bg-slate-200">{p.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                {r.proofImage ? (
                  <a href={mediaUrl(r.proofImage)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                    View receipt <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  <span className="text-sm text-slate-400">No receipt attached</span>
                )}
                {r.status === "pending" ? (
                  <ReviewButtons id={r._id} />
                ) : (
                  <span className={clsx("chip capitalize", STATUS[r.status])}>
                    {r.status} {r.reviewedAt ? `· ${formatDate(r.reviewedAt)}` : ""}
                    {r.adminNote ? ` · ${r.adminNote}` : ""}
                  </span>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState icon={BadgeCheck} title={tab === "pending" ? "No requests waiting" : `No ${tab} requests yet`} text="Realtors submit their transfer details from their dashboard after paying." />
        )}
      </div>
    </>
  );
}
