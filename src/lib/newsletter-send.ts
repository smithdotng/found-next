import "server-only";
import { Types } from "mongoose";
import { connectDB } from "./db";
import { NewsletterCampaign, User } from "./models";
import { audienceQuery } from "./newsletter";
import emailService from "./email";

/** How long one run may send before handing over (keep under the page's maxDuration). */
const BUDGET_MS = 45_000;
const LEASE_MS = 20_000;
/** Gap between emails so the SMTP provider doesn't start refusing (Hostinger rate-limits bursts). */
const GAP_MS = 1_200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends a campaign to everyone in its audience who hasn't had it yet. Safe to call repeatedly:
 * a lease stops two runs overlapping, and `sentTo` stops anyone getting it twice. A run stops
 * after BUDGET_MS and leaves the campaign "sending"; the next call carries on.
 */
export async function deliverCampaign(campaignId: string) {
  await connectDB();
  const started = Date.now();
  const lease = () => new Date(Date.now() + LEASE_MS);
  const campaign = await NewsletterCampaign.findOneAndUpdate(
    { _id: campaignId, status: "sending", $or: [{ lockedUntil: null }, { lockedUntil: { $lt: new Date() } }] },
    { $set: { lockedUntil: lease() } },
    { new: true },
  );
  if (!campaign) return "busy-or-done";

  const recipients = await User.find(audienceQuery(campaign.audience)).select("name email _id").lean<{ _id: Types.ObjectId; name: string; email: string }[]>();
  const done = new Set((campaign.sentTo ?? []).map(String));

  // Campaigns started before per-recipient tracking: the first N (in the same order) were already processed.
  const legacyProcessed = done.size === 0 ? (campaign.deliveredCount ?? 0) + (campaign.failedCount ?? 0) : 0;
  if (legacyProcessed > 0) {
    const ids = recipients.slice(0, legacyProcessed).map((r) => r._id);
    await NewsletterCampaign.updateOne({ _id: campaignId }, { $addToSet: { sentTo: { $each: ids } } });
    ids.forEach((id) => done.add(String(id)));
  }

  for (const r of recipients) {
    if (done.has(String(r._id))) continue;
    if (Date.now() - started > BUDGET_MS) {
      await NewsletterCampaign.updateOne({ _id: campaignId }, { $set: { lockedUntil: null } });
      return "paused";
    }
    const ok = await emailService.sendNewsletterEmail(r, campaign.subject, campaign.content).catch(() => false);
    await NewsletterCampaign.updateOne(
      { _id: campaignId },
      {
        $addToSet: ok ? { sentTo: r._id } : { sentTo: r._id, failedTo: r._id },
        $inc: ok ? { deliveredCount: 1 } : { failedCount: 1 },
        $set: { lockedUntil: lease(), lastProgressAt: new Date() },
      },
    );
    await sleep(GAP_MS);
  }

  const final = await NewsletterCampaign.findById(campaignId).select("deliveredCount");
  await NewsletterCampaign.updateOne(
    { _id: campaignId },
    { $set: { status: (final?.deliveredCount ?? 0) === 0 ? "failed" : "sent", sentAt: new Date(), lockedUntil: null, recipientCount: recipients.length } },
  );
  return "done";
}

/**
 * Puts a campaign's failed recipients back in the queue and resends to just them.
 * Campaigns sent before failures were tracked assume the failures were the last ones
 * attempted (sentTo keeps send order), which is how SMTP rate-limiting shows up.
 */
export async function requeueFailed(campaignId: string) {
  await connectDB();
  const c = await NewsletterCampaign.findById(campaignId).select("sentTo failedTo failedCount status");
  if (!c || !c.failedCount) return 0;
  const failed: Types.ObjectId[] = c.failedTo?.length ? c.failedTo : (c.sentTo ?? []).slice(-c.failedCount);
  if (!failed.length) return 0;
  await NewsletterCampaign.updateOne(
    { _id: campaignId },
    { $pull: { sentTo: { $in: failed } }, $set: { failedTo: [], status: "sending", lockedUntil: null }, $inc: { failedCount: -failed.length } },
  );
  return failed.length;
}
