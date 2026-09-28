"use server";

import { revalidatePath } from "next/cache";
import { marked } from "marked";
import { connectDB } from "@/lib/db";
import { NewsletterCampaign, User } from "@/lib/models";
import { requireUser, isSuperAdmin } from "@/lib/session";
import emailService from "@/lib/email";
import { audienceQuery } from "@/lib/newsletter";

type State = { ok: boolean; message: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function guard() {
  const session = await requireUser(["admin"]);
  if (!isSuperAdmin(session)) throw new Error("Only the super admin can send newsletters");
  return session;
}

/** Content is written in Markdown; raw HTML is passed through, so older HTML campaigns still work. */
function toHtml(content: string) {
  return marked.parse(content, { async: false, breaks: true }) as string;
}

function read(fd: FormData) {
  return {
    subject: String(fd.get("subject") || "").trim(),
    content: String(fd.get("content") || "").trim(),
    audience: String(fd.get("audience") || "realtors_optin"),
  };
}

export async function sendTestNewsletter(_prev: State, fd: FormData): Promise<State> {
  const session = await guard();
  const { subject, content } = read(fd);
  if (!subject || !content) return { ok: false, message: "Add a subject and content first" };
  const to = String(fd.get("testTo") || "").trim() || session.userEmail;
  if (!EMAIL_RE.test(to)) return { ok: false, message: "Enter a valid test email address" };
  const ok = await emailService.sendNewsletterEmail({ _id: null, email: to, name: session.userName }, subject, toHtml(content)).catch(() => false);
  return ok ? { ok: true, message: `Test sent to ${to}` } : { ok: false, message: "Could not send the test — check the SMTP settings in .env" };
}

export async function sendNewsletter(_prev: State, fd: FormData): Promise<State> {
  const session = await guard();
  const { subject, content, audience } = read(fd);
  if (!subject || !content) return { ok: false, message: "Add a subject and content first" };
  await connectDB();
  const recipients = await User.find(audienceQuery(audience)).select("name email _id").lean();
  const html = toHtml(content);
  const campaign = await NewsletterCampaign.create({
    subject, content: html, audience, status: recipients.length ? "sending" : "sent",
    recipientCount: recipients.length, sentBy: session.userId, sentAt: recipients.length ? undefined : new Date(),
  });
  if (!recipients.length) return { ok: false, message: "No one matches that audience, so nothing was sent" };

  // Send in the background so the page returns straight away; progress shows in the history table.
  void (async () => {
    let delivered = 0, failed = 0;
    for (const r of recipients) {
      const ok = await emailService.sendNewsletterEmail(r, subject, html).catch(() => false);
      if (ok) delivered++; else failed++;
      if ((delivered + failed) % 20 === 0) await NewsletterCampaign.updateOne({ _id: campaign._id }, { deliveredCount: delivered, failedCount: failed });
    }
    await NewsletterCampaign.updateOne(
      { _id: campaign._id },
      { deliveredCount: delivered, failedCount: failed, status: delivered === 0 ? "failed" : "sent", sentAt: new Date() },
    );
  })();

  revalidatePath("/dashboard/newsletters");
  return { ok: true, message: `Sending to ${recipients.length.toLocaleString()} recipient${recipients.length === 1 ? "" : "s"}…` };
}
