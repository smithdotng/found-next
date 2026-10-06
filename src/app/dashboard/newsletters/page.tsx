import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { requireUser, isSuperAdmin } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { NewsletterCampaign, User } from "@/lib/models";
import { AUDIENCES, audienceQuery } from "@/lib/newsletter";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { NewsletterComposer } from "@/components/dashboard/newsletter-composer";
import { CampaignWatcher } from "@/components/dashboard/campaign-watcher";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Newsletters" };
// Sending runs after the response inside this page's server actions; give it room.
export const maxDuration = 60;

type Campaign = { _id: string; subject: string; audience: string; status: string; recipientCount: number; deliveredCount: number; failedCount: number; sentAt?: string; createdAt: string; lastProgressAt?: string };

const STATUS: Record<string, string> = {
  sent: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  sending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export default async function NewslettersPage() {
  const session = await requireUser(["admin"]);
  if (!isSuperAdmin(session)) redirect("/dashboard?notice=Only+the+super+admin+can+send+newsletters");
  await connectDB();
  const [campaigns, ...counts] = await Promise.all([
    NewsletterCampaign.find().select("-content -sentTo").sort("-createdAt").limit(50).lean(),
    ...AUDIENCES.map((a) => User.countDocuments(audienceQuery(a.value))),
  ]);
  const countMap = Object.fromEntries(AUDIENCES.map((a, i) => [a.value, counts[i] as number]));
  const rows = toPlain<Campaign[]>(campaigns);

  return (
    <>
      <PageHeader title="Newsletters" description="Email realtors and agents. Opted-in audiences respect each user's email preferences." />
      <NewsletterComposer counts={countMap} adminEmail={session.userEmail} />

      <h2 className="mb-3 mt-10 font-semibold text-ink">Sent campaigns</h2>
      {rows.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3 font-semibold">Subject</th><th className="px-4 py-3 font-semibold">Audience</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Delivered</th><th className="px-4 py-3 font-semibold">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-medium text-ink">{c.subject}</td>
                  <td className="px-4 py-3 text-slate-600">{AUDIENCES.find((a) => a.value === c.audience)?.label ?? c.audience}</td>
                  <td className="px-4 py-3"><span className={`chip capitalize ${STATUS[c.status] ?? STATUS.draft}`}>{c.status}</span>{c.status === "sending" ? <CampaignWatcher id={c._id} lastProgressAt={c.lastProgressAt} /> : null}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {c.deliveredCount.toLocaleString()} / {c.recipientCount.toLocaleString()}
                    {c.failedCount ? <span className="ml-1 text-xs text-rose-600">({c.failedCount} failed)</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.sentAt || c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Mail} title="No campaigns yet" text="Campaigns you send appear here with delivery counts." />
      )}
    </>
  );
}
