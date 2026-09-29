"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { getSession, requireUser } from "@/lib/session";
import { NG_PHONE } from "@/lib/format";
import { removeUpload, saveImage, UploadError } from "@/lib/uploads";

type Result = { ok: boolean; message: string; errors?: Record<string, string> } | null;
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function updateProfile(_prev: Result, fd: FormData): Promise<Result> {
  const session = await requireUser();
  const name = s(fd, "name");
  const phone = s(fd, "phone").replace(/\s/g, "");
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter your name";
  if (!NG_PHONE.test(phone)) errors.phone = "Enter a valid Nigerian phone number";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return { ok: false, message: "Account not found" };
  user.name = name;
  user.phone = phone;
  if (user.userType === "realtor") {
    user.realtorProfile = { ...(user.realtorProfile?.toObject?.() ?? user.realtorProfile ?? {}), company: s(fd, "company"), rcNumber: s(fd, "rcNumber"), address: s(fd, "address") };
  }
  if (user.userType === "agent") {
    user.agentProfile.socialHandle = s(fd, "socialHandle");
  }
  if (user.userType === "host") {
    user.hostProfile.businessName = s(fd, "businessName");
    user.hostProfile.city = s(fd, "city") || user.hostProfile.city;
    user.hostProfile.about = s(fd, "about").slice(0, 800);
  }
  const optIn = fd.get("weeklyNewsletter") === "on";
  user.preferences = {
    emailInquiries: fd.get("emailInquiries") === "on",
    emailTransactions: fd.get("emailTransactions") === "on",
    weeklyNewsletter: optIn,
    marketingEmails: fd.get("marketingEmails") === "on",
  };
  user.newsletter = optIn;

  const photo = fd.get("profileImage");
  if (photo && typeof photo === "object" && (photo as File).size > 0) {
    try {
      const url = await saveImage(photo as File, "profile");
      if (user.profileImage?.startsWith("/uploads/")) await removeUpload(user.profileImage);
      user.profileImage = url;
    } catch (e) {
      return { ok: false, message: e instanceof UploadError ? e.message : "Couldn't upload that photo" };
    }
  }
  await user.save();

  const session2 = await getSession();
  session2.userName = user.name;
  await session2.save();
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved" };
}

export async function changePassword(_prev: Result, fd: FormData): Promise<Result> {
  const session = await requireUser();
  const current = String(fd.get("currentPassword") ?? "");
  const next = String(fd.get("newPassword") ?? "");
  if (next.length < 8) return { ok: false, message: "New password must be at least 8 characters" };
  if (next !== String(fd.get("confirmPassword") ?? "")) return { ok: false, message: "New passwords do not match" };
  await connectDB();
  const user = await User.findById(session.userId);
  if (!user || !(await user.comparePassword(current))) return { ok: false, message: "Current password is incorrect" };
  user.password = next;
  await user.save();
  return { ok: true, message: "Password updated" };
}
