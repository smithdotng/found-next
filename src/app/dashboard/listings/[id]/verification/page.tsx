import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, BadgeCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { PreVerification, Property, User } from "@/lib/models";
import { formatDate } from "@/lib/format";
import { ENCUMBRANCES, PREVERIFY_STATUS, TITLE_TYPES, labelFor, type PreVerifyStatus } from "@/lib/pre-verification";
import { isPropertyVerified } from "@/lib/verification";
import { PageHeader } from "@/components/dashboard/ui";
import { DocRow, PreVerificationForm, PreVerificationReview, type Check } from "@/components/dashboard/pre-verification-form";

export const metadata = { title: "Pre-verification checklist" };

type Stored = Check & { _id: string; status: PreVerifyStatus; adminNote?: string; submittedAt?: string; reviewedAt?: string; owner: string };

export default async function PreVerificationPage({ params }: PageProps<"/dashboard/listings/[id]/verification">) {
  const session = await requireUser(["realtor", "admin"]);
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  await connectDB();
  const property = await Property.findById(id).select("title slug owner propertyType verification").lean<{
    _id: unknown; title: string; slug: string; owner: unknown; propertyType: string; verification?: { verified?: boolean; until?: string };
  }>();
  if (!property) notFound();
  const isAdmin = session.userType === "admin";
  if (!isAdmin && String(property.owner) !== session.userId) notFound();

  const [doc, owner] = await Promise.all([
    PreVerification.findOne({ property: id }).lean(),
    isAdmin ? User.findById(property.owner).select("name email phone realtorProfile").lean<{ name: string; email: string; phone?: string; realtorProfile?: { company?: string } }>() : null,
  ]);
  const check = doc ? toPlain<Stored>(doc) : null;
  const status: PreVerifyStatus = check?.status ?? "none";
  const meta = PREVERIFY_STATUS[status];
  const verified = isPropertyVerified(property);
  const publicHref = `/${property.propertyType === "shortlet" ? "apartments" : "properties"}/${property.slug}`;

  return (
    <>
      <Link href="/dashboard/listings" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink">
        <ArrowLeft className="size-4" /> Listings
      </Link>
      <PageHeader
        title="Pre-verification checklist"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Link href={publicHref} target="_blank" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
              {property.title} <ExternalLink className="size-3.5" />
            </Link>
            <span className={clsx("chip", meta.tone)}>{meta.label}</span>
            {verified ? <span className="chip bg-emerald-600 text-white"><BadgeCheck className="size-3.5" /> Verified</span> : null}
          </span>
        }
      />

      {check?.status === "needs_changes" && check.adminNote ? (
        <div className="mb-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-100">
          <p className="font-semibold">Found asked for changes</p>
          <p className="mt-1 whitespace-pre-line">{check.adminNote}</p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {isAdmin && check ? <AdminSummary check={check} propertyId={id} owner={owner} /> : null}
          {isAdmin ? (
            <details className="mt-5" open={!check}>
              <summary className="cursor-pointer text-sm font-semibold text-brand-700">{check ? "Edit on the realtor's behalf" : "Fill in on the realtor's behalf"}</summary>
              <div className="mt-4"><PreVerificationForm propertyId={id} check={check} /></div>
            </details>
          ) : (
            <PreVerificationForm propertyId={id} check={check} />
          )}
        </div>
        <aside className="space-y-4">
          {isAdmin && check ? <PreVerificationReview propertyId={id} /> : null}
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
            <p className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="size-4 text-emerald-600" /> Why we ask</p>
            <p className="mt-2 leading-6">
              Before a listing carries the Verified by Found badge, we check the title and look for anything that could stop a sale or let. Completing this checklist is the first step, and it
              speeds up verification.
            </p>
            <p className="mt-2 leading-6">Your documents are private. They&apos;re never shown on the listing, only to Found&apos;s verification team.</p>
            {!verified && !isAdmin ? (
              <Link href="/dashboard/verification?plan=property" className="btn-outline btn-sm mt-4 w-full">Get this listing verified</Link>
            ) : null}
          </div>
          {check?.submittedAt ? <p className="px-1 text-xs text-slate-500">Last submitted {formatDate(check.submittedAt)}{check.reviewedAt ? ` · reviewed ${formatDate(check.reviewedAt)}` : ""}</p> : null}
        </aside>
      </div>
    </>
  );
}

function AdminSummary({ check, propertyId, owner }: { check: Stored; propertyId: string; owner: { name: string; email: string; phone?: string; realtorProfile?: { company?: string } } | null }) {
  const rows: [string, React.ReactNode][] = [
    ["Realtor", owner ? `${owner.realtorProfile?.company ? `${owner.realtorProfile.company} · ` : ""}${owner.name} · ${owner.email}${owner.phone ? ` · ${owner.phone}` : ""}` : "—"],
    ["Title", labelFor(TITLE_TYPES, check.titleType) + (check.titleType === "other" && check.titleTypeOther ? `: ${check.titleTypeOther}` : "")],
    ["Name on title", check.titleHolder || "—"],
    ["Title / file number", check.titleNumber || "—"],
    ["Survey plan", check.surveyPlan === "yes" ? "Yes" : check.surveyPlan === "in_progress" ? "In progress" : check.surveyPlan === "no" ? "No" : "—"],
    ["Relationship", check.ownership === "owner" ? "Owner" : "Authorised by the owner"],
    [
      "Encumbrance",
      check.encumbered === "no" ? (
        "None declared"
      ) : (
        <span className="text-rose-700">
          {check.encumbered === "unsure" ? "Not sure" : (check.encumbrances ?? []).map((x) => labelFor(ENCUMBRANCES, x)).join(", ")}
          {check.encumbranceDetails ? <span className="mt-1 block whitespace-pre-line text-slate-700">{check.encumbranceDetails}</span> : null}
        </span>
      ),
    ],
    ["Notes", check.notes ? <span className="whitespace-pre-line">{check.notes}</span> : "—"],
  ];
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-semibold text-ink">Submitted checklist</h2>
      <dl className="mt-4 divide-y divide-slate-100 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[180px_1fr]">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Documents ({check.documents.length})</p>
      <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {check.documents.map((d) => <DocRow key={d._id} propertyId={propertyId} doc={d} />)}
      </ul>
    </section>
  );
}
