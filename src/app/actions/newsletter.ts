"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { marked } from "marked";
import { connectDB } from "@/lib/db";
import { NewsletterCampaign, User } from "@/lib/models";
import { requireUser, isSuperAdmin } from "@/lib/session";
import emailService from "@/lib/email";
import { audienceQuery } from "@/lib/newsletter";
import { deliverCampaign } from "@/lib/newsletter-send";

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

  // Send after the response (kept alive by the platform up to the page's maxDuration);
  // anything left over is picked up by resumeNewsletter.
  after(() => deliverCampaign(String(campaign._id)));

  revalidatePath("/dashboard/newsletters");
  return { ok: true, message: `Sending to ${recipients.length.toLocaleString()} recipient${recipients.length === 1 ? "" : "s"}…` };
}

/** Continues a campaign whose sending was interrupted. Never re-sends to anyone already sent. */
export async function resumeNewsletter(id: string): Promise<State> {
  await guard();
  await connectDB();
  const c = await NewsletterCampaign.findById(id).select("status");
  if (!c || c.status !== "sending") return { ok: false, message: "This campaign isn't sending" };
  after(() => deliverCampaign(id));
  return { ok: true, message: "Resuming…" };
}
