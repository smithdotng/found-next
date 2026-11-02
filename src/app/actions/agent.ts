"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Promotion, Property, User, Withdrawal } from "@/lib/models";
import { requireUser } from "@/lib/session";
import { siteUrl } from "@/lib/seo";
import { AGENT_AGREEMENT_VERSION } from "@/lib/agreement";
import { adminEmail, sendMail } from "@/lib/mailer";

type Result = { ok: boolean; message: string; link?: string };
type AgreeResult = { ok: boolean; message: string; errors?: Record<string, string> };

/** Creates (or returns) the agent's tracked link for a property — same code format as the Express app. */
export async function createPromotion(propertyId: string): Promise<Result> {
  const session = await requireUser(["agent"]);
  await connectDB();
  const agent = await User.findById(session.userId).select("agentProfile isSuspended");
  if (!agent?.agentProfile?.isApproved || agent.isSuspended) return { ok: false, message: "Your agent account isn't active yet." };
  if (agent.agentProfile?.agreement?.status !== "accepted")
    return { ok: false, message: "Review and sign your Agent Agreement to activate your account before creating referral links." };

  const existing = await Promotion.findOne({ agent: session.userId, property: propertyId });
  if (existing) return { ok: true, message: "You're already promoting this property", link: existing.referralLink };

  const property = await Property.findOne({ _id: propertyId, status: "available" }).select("_id");
  if (!property) return { ok: false, message: "This property isn't available for promotion" };

  const code = `FND-${session.userId.slice(-6).toUpperCase()}-${propertyId.slice(-6).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const promo = await Promotion.create({
    agent: session.userId,
    property: propertyId,
    referralCode: code,
    referralLink: `${siteUrl()}/r/${code}`,
  });
  promo.qrCode = `/dashboard/promotions/${promo._id}/qr`;
  await promo.save();
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Link created — share it anywhere", link: promo.referralLink };
}

export async function trackShare(promotionId: string, platform: string) {
  const session = await requireUser(["agent"]);
  const allowed = ["facebook", "twitter", "instagram", "whatsapp", "linkedin"];
  if (!allowed.includes(platform)) return;
  await connectDB();
  await Promotion.updateOne({ _id: promotionId, agent: session.userId }, { $inc: { [`socialShares.${platform}`]: 1 } });
}

export async function deletePromotion(promotionId: string): Promise<Result> {
  const session = await requireUser(["agent"]);
  await connectDB();
  await Promotion.deleteOne({ _id: promotionId, agent: session.userId, transactions: 0 });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Promotion removed" };
}

export async function saveBankDetails(_prev: unknown, fd: FormData): Promise<Result> {
  const session = await requireUser(["agent"]);
  const bankName = String(fd.get("bankName") ?? "").trim();
  const accountNumber = String(fd.get("accountNumber") ?? "").replace(/\D/g, "");
  const accountName = String(fd.get("accountName") ?? "").trim();
  if (!bankName || accountNumber.length !== 10 || !accountName) return { ok: false, message: "Enter your bank, 10-digit NUBAN and account name." };
  await connectDB();
  await User.updateOne({ _id: session.userId }, { $set: { "agentProfile.bankDetails": { bankName, accountNumber, accountName } } });
  revalidatePath("/dashboard/earnings");
  return { ok: true, message: "Bank details saved" };
}

/** Records a real Withdrawal request (the Express route only logged it). */
export async function requestWithdrawal(_prev: unknown, fd: FormData): Promise<Result> {
  const session = await requireUser(["agent"]);
  const amount = Math.floor(Number(String(fd.get("amount") ?? "").replace(/[^\d.]/g, "")));
  if (!(amount >= 1000)) return { ok: false, message: "Minimum withdrawal amount is ₦1,000" };
  await connectDB();
  const user = await User.findById(session.userId);
  const bank = user?.agentProfile?.bankDetails;
  if (!bank?.accountNumber) return { ok: false, message: "Add your bank details first" };
  // Atomic balance check-and-decrement so double submits can't overdraw.
  const updated = await User.findOneAndUpdate(
    { _id: session.userId, "agentProfile.pendingWithdrawal": { $gte: amount } },
    { $inc: { "agentProfile.pendingWithdrawal": -amount } },
  );
  if (!updated) return { ok: false, message: "Insufficient balance" };
  await Withdrawal.create({
    agent: session.userId,
    amount,
    bankDetails: { bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName },
    status: "pending",
  });
  revalidatePath("/dashboard/earnings");
  return { ok: true, message: "Withdrawal requested — we'll process it within 2 business days." };
}

/** Agent signs the referral agreement — the final step of agent verification that activates the account. */
export async function acceptAgentAgreement(_prev: unknown, fd: FormData): Promise<AgreeResult> {
  const session = await requireUser(["agent"]);
  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return { ok: false, message: "Account not found." };
  if (!user.agentProfile?.isApproved)
    return { ok: false, message: "Your agent account needs to be verified by Found before you can sign." };

  const signedName = String(fd.get("signedName") ?? "").trim();
  if (signedName.toLowerCase().replace(/\s+/g, " ") !== user.name.toLowerCase().replace(/\s+/g, " "))
    return { ok: false, message: `Type your full name exactly as on your account (${user.name}) to sign.`, errors: { signedName: "Name doesn't match" } };
  if (!fd.get("agree")) return { ok: false, message: "Tick the box to confirm you agree.", errors: { agree: "Required" } };

  const h = await headers();
  user.agentProfile.agreement = {
    status: "accepted",
    version: AGENT_AGREEMENT_VERSION,
    sentAt: user.agentProfile.agreement?.sentAt,
    acceptedAt: new Date(),
    signedName,
    signedIp: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "",
    signedUserAgent: (h.get("user-agent") ?? "").slice(0, 300),
  };
  await user.save();

  void sendMail(
    adminEmail(),
    `Agent agreement signed: ${user.name}`,
    `<p>${user.name} (${user.email}) signed the Found agent referral agreement (version ${AGENT_AGREEMENT_VERSION}). Their agent account is now active.</p>`,
    "Found",
  ).catch(() => {});
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Agreement signed — your agent account is now active. You can start creating referral links." };
}
