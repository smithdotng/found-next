"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Property, User } from "@/lib/models";
import { getSession, requireUser } from "@/lib/session";
import { EMAIL_RE, NG_PHONE } from "@/lib/format";
import { AGREEMENT_VERSION } from "@/lib/agreement";
import { DEFAULT_COMMISSION, PAYOUT_DAYS } from "@/lib/stay";
import { adminEmail, apartmentEmail, sendMail } from "@/lib/mailer";
import type { FormState } from "./public";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Payout bank details from a form. `any` is false when every field was left blank. */
function readBank(fd: FormData) {
  const details = {
    bankName: s(fd, "bankName"),
    accountNumber: s(fd, "accountNumber").replace(/\D/g, ""),
    accountName: s(fd, "accountName"),
  };
  const any = !!(details.bankName || details.accountNumber || details.accountName);
  const error: Record<string, string> = {};
  if (!details.bankName) error.bankName = "Enter your bank";
  if (!/^\d{10}$/.test(details.accountNumber)) error.accountNumber = "Enter the 10-digit account number";
  if (!details.accountName) error.accountName = "Enter the account name";
  return { any, details, error: Object.keys(error).length ? error : null };
}

export async function registerHost(_prev: FormState, fd: FormData): Promise<FormState> {
  const errors: Record<string, string> = {};
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const phone = s(fd, "phone").replace(/\s/g, "");
  const password = String(fd.get("password") ?? "");
  const city = s(fd, "city");
  const state = s(fd, "state");
  const units = parseInt(s(fd, "units")) || 0;
  if (!name) errors.name = "Enter your full name";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
  if (!NG_PHONE.test(phone)) errors.phone = "Enter a valid Nigerian phone number (e.g. 08031234567)";
  if (password.length < 8) errors.password = "Password must be at least 8 characters long";
  if (!state) errors.state = "Choose the state your apartments are in";
  if (!city) errors.city = "Enter the city or area";
  if (units < 1) errors.units = "How many apartments will you list?";
  if (!fd.get("terms")) errors.terms = "Please accept the terms to continue";
  const bank = readBank(fd);
  if (bank.any && bank.error) Object.assign(errors, bank.error);
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  await connectDB();
  if (await User.findOne({ email })) return { ok: false, message: "Email already registered", errors: { email: "Email already registered — sign in instead." } };

  const user = await User.create({
    name,
    email,
    phone,
    password,
    userType: "host",
    hostProfile: {
      businessName: s(fd, "businessName"),
      address: s(fd, "address"),
      city,
      state,
      units,
      experience: s(fd, "experience"),
      idType: s(fd, "idType"),
      about: s(fd, "about").slice(0, 800),
      status: "pending",
      commissionRate: DEFAULT_COMMISSION,
      agreement: { status: "none" },
      ...(bank.any ? { bankDetails: bank.details } : {}),
    },
    preferences: { emailInquiries: true, emailTransactions: true, weeklyNewsletter: false, marketingEmails: false },
  });

  void sendMail(
    adminEmail(),
    `New Found Apartments host: ${name}`,
    apartmentEmail({
      heading: "A new host signed up",
      intro: `${name} wants to list apartments on Found Apartments. Review and vet them from the Hosts page.`,
      rows: [
        ["Business", s(fd, "businessName") || "—"],
        ["Location", `${city}, ${state}`],
        ["Apartments", String(units)],
        ["Phone", phone],
        ["Email", email],
      ],
      cta: { label: "Review host", href: "/dashboard/hosts" },
    }),
  );
  void sendMail(
    email,
    "Welcome to Found Apartments",
    apartmentEmail({
      heading: `Welcome, ${name.split(" ")[0]}`,
      intro: "Thanks for applying to host on Found Apartments. Our team will review your details and may call to arrange an inspection. Meanwhile, you can start adding your apartments.",
      note: "Next steps: 1) We vet your account. 2) You review and sign the listing agreement in your dashboard. 3) Your approved apartments go live and start receiving booking requests.",
      cta: { label: "Open your host dashboard", href: "/dashboard" },
    }),
  );

  const session = await getSession();
  session.userId = String(user._id);
  session.userType = "host";
  session.userName = user.name;
  session.userEmail = user.email;
  await session.save();
  redirect("/dashboard?notice=Welcome!+Your+host+account+is+under+review.+Start+adding+your+apartments.");
}

export async function acceptAgreement(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser(["host"]);
  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return { ok: false, message: "Account not found" };
  if (user.hostProfile?.status !== "approved") return { ok: false, message: "Your account needs to be approved before you can sign." };
  const signedName = s(fd, "signedName");
  if (signedName.toLowerCase().replace(/\s+/g, " ") !== user.name.toLowerCase().replace(/\s+/g, " "))
    return { ok: false, message: `Type your full name exactly as on your account (${user.name}) to sign.`, errors: { signedName: "Name doesn't match" } };
  if (!fd.get("agree")) return { ok: false, message: "Tick the box to confirm you agree.", errors: { agree: "Required" } };
  // Payout account is optional at signing; if any detail is given, it must be complete.
  const bank = readBank(fd);
  if (bank.any && bank.error) return { ok: false, message: "Complete your payout account details, or leave them all blank to add later.", errors: bank.error };
  if (bank.any) user.hostProfile.bankDetails = bank.details;

  const h = await headers();
  const rate = user.hostProfile.commissionRate ?? DEFAULT_COMMISSION;
  user.hostProfile.agreement = {
    status: "accepted",
    version: AGREEMENT_VERSION,
    commissionRate: rate,
    sentAt: user.hostProfile.agreement?.sentAt,
    acceptedAt: new Date(),
    signedName,
    signedIp: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "",
    signedUserAgent: (h.get("user-agent") ?? "").slice(0, 300),
  };
  await user.save();

  void sendMail(
    adminEmail(),
    `Listing agreement signed: ${user.name}`,
    apartmentEmail({
      heading: "A host signed the listing agreement",
      intro: `${user.name} accepted the Found Apartments listing agreement (version ${AGREEMENT_VERSION}) at ${rate}% commission. ${bank.any ? `Payouts go to ${bank.details.bankName} ${bank.details.accountNumber} (${bank.details.accountName}).` : "No payout account yet: collect it before their first payout."} Their pending apartments are ready for review.`,
      cta: { label: "Review apartments", href: "/dashboard/approvals" },
    }),
  );
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Agreement signed. Your apartments will go live as soon as the Found team approves them." };
}

/* ---------- Admin: vetting ---------- */

export async function reviewHost(id: string, decision: "approved" | "rejected" | "pending", opts: { rate?: number; note?: string } = {}) {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const host = await User.findOne({ _id: id, userType: "host" });
  if (!host) return { ok: false, message: "Host not found" };
  const rate = Math.min(60, Math.max(0, Number(opts.rate ?? host.hostProfile?.commissionRate ?? DEFAULT_COMMISSION)));
  const rateChanged = rate !== host.hostProfile?.commissionRate;
  host.hostProfile.status = decision;
  host.hostProfile.reviewNote = opts.note?.slice(0, 600) || undefined;
  host.hostProfile.reviewedAt = new Date();
  host.hostProfile.reviewedBy = admin.userId;
  host.hostProfile.commissionRate = rate;
  if (decision === "approved" && (host.hostProfile.agreement?.status !== "accepted" || rateChanged)) {
    // A new rate needs a fresh signature.
    host.hostProfile.agreement = { status: "sent", sentAt: new Date(), commissionRate: rate, version: AGREEMENT_VERSION };
  }
  if (decision !== "approved") {
    await Property.updateMany({ owner: host._id, status: "available" }, { $set: { status: "unavailable" } });
  }
  await host.save();

  if (decision === "approved") {
    void sendMail(
      host.email,
      "You're approved — sign your Found Apartments agreement",
      apartmentEmail({
        heading: "Your host account is approved",
        intro: `Good news, ${host.name.split(" ")[0]}! You've been vetted as a Found Apartments host. Please review and sign the listing agreement so your apartments can go live.`,
        rows: [
          ["Found's commission", `${rate}% of the accommodation total`],
          ["How you're paid", `Guests pay Found; Found sends you the rest within ${PAYOUT_DAYS} working days of check-in`],
        ],
        note: opts.note,
        cta: { label: "Review & sign agreement", href: "/dashboard/agreement" },
      }),
    );
  } else if (decision === "rejected") {
    void sendMail(
      host.email,
      "Update on your Found Apartments application",
      apartmentEmail({
        heading: "We can't approve your host account yet",
        intro: "Thanks for applying to host on Found Apartments. After reviewing your details we're unable to approve your account at this time.",
        note: opts.note,
        cta: { label: "Contact Found", href: "/contact" },
      }),
    );
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: decision === "approved" ? `Host approved at ${rate}% — agreement sent` : decision === "rejected" ? "Host rejected" : "Moved back to review" };
}
