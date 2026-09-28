"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { DAY, getSession, sessionOptions } from "@/lib/session";
import { EMAIL_RE, NG_PHONE } from "@/lib/format";
import emailService from "@/lib/email";
import type { FormState } from "./public";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function safeNext(n: string) {
  return n.startsWith("/") && !n.startsWith("//") ? n : "";
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = s(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = safeNext(s(fd, "next"));
  if (!email || !password) return { ok: false, message: "Enter your email and password." };

  await connectDB();
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) return { ok: false, message: "Invalid email or password" };
  if (user.isSuspended) return { ok: false, message: "This account has been suspended. Contact hello@found.ng for help." };

  const session = await getSession();
  session.userId = String(user._id);
  session.userType = user.userType;
  session.userName = user.name;
  session.userEmail = user.email;
  // "Remember me" keeps the cookie for 30 days, otherwise 24 hours (same as the Express app).
  session.updateConfig(sessionOptions(fd.get("remember") ? DAY * 30 : DAY));
  await session.save();

  redirect(next || "/dashboard");
}

function validateAccount(fd: FormData) {
  const errors: Record<string, string> = {};
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const phone = s(fd, "phone").replace(/\s/g, "");
  const password = String(fd.get("password") ?? "");
  if (!name) errors.name = "Enter your full name";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
  if (!NG_PHONE.test(phone)) errors.phone = "Enter a valid Nigerian phone number (e.g. 08031234567 or +2348031234567)";
  if (password.length < 8) errors.password = "Password must be at least 8 characters long";
  if (fd.has("confirmPassword") && password !== String(fd.get("confirmPassword"))) errors.confirmPassword = "Passwords do not match";
  if (!fd.get("terms")) errors.terms = "Please accept the terms to continue";
  return { errors, name, email, phone, password };
}

export async function registerRealtor(_prev: FormState, fd: FormData): Promise<FormState> {
  const { errors, name, email, phone, password } = validateAccount(fd);
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  await connectDB();
  if (await User.findOne({ email })) return { ok: false, message: "Email already registered", errors: { email: "Email already registered — try signing in." } };

  const optIn = fd.get("newsletter") === "on";
  const user = new User({
    name,
    email,
    phone,
    password,
    userType: "realtor",
    newsletter: optIn,
    realtorProfile: { company: s(fd, "company"), rcNumber: s(fd, "rcNumber"), verified: false },
    preferences: { emailInquiries: true, emailTransactions: true, weeklyNewsletter: optIn, marketingEmails: optIn },
  });
  await user.save();
  emailService.sendWelcomeEmailToRealtor(user).catch((e: unknown) => console.error("Email error:", e));
  emailService.sendAdminNewAccountNotification(user).catch((e: unknown) => console.error("Admin notify error:", e));

  const session = await getSession();
  session.userId = String(user._id);
  session.userType = "realtor";
  session.userName = user.name;
  session.userEmail = user.email;
  await session.save();
  redirect("/dashboard?notice=Welcome+to+Found!+Add+your+first+listing+to+get+started.");
}

export async function registerAgent(_prev: FormState, fd: FormData): Promise<FormState> {
  const { errors, name, email, phone, password } = validateAccount(fd);
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  await connectDB();
  if (await User.findOne({ email })) return { ok: false, message: "Email already registered", errors: { email: "Email already registered — try signing in." } };

  // Free registration, auto-approved (matches the current Express behaviour).
  const user = new User({
    name,
    email,
    phone,
    password,
    userType: "agent",
    agentProfile: {
      isApproved: true,
      registrationPaid: true,
      registrationDate: new Date(),
      socialHandle: s(fd, "socialHandle"),
      experience: s(fd, "experience"),
    },
    preferences: { emailInquiries: true, emailTransactions: true, weeklyNewsletter: false, marketingEmails: false },
  });
  user.generateUniqueLink();
  await user.save();
  emailService.sendWelcomeEmailToAgent(user).catch((e: unknown) => console.error("Email error:", e));
  emailService.sendAdminNewAccountNotification(user).catch((e: unknown) => console.error("Admin notify error:", e));

  const session = await getSession();
  session.userId = String(user._id);
  session.userType = "agent";
  session.userName = user.name;
  session.userEmail = user.email;
  await session.save();
  redirect("/dashboard/promote?notice=Welcome!+Pick+a+property+to+start+promoting.");
}

export async function forgotPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = s(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Enter a valid email address." };
  await connectDB();
  const user = await User.findOne({ email });
  if (user) {
    const token = randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    try {
      await emailService.sendPasswordResetEmail(user, token);
    } catch (e) {
      console.error("Reset email error:", e);
      return { ok: false, message: "We couldn't send the reset email. Please try again shortly." };
    }
  }
  // Same response whether or not the account exists, so emails can't be enumerated.
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. It expires in 1 hour." };
}

export async function resetPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = s(fd, "token");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { ok: false, message: "Password must be at least 8 characters long" };
  if (password !== String(fd.get("confirmPassword") ?? "")) return { ok: false, message: "Passwords do not match" };
  await connectDB();
  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
  if (!user) return { ok: false, message: "This reset link is invalid or has expired. Request a new one." };
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  redirect("/login?notice=Password+updated.+Sign+in+with+your+new+password.");
}
