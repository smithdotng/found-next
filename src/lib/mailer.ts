import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { siteUrl } from "./seo";

let transport: Transporter | null | undefined;

function transporter() {
  if (transport !== undefined) return transport;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    transport = null;
    return null;
  }
  transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.EMAIL_PORT || "465"),
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return transport;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function adminEmail() {
  return process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "admin@found.ng";
}

/**
 * Branded Found Apartments email. `rows` render as a label/value table;
 * `cta` is a button linking into the site.
 */
export function apartmentEmail(opts: {
  heading: string;
  intro: string;
  rows?: [string, string][];
  note?: string;
  cta?: { label: string; href: string };
  /** Header wordmark; defaults to "Found Apartments". */
  brand?: "apartments" | "found";
}) {
  const base = siteUrl();
  const rows = (opts.rows ?? [])
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;width:40%">${esc(k)}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${esc(v)}</td></tr>`)
    .join("");
  const href = opts.cta ? (opts.cta.href.startsWith("http") ? opts.cta.href : base + opts.cta.href) : "";
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px"><tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:14px;overflow:hidden">
    <tr><td style="background:#12334a;padding:20px 28px;color:#fff;font-size:18px;font-weight:700">${opts.brand === "found" ? `Found <span style="color:#f2a0a5">Projects &amp; Realty</span>` : `Found <span style="color:#f2a0a5">Apartments</span>`}</td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 10px;font-size:20px;color:#0f172a">${esc(opts.heading)}</h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155">${esc(opts.intro)}</p>
      ${rows ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:0 0 18px">${rows}</table>` : ""}
      ${opts.note ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;background:#f8fafc;border-radius:10px;padding:12px 14px">${esc(opts.note)}</p>` : ""}
      ${opts.cta ? `<a href="${esc(href)}" style="display:inline-block;background:#1b5e85;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px">${esc(opts.cta.label)}</a>` : ""}
    </td></tr>
    <tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">Found Projects &amp; Realty Limited · Suite 5 Gwandal Centre, Wuse 2, Abuja · hello@found.ng</td></tr>
  </table></td></tr></table></body></html>`;
}

/** Sends an email; never throws. Returns false when SMTP isn't configured or sending fails. */
export async function sendMail(to: string, subject: string, html: string, fromName = "Found Apartments") {
  const t = transporter();
  if (!t) {
    console.warn(`[mail] SMTP not configured — skipped "${subject}" to ${to}`);
    return false;
  }
  try {
    await t.sendMail({ from: `"${fromName}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`, to, subject, html });
    return true;
  } catch (e) {
    console.error(`[mail] Failed "${subject}" to ${to}:`, e instanceof Error ? e.message : e);
    return false;
  }
}
