"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { PreVerification, Property, User, VerificationRequest } from "@/lib/models";
import { requireUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { saveImage, UploadError } from "@/lib/uploads";
import { adminEmail, apartmentEmail, sendMail } from "@/lib/mailer";
import { applyRealtorBadge } from "@/lib/verification-server";
import { PAYMENT_ACCOUNT, VERIFICATION_PLANS, isRealtorVerified, oneYearFrom, type VerificationPlan } from "@/lib/verification";
import type { FormState } from "./public";

type Result = { ok: boolean; message: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const FROM = "Found Verification";

/** Realtor submits the details of a bank transfer for a verification plan. */
export async function submitVerification(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser(["realtor"]);
  const plan = s(fd, "plan") as VerificationPlan;
  const errors: Record<string, string> = {};
  if (!(plan in VERIFICATION_PLANS)) return { ok: false, message: "Choose a verification plan." };

  await connectDB();
  const user = await User.findById(session.userId).select("name email realtorProfile");
  if (!user) return { ok: false, message: "Account not found." };

  let propertyIds: string[] = [];
  if (plan === "property") {
    const picked = fd.getAll("properties").map(String).filter(Boolean);
    const owned = await Property.find({ _id: { $in: picked }, owner: session.userId, "verification.verified": { $ne: true } }).distinct("_id");
    propertyIds = owned.map(String);
    if (!propertyIds.length) errors.properties = "Select at least one of your unverified listings.";
    // Each listing needs a submitted pre-verification checklist (title, encumbrance, documents).
    const ready = new Set(
      (await PreVerification.find({ property: { $in: propertyIds }, status: { $in: ["submitted", "accepted"] } }).distinct("property")).map(String),
    );
    if (propertyIds.some((id) => !ready.has(id))) errors.properties = "Complete the pre-verification checklist for each listing first.";
  } else if (isRealtorVerified(user.realtorProfile)) {
    return { ok: false, message: "You're already a verified realtor. You can renew closer to your expiry date." };
  }

  const pending = await VerificationRequest.findOne({ user: session.userId, plan, status: "pending" }).select("_id properties");
  if (pending && plan === "annual") return { ok: false, message: "You already have a realtor verification request awaiting review." };
  if (pending && plan === "property") {
    const already = new Set(pending.properties.map(String));
    if (propertyIds.some((id) => already.has(id))) errors.properties = "Some of these listings are already in a request awaiting review.";
  }

  const payerName = s(fd, "payerName");
  const paymentReference = s(fd, "paymentReference").slice(0, 120);
  const paidOnRaw = s(fd, "paidOn");
  if (!payerName) errors.payerName = "Enter the name on the account you paid from.";
  const paidOn = paidOnRaw ? new Date(paidOnRaw) : undefined;
  if (paidOn && Number.isNaN(paidOn.getTime())) errors.paidOn = "Enter a valid date.";
  if (Object.keys(errors).length) return { ok: false, message: "Please check the highlighted fields.", errors };

  let proofImage: string | undefined;
  const file = fd.get("proof");
  if (file instanceof File && file.size > 0) {
    try {
      proofImage = await saveImage(file, "receipt");
    } catch (e) {
      return { ok: false, message: e instanceof UploadError ? e.message : "Couldn't upload the receipt. Please try again.", errors: { proof: "Upload failed" } };
    }
  }

  const amount = plan === "annual" ? VERIFICATION_PLANS.annual.price : VERIFICATION_PLANS.property.price * propertyIds.length;
  const req = await VerificationRequest.create({
    user: session.userId,
    plan,
    properties: propertyIds,
    amount,
    payerName: payerName.slice(0, 120),
    paymentReference,
    paidOn,
    proofImage,
  });

  const planName = VERIFICATION_PLANS[plan].name;
  const rows: [string, string][] = [
    ["Realtor", `${user.name} (${user.email})`],
    ["Plan", planName + (plan === "property" ? ` × ${propertyIds.length}` : "")],
    ["Amount", formatPrice(amount)],
    ["Paid by", payerName],
    ...(paymentReference ? [["Reference", paymentReference] as [string, string]] : []),
    ...(paidOn ? [["Paid on", paidOn.toDateString()] as [string, string]] : []),
  ];
  void sendMail(
    adminEmail(),
    `Verification payment: ${user.name} · ${formatPrice(amount)}`,
    apartmentEmail({ brand: "found", heading: "New verification payment to confirm", intro: `${user.name} says they've paid for ${planName.toLowerCase()}. Confirm the transfer in the ${PAYMENT_ACCOUNT.bank} account, then approve or reject the request.`, rows, cta: { label: "Review request", href: `/dashboard/verification?open=${req._id}` } }),
    FROM,
  );
  void sendMail(
    user.email,
    "We've received your verification request",
    apartmentEmail({
      brand: "found",
      heading: "Thanks, your request is in",
      intro: `Hi ${user.name.split(" ")[0]}, we've received your ${planName.toLowerCase()} request for ${formatPrice(amount)}. Once we've confirmed your transfer and completed our checks, your Verified by Found badge goes live and we'll email you.`,
      rows,
      cta: { label: "Track your request", href: "/dashboard/verification" },
    }),
    FROM,
  );

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Thank you! We'll confirm your payment and update you by email, usually within 2 working days." };
}

/** Admin approves (after confirming the transfer) or rejects a verification request. */
export async function reviewVerification(id: string, approve: boolean, note = ""): Promise<Result> {
  const session = await requireUser(["admin"]);
  await connectDB();
  const req = await VerificationRequest.findById(id);
  if (!req) return { ok: false, message: "Request not found" };
  if (req.status !== "pending") return { ok: false, message: `This request was already ${req.status}` };
  const user = await User.findById(req.user).select("name email userType realtorProfile");
  if (!user) return { ok: false, message: "Realtor account no longer exists" };

  const now = new Date();
  let until: Date | null = null;
  if (approve && req.plan === "annual") {
    const current = user.realtorProfile?.verifiedUntil ? new Date(user.realtorProfile.verifiedUntil) : null;
    until = oneYearFrom(current && current > now ? current : now);
    await User.updateOne({ _id: user._id }, { $set: { "realtorProfile.verified": true, "realtorProfile.verifiedUntil": until } });
    await applyRealtorBadge(String(user._id), until);
  } else if (approve) {
    await Property.updateMany(
      { _id: { $in: req.properties }, owner: user._id },
      { $set: { verification: { verified: true, via: "property", verifiedAt: now, until: null } } },
    );
  }

  req.status = approve ? "approved" : "rejected";
  req.adminNote = note.slice(0, 500) || undefined;
  req.reviewedBy = session.userId;
  req.reviewedAt = now;
  await req.save();

  const planName = VERIFICATION_PLANS[req.plan as VerificationPlan].name;
  void sendMail(
    user.email,
    approve ? "You're verified on Found" : "About your verification request",
    apartmentEmail(
      approve
        ? {
            brand: "found",
            heading: req.plan === "annual" ? "You're now a verified realtor" : "Your listings are verified",
            intro:
              req.plan === "annual"
                ? `Congratulations ${user.name.split(" ")[0]}! Your payment is confirmed and every listing you publish now carries the Verified by Found badge until ${until!.toDateString()}.`
                : `Congratulations ${user.name.split(" ")[0]}! Your payment is confirmed and ${req.properties.length} listing${req.properties.length === 1 ? " now carries" : "s now carry"} the Verified by Found badge.`,
            cta: { label: "View your listings", href: "/dashboard/listings" },
          }
        : {
            brand: "found",
            heading: "We couldn't approve your request yet",
            intro: `Hi ${user.name.split(" ")[0]}, we weren't able to approve your ${planName.toLowerCase()} request.`,
            note: note || "We couldn't match your transfer. Reply to this email with your payment receipt and we'll sort it out.",
            cta: { label: "View request", href: "/dashboard/verification" },
          },
    ),
    FROM,
  );

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/properties");
  revalidatePath("/");
  return { ok: true, message: approve ? "Approved — the badge is live" : "Request rejected and the realtor has been told" };
}
