"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Property, User, Withdrawal, Promotion } from "@/lib/models";
import { requireUser, isSuperAdmin } from "@/lib/session";
import emailService from "@/lib/email";

type Result = { ok: boolean; message: string };

export async function setUserVerified(id: string, verified: boolean): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  await User.updateOne({ _id: id, userType: "realtor" }, { $set: { "realtorProfile.verified": verified } });
  revalidatePath("/dashboard/users");
  return { ok: true, message: verified ? "Realtor verified" : "Verification removed" };
}

export async function setUserSuspended(id: string, suspended: boolean): Promise<Result> {
  const session = await requireUser(["admin"]);
  if (id === session.userId) return { ok: false, message: "You can't suspend your own account" };
  await connectDB();
  await User.updateOne({ _id: id, userType: { $ne: "admin" } }, { $set: { isSuspended: suspended } });
  // Suspending hides the user's live listings; reinstating doesn't auto-republish.
  if (suspended) await Property.updateMany({ owner: id, status: "available" }, { $set: { status: "unavailable" } });
  revalidatePath("/dashboard/users");
  return { ok: true, message: suspended ? "Account suspended and listings hidden" : "Account reinstated" };
}

export async function setAgentApproved(id: string, approved: boolean): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const agent = await User.findOne({ _id: id, userType: "agent" });
  if (!agent) return { ok: false, message: "Agent not found" };
  agent.agentProfile.isApproved = approved;
  if (approved && !agent.agentProfile.uniqueLink) agent.generateUniqueLink();
  await agent.save();
  if (approved) emailService.sendAgentApprovalEmail(agent).catch((e: unknown) => console.error(e));
  revalidatePath("/dashboard/users");
  return { ok: true, message: approved ? "Agent approved" : "Agent approval revoked" };
}

export async function deleteUser(id: string): Promise<Result> {
  const session = await requireUser(["admin"]);
  if (!isSuperAdmin(session)) return { ok: false, message: "Only the super admin can delete accounts" };
  if (id === session.userId) return { ok: false, message: "You can't delete your own account" };
  await connectDB();
  const user = await User.findById(id);
  if (!user) return { ok: false, message: "User not found" };
  if (user.userType === "admin") return { ok: false, message: "Admin accounts can't be deleted here" };
  await Promise.all([
    Property.updateMany({ owner: id }, { $set: { status: "unavailable" } }),
    Promotion.deleteMany({ agent: id }),
    User.deleteOne({ _id: id }),
  ]);
  revalidatePath("/dashboard/users");
  return { ok: true, message: "Account deleted. Their listings were taken off market." };
}

export async function messageUser(id: string, subject: string, message: string): Promise<Result> {
  const session = await requireUser(["admin"]);
  if (!isSuperAdmin(session)) return { ok: false, message: "Only the super admin can message users" };
  if (!subject.trim() || !message.trim()) return { ok: false, message: "Add a subject and message" };
  await connectDB();
  const user = await User.findById(id);
  if (!user) return { ok: false, message: "User not found" };
  const fn = user.userType === "agent" ? emailService.sendAdminMessageToAgent : emailService.sendAdminMessageToRealtor;
  const ok = await fn(user, subject.trim(), message.trim()).catch(() => false);
  return ok ? { ok: true, message: "Email sent" } : { ok: false, message: "Email could not be sent — check SMTP settings" };
}

export async function updateWithdrawal(id: string, status: "approved" | "processed" | "rejected", reference?: string): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const w = await Withdrawal.findById(id);
  if (!w) return { ok: false, message: "Request not found" };
  if (w.status === "rejected" || w.status === "processed") return { ok: false, message: "This request is already closed" };
  if (status === "rejected") {
    // Return the funds to the agent's available balance.
    await User.updateOne({ _id: w.agent }, { $inc: { "agentProfile.pendingWithdrawal": w.amount } });
  }
  w.status = status;
  if (status === "processed") {
    w.processedAt = new Date();
    if (reference) w.transactionReference = reference;
  }
  await w.save();
  revalidatePath("/dashboard/finance");
  return { ok: true, message: `Withdrawal ${status}` };
}
