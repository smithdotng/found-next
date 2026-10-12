"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { connectDB } from "@/lib/db";
import { FractionalDistribution, FractionalHolding, FractionalOffering, FractionalOrder, FractionalResale, User } from "@/lib/models";
import { getSession, requireUser } from "@/lib/session";
import { EMAIL_RE, NG_PHONE, formatPrice } from "@/lib/format";
import { saveImage, saveImages, filesFrom, UploadError } from "@/lib/uploads";
import { saveDocument, DocumentError } from "@/lib/private-docs";
import { adminEmail, apartmentEmail, sendMail } from "@/lib/mailer";
import { PAYMENT_ACCOUNT } from "@/lib/verification";
import { investedLast12Months, isId, releaseReservation } from "@/lib/fractional-data";
import {
  DEFAULT_FEES, FRACTIONAL_OPEN, RESERVATION_HOURS, RETAIL_ANNUAL_LIMIT_PERCENT, TRADABLE_STATUSES, isOpen, primaryQuote, resaleProceeds, splitDistribution,
} from "@/lib/fractional";
import type { FormState } from "./public";

type Result = { ok: boolean; message: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => {
  const v = s(fd, k).replace(/[,\s₦]/g, "");
  return v === "" ? undefined : Number(v);
};
const FROM = "Found Fractional";
const mail = (to: string, subject: string, o: Parameters<typeof apartmentEmail>[0]) => void sendMail(to, subject, apartmentEmail({ brand: "fractional", ...o }), FROM);
const touch = () => {
  revalidatePath("/fractional", "layout");
  revalidatePath("/dashboard", "layout");
};

function readBank(fd: FormData) {
  const details = { bankName: s(fd, "bankName"), accountNumber: s(fd, "accountNumber").replace(/\D/g, ""), accountName: s(fd, "accountName") };
  const error: Record<string, string> = {};
  if (!details.bankName) error.bankName = "Enter your bank";
  if (!/^\d{10}$/.test(details.accountNumber)) error.accountNumber = "Enter the 10-digit account number";
  if (!details.accountName) error.accountName = "Enter the account name";
  return { details, error: Object.keys(error).length ? error : null };
}

function validateAccount(fd: FormData) {
  const errors: Record<string, string> = {};
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const phone = s(fd, "phone").replace(/\s/g, "");
  const password = String(fd.get("password") ?? "");
  if (!name) errors.name = "Enter your full name";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
  if (!NG_PHONE.test(phone)) errors.phone = "Enter a valid Nigerian phone number (e.g. 08031234567)";
  if (password.length < 8) errors.password = "Password must be at least 8 characters long";
  if (!fd.get("terms")) errors.terms = "Please accept the terms to continue";
  return { errors, name, email, phone, password };
}

async function signIn(user: { _id: unknown; userType: "investor" | "developer"; name: string; email: string }) {
  const session = await getSession();
  session.userId = String(user._id);
  session.userType = user.userType;
  session.userName = user.name;
  session.userEmail = user.email;
  await session.save();
}

const safeNext = (v: string) => (v.startsWith("/") && !v.startsWith("//") ? v : "");

/* ---------- Accounts ---------- */

export async function registerInvestor(_prev: FormState, fd: FormData): Promise<FormState> {
  const { errors, name, email, phone, password } = validateAccount(fd);
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };
  await connectDB();
  if (await User.findOne({ email })) return { ok: false, message: "Email already registered", errors: { email: "Email already registered — sign in instead. Any Found account can invest." } };
  const user = await User.create({
    name, email, phone, password, userType: "investor",
    newsletter: fd.get("newsletter") === "on",
    investorProfile: { kycStatus: "none" },
    preferences: { emailInquiries: true, emailTransactions: true, weeklyNewsletter: false, marketingEmails: fd.get("newsletter") === "on" },
  });
  mail(email, "Welcome to Found Fractional", {
    heading: `Welcome, ${name.split(" ")[0]}`,
    intro: "Thanks for registering your interest in Found Fractional. Complete your investor profile now and we'll let you know as soon as offerings open. Found Fractional isn't open for investment yet and no money is being accepted.",
    cta: { label: "Complete your investor profile", href: "/dashboard/investments/profile" },
  });
  await signIn({ _id: user._id, userType: "investor", name, email });
  const next = safeNext(s(fd, "next"));
  redirect(`/dashboard/investments/profile?notice=Welcome!+Complete+your+investor+profile+to+start+investing.${next ? `&next=${encodeURIComponent(next)}` : ""}`);
}

export async function registerDeveloper(_prev: FormState, fd: FormData): Promise<FormState> {
  const { errors, name, email, phone, password } = validateAccount(fd);
  const company = s(fd, "company");
  const rcNumber = s(fd, "rcNumber");
  if (!company) errors.company = "Enter your company name";
  if (!rcNumber) errors.rcNumber = "Enter your CAC RC number";
  if (!s(fd, "state")) errors.state = "Choose a state";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };
  await connectDB();
  if (await User.findOne({ email })) return { ok: false, message: "Email already registered", errors: { email: "Email already registered — sign in instead." } };
  const user = await User.create({
    name, email, phone, password, userType: "developer",
    developerProfile: {
      company, rcNumber,
      address: s(fd, "address"), city: s(fd, "city"), state: s(fd, "state"),
      website: s(fd, "website"), projectsCompleted: n(fd, "projectsCompleted") || 0,
      about: s(fd, "about").slice(0, 1200), status: "pending",
    },
    preferences: { emailInquiries: true, emailTransactions: true, weeklyNewsletter: false, marketingEmails: false },
  });
  mail(adminEmail(), `New Fractional developer: ${company}`, {
    heading: "A developer applied to raise on Found Fractional",
    intro: `${name} of ${company} wants to raise capital through Found Fractional. Vet the company before approving any offering.`,
    rows: [["Company", company], ["RC number", rcNumber], ["Location", `${s(fd, "city")}, ${s(fd, "state")}`], ["Projects completed", String(n(fd, "projectsCompleted") || 0)], ["Phone", phone], ["Email", email]],
    cta: { label: "Review developer", href: "/dashboard/investors?tab=developers" },
  });
  mail(email, "Your Found Fractional developer application", {
    heading: `Thanks, ${name.split(" ")[0]}`,
    intro: "We've received your application. Our team will review your company and track record and may call you. Found Fractional is in pre-launch and not yet registered with the SEC, so no capital can be raised yet, but you can prepare a draft offering.",
    note: "Next steps: 1) We review your company. 2) You prepare an offering with its SPV, title and valuation documents. 3) Once the platform is registered and open, we review the offering for publication.",
    cta: { label: "Start an offering", href: "/dashboard/offerings/new" },
  });
  await signIn({ _id: user._id, userType: "developer", name, email });
  redirect("/dashboard/offerings?notice=Application+received.+Start+drafting+your+first+offering.");
}

/* ---------- Investor profile (KYC) ---------- */

export async function saveInvestorProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser();
  if (session.userType === "admin") return { ok: false, message: "Admin accounts can't invest." };
  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return { ok: false, message: "Account not found." };
  const ip = user.investorProfile ?? {};
  const errors: Record<string, string> = {};
  const category = s(fd, "category");
  const annualIncome = n(fd, "annualIncome");
  if (!["retail", "sophisticated", "hnw"].includes(category)) errors.category = "Choose the category that describes you";
  if (category === "retail" && !(annualIncome && annualIncome > 0)) errors.annualIncome = "Enter your approximate annual income — it sets your investment limit";
  if (!s(fd, "occupation")) errors.occupation = "Enter your occupation";
  if (!s(fd, "address")) errors.address = "Enter your residential address";
  if (!s(fd, "state")) errors.state = "Choose your state";
  if (!s(fd, "idType")) errors.idType = "Choose an ID type";
  if (!fd.get("risk")) errors.risk = "Please confirm you understand the risks";
  const bank = readBank(fd);
  if (bank.error) Object.assign(errors, bank.error);
  const file = fd.get("idDocument");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !ip.idDocument?.key) errors.idDocument = "Upload a clear photo or scan of your ID";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  let idDocument = ip.idDocument;
  if (hasFile) {
    try {
      idDocument = await saveDocument(file as File);
    } catch (e) {
      return { ok: false, message: e instanceof DocumentError ? e.message : "Couldn't upload your ID. Please try again.", errors: { idDocument: "Upload failed" } };
    }
  }
  // Changing identity details after approval sends the profile back for review.
  const identityChanged = hasFile || s(fd, "idType") !== ip.idType || category !== ip.category;
  const kycStatus = ip.kycStatus === "approved" && !identityChanged ? "approved" : "pending";
  user.investorProfile = {
    ...(ip.toObject?.() ?? ip),
    category,
    annualIncome: annualIncome ?? undefined,
    occupation: s(fd, "occupation").slice(0, 120),
    address: s(fd, "address").slice(0, 300),
    city: s(fd, "city").slice(0, 80),
    state: s(fd, "state"),
    idType: s(fd, "idType"),
    idDocument,
    kycStatus,
    kycSubmittedAt: kycStatus === "pending" ? new Date() : ip.kycSubmittedAt,
    riskAcknowledgedAt: ip.riskAcknowledgedAt ?? new Date(),
    bankDetails: bank.details,
  };
  await user.save();
  if (kycStatus === "pending") {
    mail(adminEmail(), `Investor to verify: ${user.name}`, {
      heading: "An investor profile needs checking",
      intro: `${user.name} submitted their Found Fractional investor details. Check their ID before confirming any of their payments.`,
      rows: [["Category", category], ["Occupation", s(fd, "occupation")], ["State", s(fd, "state")], ["Email", user.email]],
      cta: { label: "Review investor", href: "/dashboard/investors" },
    });
  }
  touch();
  const next = safeNext(s(fd, "next"));
  if (next) redirect(`${next}${next.includes("?") ? "&" : "?"}notice=Profile+saved.+You+can+invest+now.`);
  return { ok: true, message: kycStatus === "pending" ? "Saved. We'll verify your ID shortly — you can reserve units meanwhile." : "Profile updated." };
}

/**
 * Holds `units` on an offering or resale listing. The update only applies if the counts are
 * unchanged since they were read, so concurrent buyers can't oversell; retries on contention.
 */
async function reserveUnits(model: typeof FractionalOffering, id: unknown, totalField: "totalUnits" | "units", units: number, extra: Record<string, unknown> = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await model.findOne({ _id: id, ...extra, ...(totalField === "units" ? { status: "listed" } : {}) }).select(`${totalField} unitsSold unitsReserved`).lean<Record<string, number>>();
    if (!doc || doc.unitsSold + doc.unitsReserved + units > doc[totalField]) return false;
    const r = await model.updateOne({ _id: id, unitsSold: doc.unitsSold, unitsReserved: doc.unitsReserved, [totalField]: doc[totalField] }, { $inc: { unitsReserved: units } });
    if (r.modifiedCount) return true;
  }
  return false;
}

/* ---------- Investing ---------- */

export async function createOrder(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  const offeringId = s(fd, "offeringId");
  const resaleId = s(fd, "resaleId");
  const back = s(fd, "back") || "/fractional";
  if (!session.userId) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (!FRACTIONAL_OPEN) return { ok: false, message: "Found Fractional isn't open for investment yet. We'll email you when it is." };
  if (session.userType === "admin") return { ok: false, message: "Admin accounts can't invest. Sign in with an investor account." };
  const units = Math.floor(n(fd, "units") ?? 0);
  if (!isId(offeringId) || (resaleId && !isId(resaleId))) return { ok: false, message: "This offering is no longer available." };
  if (units < 1) return { ok: false, message: "Choose how many units you want." };
  if (!fd.get("agree")) return { ok: false, message: "Tick the box to confirm you've read the offering documents and risks." };

  await connectDB();
  const [user, offering] = await Promise.all([User.findById(session.userId).select("name email investorProfile"), FractionalOffering.findById(offeringId)]);
  if (!user || !offering) return { ok: false, message: "This offering is no longer available." };
  const kyc = user.investorProfile?.kycStatus ?? "none";
  if (kyc === "none" || kyc === "rejected") redirect(`/dashboard/investments/profile?next=${encodeURIComponent(back)}&error=Complete+your+investor+profile+first.`);
  if (String(offering.developer) === session.userId) return { ok: false, message: "You can't invest in your own offering." };

  // Holdings and open orders count towards the per-investor cap.
  const [holding, openUnits] = await Promise.all([
    FractionalHolding.findOne({ offering: offeringId, investor: session.userId }).select("units"),
    FractionalOrder.aggregate([
      { $match: { offering: offering._id, investor: user._id, status: { $in: ["pending_payment", "payment_submitted"] } } },
      { $group: { _id: null, units: { $sum: "$units" } } },
    ]),
  ]);
  const already = (holding?.units ?? 0) + (openUnits[0]?.units ?? 0);
  if (offering.maxUnitsPerInvestor && already + units > offering.maxUnitsPerInvestor)
    return { ok: false, message: `Each investor can hold up to ${offering.maxUnitsPerInvestor} units in this offering. You have ${already} already.` };

  let unitPrice = offering.unitPrice;
  let resale: { _id: unknown; seller: unknown } | null = null;
  if (resaleId) {
    if (!TRADABLE_STATUSES.includes(offering.status) || !offering.resaleEnabled) return { ok: false, message: "Units in this offering can't be traded right now." };
    const r = await FractionalResale.findOne({ _id: resaleId, offering: offeringId, status: "listed" });
    if (!r) return { ok: false, message: "These units have just been sold. Try another listing." };
    if (String(r.seller) === session.userId) return { ok: false, message: "That's your own listing." };
    unitPrice = r.pricePerUnit;
    resale = r;
  } else {
    if (!isOpen(offering)) return { ok: false, message: "This offering isn't open for investment right now." };
    if (units < (offering.minUnits || 1)) return { ok: false, message: `The minimum is ${offering.minUnits} units.` };
  }

  const q = resale ? { amount: unitPrice * units, fee: 0, total: unitPrice * units } : primaryQuote(unitPrice, units, offering.fees?.investor ?? DEFAULT_FEES.investor);

  if ((user.investorProfile?.category ?? "retail") === "retail") {
    const limit = Math.floor(((user.investorProfile?.annualIncome ?? 0) * RETAIL_ANNUAL_LIMIT_PERCENT) / 100);
    const used = await investedLast12Months(session.userId);
    if (used + q.amount > limit)
      return {
        ok: false,
        message: `As a retail investor you can invest up to ${formatPrice(limit)} (${RETAIL_ANNUAL_LIMIT_PERCENT}% of your declared income) in 12 months. You have ${formatPrice(Math.max(0, limit - used))} left. Update your investor profile if your circumstances have changed.`,
      };
  }

  // Reserve with compare-and-set so two buyers can never take the same units.
  const reserved = resale ? await reserveUnits(FractionalResale, resale._id, "units", units) : await reserveUnits(FractionalOffering, offering._id, "totalUnits", units, { status: "live" });
  if (!reserved) return { ok: false, message: "Not enough units left for that amount. Try fewer units." };

  const expiresAt = new Date(Date.now() + RESERVATION_HOURS * 3600_000);
  const order = await FractionalOrder.create({
    offering: offering._id,
    offeringTitle: offering.title,
    investor: user._id,
    source: resale ? "resale" : "primary",
    resale: resale?._id,
    seller: resale?.seller,
    units,
    unitPrice,
    ...q,
    expiresAt,
    history: [{ status: "pending_payment", by: user.name, note: resale ? "Bought on the resale market" : undefined }],
  });

  const acct = !resale && offering.paymentAccount?.accountNumber ? offering.paymentAccount : { bankName: PAYMENT_ACCOUNT.bank, accountName: PAYMENT_ACCOUNT.accountName, accountNumber: PAYMENT_ACCOUNT.accountNumber };
  mail(user.email, `Your ${units} units in ${offering.title} are reserved`, {
    heading: "Units reserved — payment details",
    intro: `We're holding ${units} units for you for ${RESERVATION_HOURS} hours. Transfer the amount below and tell us once you've paid, and we'll confirm your units.`,
    rows: [
      ["Order", order.reference],
      ["Amount to transfer", formatPrice(q.total)],
      ["Bank", acct.bankName],
      ["Account name", acct.accountName],
      ["Account number", acct.accountNumber],
      ["Narration", order.reference],
    ],
    cta: { label: "I've paid — submit details", href: `/dashboard/investments/orders/${order.reference}` },
  });
  touch();
  redirect(`/dashboard/investments/orders/${order.reference}?notice=Units+reserved+for+${RESERVATION_HOURS}+hours.`);
}

export async function submitOrderPayment(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser();
  await connectDB();
  const order = await FractionalOrder.findOne({ reference: s(fd, "reference"), investor: session.userId });
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status !== "pending_payment") return { ok: false, message: "This order can't take a payment any more." };
  const errors: Record<string, string> = {};
  const payerName = s(fd, "payerName");
  if (!payerName) errors.payerName = "Enter the name on the account you paid from";
  const paidOn = s(fd, "paidOn") ? new Date(s(fd, "paidOn")) : new Date();
  if (Number.isNaN(paidOn.getTime())) errors.paidOn = "Enter a valid date";
  if (Object.keys(errors).length) return { ok: false, message: "Please check the highlighted fields.", errors };
  let proofImage: string | undefined;
  const file = fd.get("proof");
  if (file instanceof File && file.size > 0) {
    try {
      proofImage = await saveImage(file, "receipt");
    } catch (e) {
      return { ok: false, message: e instanceof UploadError ? e.message : "Couldn't upload the receipt.", errors: { proof: "Upload failed" } };
    }
  }
  order.status = "payment_submitted";
  order.payment = { payerName: payerName.slice(0, 120), reference: s(fd, "paymentReference").slice(0, 120), paidOn, proofImage, submittedAt: new Date() };
  order.history.push({ status: "payment_submitted", by: session.userName });
  await order.save();
  mail(adminEmail(), `Fractional payment to confirm: ${order.reference}`, {
    heading: "An investor says they've paid",
    intro: `${session.userName} submitted a transfer for ${order.units} units in ${order.offeringTitle}. Check the account before confirming.`,
    rows: [["Order", order.reference], ["Amount", formatPrice(order.total)], ["Paid by", payerName], ["Reference", s(fd, "paymentReference") || "—"], ["Type", order.source === "resale" ? "Resale" : "Primary"]],
    cta: { label: "Confirm payment", href: "/dashboard/fractional-orders?status=payment_submitted" },
  });
  touch();
  return { ok: true, message: "Thanks! We'll confirm your units as soon as the transfer reaches the account, usually within one working day." };
}

export async function cancelOrder(reference: string): Promise<Result> {
  const session = await requireUser();
  await connectDB();
  const isAdmin = session.userType === "admin";
  const order = await FractionalOrder.findOneAndUpdate(
    { reference, status: { $in: isAdmin ? ["pending_payment", "payment_submitted"] : ["pending_payment"] }, ...(isAdmin ? {} : { investor: session.userId }) },
    { $set: { status: "cancelled" }, $push: { history: { status: "cancelled", by: session.userName } } },
  );
  if (!order) return { ok: false, message: "This order can't be cancelled." };
  await releaseReservation(order);
  touch();
  return { ok: true, message: "Order cancelled and units released." };
}

/* ---------- Resale market ---------- */

export async function listUnitsForSale(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser();
  const offeringId = s(fd, "offeringId");
  const units = Math.floor(n(fd, "units") ?? 0);
  const price = Math.round(n(fd, "pricePerUnit") ?? 0);
  if (!FRACTIONAL_OPEN) return { ok: false, message: "Transfers between investors aren't available yet." };
  if (!isId(offeringId)) return { ok: false, message: "Choose a holding." };
  if (units < 1) return { ok: false, message: "Enter how many units to sell.", errors: { units: "At least 1" } };
  await connectDB();
  const [offering, user] = await Promise.all([FractionalOffering.findById(offeringId).select("title unitPrice status resaleEnabled fees"), User.findById(session.userId).select("investorProfile.bankDetails")]);
  if (!offering || !TRADABLE_STATUSES.includes(offering.status) || !offering.resaleEnabled)
    return { ok: false, message: "Units in this offering can be sold once its raise has closed." };
  if (!user?.investorProfile?.bankDetails?.accountNumber) return { ok: false, message: "Add your payout bank account in your investor profile first." };
  if (price < Math.round(offering.unitPrice * 0.25) || price > offering.unitPrice * 5)
    return { ok: false, message: `Set a price between ${formatPrice(Math.round(offering.unitPrice * 0.25))} and ${formatPrice(offering.unitPrice * 5)} per unit.`, errors: { pricePerUnit: "Out of range" } };
  // Compare-and-set on the holding so the same units can't be listed twice.
  const h = await FractionalHolding.findOne({ offering: offeringId, investor: session.userId }).select("units unitsListed").lean<{ units: number; unitsListed: number }>();
  const held = h && h.unitsListed + units <= h.units
    ? (await FractionalHolding.updateOne({ offering: offeringId, investor: session.userId, units: h.units, unitsListed: h.unitsListed }, { $inc: { unitsListed: units } })).modifiedCount
    : 0;
  if (!held) return { ok: false, message: "You don't have that many units free to sell.", errors: { units: "Too many" } };
  await FractionalResale.create({ offering: offeringId, seller: session.userId, units, pricePerUnit: price });
  const p = resaleProceeds(price, units, offering.fees?.resale ?? DEFAULT_FEES.resale);
  touch();
  return { ok: true, message: `Listed ${units} units at ${formatPrice(price)} each. If they all sell you'll receive ${formatPrice(p.net)} after Found's ${offering.fees?.resale ?? DEFAULT_FEES.resale}% fee.` };
}

export async function withdrawListing(id: string): Promise<Result> {
  const session = await requireUser();
  await connectDB();
  const r = await FractionalResale.findOne({ _id: id, seller: session.userId, status: "listed" });
  if (!r) return { ok: false, message: "Listing not found." };
  if (r.unitsReserved > 0) return { ok: false, message: "A buyer is paying for some of these units. Try again once their order completes or expires." };
  const remaining = r.units - r.unitsSold;
  r.status = r.unitsSold > 0 ? "sold" : "withdrawn";
  r.units = r.unitsSold || r.units;
  await r.save();
  await FractionalHolding.updateOne({ offering: r.offering, investor: session.userId }, { $inc: { unitsListed: -remaining } });
  touch();
  return { ok: true, message: "Listing withdrawn." };
}

/* ---------- Developer: offerings ---------- */

async function uniqueSlug(title: string, id?: string) {
  const base = slugify(title, { lower: true, strict: true }).slice(0, 70) || "offering";
  let slug = base;
  for (let i = 2; await FractionalOffering.exists({ slug, ...(id ? { _id: { $ne: id } } : {}) }); i++) slug = `${base}-${i}`;
  return slug;
}

export async function saveOffering(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser(["developer", "admin"]);
  const isAdmin = session.userType === "admin";
  const id = s(fd, "id");
  await connectDB();
  const existing = id ? await FractionalOffering.findById(id) : null;
  if (id && (!existing || (!isAdmin && String(existing.developer) !== session.userId))) return { ok: false, message: "Offering not found." };
  if (existing && !isAdmin && !["draft", "changes_requested"].includes(existing.status))
    return { ok: false, message: "This offering is locked while it's in review or live. Post an update instead, or contact Found for changes." };

  const errors: Record<string, string> = {};
  const title = s(fd, "title");
  const totalValue = n(fd, "totalValue") ?? 0;
  const totalUnits = Math.floor(n(fd, "totalUnits") ?? 0);
  const unitPrice = Math.round(n(fd, "unitPrice") ?? 0);
  const minUnits = Math.max(1, Math.floor(n(fd, "minUnits") ?? 1));
  const maxPer = n(fd, "maxUnitsPerInvestor");
  const softCap = Math.min(100, Math.max(10, n(fd, "softCapPercent") ?? 80));
  if (!title) errors.title = "Give the offering a name";
  if (!s(fd, "summary")) errors.summary = "Add a one-line summary";
  if (!s(fd, "state")) errors.state = "Choose a state";
  if (!(totalValue > 0)) errors.totalValue = "Enter the valuation";
  if (totalUnits < 10) errors.totalUnits = "Offer at least 10 units";
  if (unitPrice < 1000) errors.unitPrice = "Unit price must be at least ₦1,000";
  if (totalUnits && unitPrice && totalValue && Math.abs(totalUnits * unitPrice - totalValue) > totalValue * 0.02)
    errors.unitPrice = `Units × price (${formatPrice(totalUnits * unitPrice)}) should match the amount being raised (${formatPrice(totalValue)})`;
  if (maxPer !== undefined && maxPer < minUnits) errors.maxUnitsPerInvestor = "Must be at least the minimum";
  if (existing && totalUnits < existing.unitsSold + existing.unitsReserved) errors.totalUnits = `${existing.unitsSold + existing.unitsReserved} units are already taken`;
  if (existing && existing.unitsSold > 0 && unitPrice !== existing.unitPrice) errors.unitPrice = "Unit price can't change once units have sold";
  const returnTypes = fd.getAll("returnTypes").map(String).filter((v) => v === "capital_growth" || v === "rental_income");
  if (!returnTypes.length) errors.returnTypes = "Choose at least one way investors earn";
  const opensAt = s(fd, "opensAt") ? new Date(s(fd, "opensAt")) : undefined;
  const closesAt = s(fd, "closesAt") ? new Date(s(fd, "closesAt")) : undefined;
  if (opensAt && closesAt && closesAt <= opensAt) errors.closesAt = "Must be after the opening date";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  let newImages: string[] = [];
  try {
    newImages = await saveImages(filesFrom(fd, "images"), "project");
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Couldn't upload the photos.", errors: { images: "Upload failed" } };
  }
  const newDocs: { key: string; name: string; contentType: string; size: number; label: string }[] = [];
  const docLabel = s(fd, "docLabel") || "Offering document";
  for (const f of filesFrom(fd, "documents")) {
    try {
      newDocs.push({ ...(await saveDocument(f)), label: docLabel });
    } catch (e) {
      return { ok: false, message: e instanceof DocumentError ? e.message : "Couldn't upload a document.", errors: { documents: "Upload failed" } };
    }
  }
  const removeImages = new Set(fd.getAll("removeImage").map(String));
  const removeDocs = new Set(fd.getAll("removeDoc").map(String));

  const date = (k: string) => (s(fd, k) ? new Date(s(fd, k)) : undefined);
  const data = {
    title,
    summary: s(fd, "summary").slice(0, 300),
    description: s(fd, "description").slice(0, 20000),
    assetType: s(fd, "assetType") || "residential",
    stage: s(fd, "stage") === "income" ? "income" : "off_plan",
    returnTypes,
    location: { address: s(fd, "address"), city: s(fd, "city"), state: s(fd, "state"), lga: s(fd, "lga") },
    videoUrl: s(fd, "videoUrl"),
    spv: { name: s(fd, "spvName"), rcNumber: s(fd, "spvRc"), trustee: s(fd, "trustee"), titleDocument: s(fd, "titleDocument") },
    paymentAccount: { bankName: s(fd, "payBank"), accountName: s(fd, "payAccountName"), accountNumber: s(fd, "payAccountNumber").replace(/\D/g, "") },
    totalValue, totalUnits, unitPrice, minUnits,
    maxUnitsPerInvestor: maxPer ? Math.floor(maxPer) : undefined,
    softCapPercent: softCap,
    opensAt, closesAt,
    projections: {
      rentalYield: n(fd, "rentalYield"),
      appreciation: n(fd, "appreciation"),
      holdMonths: n(fd, "holdMonths"),
      completionDate: date("completionDate"),
      payoutFrequency: s(fd, "payoutFrequency") || "quarterly",
      exitStrategy: s(fd, "exitStrategy").slice(0, 2000),
    },
    risk: ["low", "moderate", "high"].includes(s(fd, "risk")) ? s(fd, "risk") : "moderate",
    riskNotes: s(fd, "riskNotes").slice(0, 4000),
    resaleEnabled: fd.get("resaleEnabled") === "on",
  };

  const doc = existing ?? new FractionalOffering({ developer: session.userId, status: "draft", fees: DEFAULT_FEES, history: [{ status: "draft", by: session.userName }] });
  Object.assign(doc, data);
  if (isAdmin) {
    // Only Found sets fees and featuring.
    doc.fees = {
      platform: n(fd, "feePlatform") ?? doc.fees?.platform ?? DEFAULT_FEES.platform,
      investor: n(fd, "feeInvestor") ?? doc.fees?.investor ?? DEFAULT_FEES.investor,
      management: n(fd, "feeManagement") ?? doc.fees?.management ?? DEFAULT_FEES.management,
      resale: n(fd, "feeResale") ?? doc.fees?.resale ?? DEFAULT_FEES.resale,
    };
    doc.featured = fd.get("featured") === "on";
    const devId = s(fd, "developerId");
    if (!existing && isId(devId)) doc.developer = devId;
  }
  if (!existing || existing.isModified("title")) doc.slug = existing?.status === "draft" || !existing ? await uniqueSlug(title, id || undefined) : doc.slug;
  doc.images = [...(doc.images ?? []).filter((u: string) => !removeImages.has(u)), ...newImages].slice(0, 20);
  doc.documents = (doc.documents ?? []).filter((d: { _id: unknown }) => !removeDocs.has(String(d._id)));
  for (const d of newDocs) doc.documents.push(d);
  await doc.save();
  touch();
  if (!existing) redirect(`/dashboard/offerings/${doc._id}?notice=Draft+saved.+Add+photos+and+documents,+then+submit+for+review.`);
  return { ok: true, message: "Saved." };
}

const REQUIRED_DOCS_HINT = "information memorandum, title document, valuation report and SPV incorporation documents";

export async function submitOffering(id: string): Promise<Result> {
  const session = await requireUser(["developer", "admin"]);
  await connectDB();
  const o = await FractionalOffering.findOne({ _id: id, ...(session.userType === "admin" ? {} : { developer: session.userId }) });
  if (!o) return { ok: false, message: "Offering not found." };
  if (!["draft", "changes_requested"].includes(o.status)) return { ok: false, message: "Already submitted." };
  const missing: string[] = [];
  if (!o.images?.length) missing.push("at least one photo");
  if ((o.documents?.length ?? 0) < 2) missing.push(`documents (${REQUIRED_DOCS_HINT})`);
  if (!o.description || o.description.length < 200) missing.push("a fuller description (200+ characters)");
  if (!o.spv?.name) missing.push("the SPV's name");
  if (!o.projections?.exitStrategy) missing.push("an exit strategy");
  if (missing.length) return { ok: false, message: `Before submitting, add ${missing.join(", ")}.` };
  o.status = "in_review";
  o.history.push({ status: "in_review", by: session.userName });
  await o.save();
  mail(adminEmail(), `Fractional offering to review: ${o.title}`, {
    heading: "An offering was submitted for review",
    intro: `${session.userName} submitted "${o.title}" to raise ${formatPrice(o.totalUnits * o.unitPrice)} on Found Fractional. Verify the title, valuation and SPV before it goes live.`,
    rows: [["Units", `${o.totalUnits.toLocaleString()} × ${formatPrice(o.unitPrice)}`], ["Location", `${o.location?.city ?? ""}, ${o.location?.state ?? ""}`], ["Stage", o.stage]],
    cta: { label: "Review offering", href: `/dashboard/offerings/${o._id}` },
  });
  touch();
  return { ok: true, message: "Submitted. Found will review it, usually within 3 working days." };
}

export async function postOfferingUpdate(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser(["developer", "admin"]);
  await connectDB();
  const o = await FractionalOffering.findOne({ _id: s(fd, "offeringId"), ...(session.userType === "admin" ? {} : { developer: session.userId }) });
  if (!o) return { ok: false, message: "Offering not found." };
  const title = s(fd, "title");
  if (!title) return { ok: false, message: "Give the update a title.", errors: { title: "Required" } };
  let image: string | undefined;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      image = await saveImage(file, "project");
    } catch (e) {
      return { ok: false, message: e instanceof UploadError ? e.message : "Couldn't upload the photo." };
    }
  }
  const progress = n(fd, "progress");
  o.updates.push({ title: title.slice(0, 160), body: s(fd, "body").slice(0, 5000), progress: progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined, image, postedBy: session.userId });
  await o.save();
  if (fd.get("notify") === "on") {
    const holders = await FractionalHolding.find({ offering: o._id, units: { $gt: 0 } }).populate("investor", "email").lean<{ investor: { email: string } }[]>();
    for (const h of holders) {
      mail(h.investor.email, `Update on ${o.title}: ${title}`, {
        heading: title,
        intro: s(fd, "body").slice(0, 600) || `There's a new update on ${o.title}.`,
        rows: progress !== undefined ? [["Progress", `${progress}%`]] : undefined,
        cta: { label: "Read the update", href: `/fractional/${o.slug}#updates` },
      });
    }
  }
  touch();
  return { ok: true, message: "Update posted." };
}

/* ---------- Admin ---------- */

export async function reviewOffering(id: string, decision: "live" | "changes_requested", note?: string): Promise<Result> {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const o = await FractionalOffering.findById(id).populate("developer", "name email userType developerProfile.status");
  if (!o) return { ok: false, message: "Offering not found." };
  if (decision === "live") {
    if (!["in_review", "changes_requested", "draft"].includes(o.status)) return { ok: false, message: "Only offerings in review can go live." };
    if (o.developer?.userType === "developer" && o.developer.developerProfile?.status !== "approved")
      return { ok: false, message: "Approve the developer on the Investors page first." };
    o.status = "live";
    o.goLiveAt = new Date();
  } else {
    o.status = "changes_requested";
  }
  o.reviewNote = note?.slice(0, 1000) || undefined;
  o.reviewedAt = new Date();
  o.reviewedBy = admin.userId;
  o.history.push({ status: o.status, by: admin.userName, note });
  await o.save();
  if (o.developer?.email) {
    mail(o.developer.email, decision === "live" ? `${o.title} is live on Found Fractional` : `Changes needed on ${o.title}`, {
      heading: decision === "live" ? "Your offering is open to investors" : "We need a few changes before going live",
      intro: decision === "live" ? `"${o.title}" passed review and is now open for investment.` : `We reviewed "${o.title}" and need some changes before it can go live.`,
      note,
      cta: decision === "live" ? { label: "View offering", href: `/fractional/${o.slug}` } : { label: "Edit offering", href: `/dashboard/offerings/${o._id}` },
    });
  }
  touch();
  return { ok: true, message: decision === "live" ? "Offering is live." : "Sent back to the developer." };
}

/** Closes a raise. Below the soft cap the raise is cancelled and paid investors are refunded. */
export async function closeRaise(id: string): Promise<Result> {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const o = await FractionalOffering.findById(id);
  if (!o || !["live", "funded"].includes(o.status)) return { ok: false, message: "Only open or funded raises can be closed." };
  const pending = await FractionalOrder.find({ offering: id, source: "primary", status: { $in: ["pending_payment", "payment_submitted"] } });
  if (pending.some((p: { status: string }) => p.status === "payment_submitted"))
    return { ok: false, message: "Confirm or cancel the payments waiting to be checked first." };
  for (const p of pending) await cancelOrder(p.reference);
  const fresh = await FractionalOffering.findById(id);
  const softCapUnits = Math.ceil((fresh.totalUnits * fresh.softCapPercent) / 100);
  const cancelled = fresh.unitsSold < softCapUnits;
  fresh.status = cancelled ? "cancelled" : "active";
  fresh.closedAt = new Date();
  fresh.history.push({ status: fresh.status, by: admin.userName, note: cancelled ? "Soft cap not met — refunds due" : undefined });
  await fresh.save();
  if (cancelled) {
    const paid = await FractionalOrder.find({ offering: id, status: "confirmed" }).populate("investor", "email name");
    for (const p of paid) {
      mail(p.investor.email, `${fresh.title} did not reach its target — you'll be refunded`, {
        heading: "Your investment will be refunded in full",
        intro: `"${fresh.title}" closed below its minimum raise, so it won't go ahead. Found will refund the ${formatPrice(p.total)} you paid to your payout account.`,
        rows: [["Order", p.reference]],
      });
    }
  }
  touch();
  return { ok: true, message: cancelled ? "Raise cancelled (below soft cap). Record each refund on Fractional orders." : "Raise closed. The offering is now active." };
}

export async function markExited(id: string): Promise<Result> {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const o = await FractionalOffering.findOne({ _id: id, status: "active" });
  if (!o) return { ok: false, message: "Only active offerings can be marked as exited." };
  await FractionalResale.updateMany({ offering: id, status: "listed", unitsReserved: 0 }, { $set: { status: "withdrawn" } });
  o.status = "exited";
  o.history.push({ status: "exited", by: admin.userName });
  await o.save();
  touch();
  return { ok: true, message: "Marked as exited. Declare the sale proceeds as an exit distribution." };
}

export async function setValuation(id: string, input: number | string): Promise<Result> {
  await requireUser(["admin"]);
  const unitValue = Number(String(input).replace(/[^\d.]/g, ""));
  if (!(unitValue > 0)) return { ok: false, message: "Enter a value per unit." };
  await connectDB();
  await FractionalOffering.updateOne({ _id: id }, { $set: { currentUnitValue: Math.round(unitValue), valuationDate: new Date() } });
  touch();
  return { ok: true, message: `Valuation set at ${formatPrice(unitValue)} per unit.` };
}

export async function confirmOrderPayment(id: string): Promise<Result> {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const order = await FractionalOrder.findById(id).populate("investor", "name email investorProfile.kycStatus");
  if (!order || !["pending_payment", "payment_submitted"].includes(order.status)) return { ok: false, message: "This order can't be confirmed." };
  if (order.investor?.investorProfile?.kycStatus !== "approved") return { ok: false, message: "Verify this investor's ID on the Investors page before confirming." };

  // Claim the order first so a double click can't credit units twice.
  const claimed = await FractionalOrder.updateOne(
    { _id: id, status: { $in: ["pending_payment", "payment_submitted"] } },
    {
      $set: { status: "confirmed", "payment.confirmedAt": new Date(), "payment.confirmedBy": admin.userId },
      $push: { history: { status: "confirmed", by: admin.userName } },
    },
  );
  if (!claimed.modifiedCount) return { ok: false, message: "Already handled." };

  const offering = await FractionalOffering.findById(order.offering);
  if (order.source === "primary") {
    await FractionalOffering.updateOne({ _id: order.offering }, { $inc: { unitsReserved: -order.units, unitsSold: order.units } });
    const after = await FractionalOffering.findById(order.offering).select("unitsSold totalUnits status");
    if (after.status === "live" && after.unitsSold >= after.totalUnits) {
      await FractionalOffering.updateOne({ _id: order.offering }, { $set: { status: "funded", fundedAt: new Date() }, $push: { history: { status: "funded", by: "system" } } });
    }
  } else {
    await FractionalResale.updateOne({ _id: order.resale }, { $inc: { unitsReserved: -order.units, unitsSold: order.units } });
    const r = await FractionalResale.findById(order.resale);
    if (r && r.unitsSold >= r.units) await FractionalResale.updateOne({ _id: r._id }, { $set: { status: "sold" } });
    const seller = await FractionalHolding.findOne({ offering: order.offering, investor: order.seller });
    if (seller) {
      const costOut = seller.units ? Math.round((seller.costBasis * order.units) / seller.units) : 0;
      seller.units -= order.units;
      seller.unitsListed = Math.max(0, seller.unitsListed - order.units);
      seller.costBasis = Math.max(0, seller.costBasis - costOut);
      await seller.save();
    }
    const p = resaleProceeds(order.unitPrice, order.units, offering?.fees?.resale ?? DEFAULT_FEES.resale);
    await FractionalOrder.updateOne({ _id: id }, { $set: { sellerPayout: { amount: p.net, fee: p.fee, status: "due" } } });
    const sellerUser = await User.findById(order.seller).select("email name");
    if (sellerUser) {
      mail(sellerUser.email, `You sold ${order.units} units in ${order.offeringTitle}`, {
        heading: "Your units have sold",
        intro: `A buyer paid for ${order.units} of your units. Found will send ${formatPrice(p.net)} (after the ${offering?.fees?.resale ?? DEFAULT_FEES.resale}% resale fee) to your payout account.`,
        rows: [["Order", order.reference], ["Sale price", formatPrice(p.gross)]],
        cta: { label: "View portfolio", href: "/dashboard/investments" },
      });
    }
  }
  await FractionalHolding.updateOne(
    { offering: order.offering, investor: order.investor._id },
    { $inc: { units: order.units, costBasis: order.amount }, $setOnInsert: { firstAcquiredAt: new Date(), unitsListed: 0, distributionsReceived: 0 } },
    { upsert: true },
  );
  mail(order.investor.email, `Confirmed: you own ${order.units} units in ${order.offeringTitle}`, {
    heading: "Your investment is confirmed",
    intro: `We've received your payment. ${order.units} units in ${order.offeringTitle} are now registered in your name in the property's SPV.`,
    rows: [["Order", order.reference], ["Units", String(order.units)], ["Paid", formatPrice(order.total)]],
    cta: { label: "View your portfolio", href: "/dashboard/investments" },
  });
  touch();
  return { ok: true, message: `Confirmed ${order.units} units for ${order.investor.name}.` };
}

export async function rejectOrderPayment(id: string, note: string): Promise<Result> {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const order = await FractionalOrder.findOneAndUpdate(
    { _id: id, status: "payment_submitted" },
    { $set: { status: "pending_payment", expiresAt: new Date(Date.now() + 24 * 3600_000), note }, $push: { history: { status: "pending_payment", by: admin.userName, note: `Payment not found: ${note}` } } },
  ).populate("investor", "email");
  if (!order) return { ok: false, message: "Only submitted payments can be sent back." };
  mail(order.investor.email, `We couldn't find your payment for ${order.reference}`, {
    heading: "We couldn't match your transfer",
    intro: "We haven't been able to find your transfer yet. Your units are held for another 24 hours — please check the details and resubmit.",
    note,
    cta: { label: "View order", href: `/dashboard/investments/orders/${order.reference}` },
  });
  touch();
  return { ok: true, message: "Sent back to the investor with 24 hours to resubmit." };
}

export async function recordRefund(id: string, reference: string): Promise<Result> {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const order = await FractionalOrder.findOne({ _id: id, status: "confirmed", source: "primary" });
  if (!order) return { ok: false, message: "Only confirmed primary orders can be refunded." };
  const offering = await FractionalOffering.findById(order.offering).select("status");
  if (offering?.status !== "cancelled") return { ok: false, message: "Refunds apply to cancelled raises." };
  order.status = "refunded";
  order.refund = { amount: order.total, reference: reference.slice(0, 120), at: new Date(), reason: "Raise cancelled below soft cap" };
  order.history.push({ status: "refunded", by: admin.userName, note: reference });
  await order.save();
  await FractionalHolding.updateOne({ offering: order.offering, investor: order.investor }, { $inc: { units: -order.units, costBasis: -order.amount } });
  await FractionalOffering.updateOne({ _id: order.offering }, { $inc: { unitsSold: -order.units } });
  touch();
  return { ok: true, message: "Refund recorded." };
}

export async function markSellerPaid(id: string, reference: string): Promise<Result> {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const r = await FractionalOrder.updateOne(
    { _id: id, "sellerPayout.status": "due" },
    { $set: { "sellerPayout.status": "paid", "sellerPayout.paidAt": new Date(), "sellerPayout.reference": reference.slice(0, 120) }, $push: { history: { status: "seller_paid", by: admin.userName, note: reference } } },
  );
  if (!r.modifiedCount) return { ok: false, message: "No payout due on this order." };
  touch();
  return { ok: true, message: "Seller payout recorded." };
}

export async function declareDistribution(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireUser(["admin"]);
  await connectDB();
  const o = await FractionalOffering.findById(s(fd, "offeringId"));
  if (!o || !["active", "funded", "exited"].includes(o.status)) return { ok: false, message: "Distributions are paid on funded, active or exited offerings." };
  const gross = Math.round(n(fd, "gross") ?? 0);
  if (gross <= 0) return { ok: false, message: "Enter the amount to distribute.", errors: { gross: "Required" } };
  const kind = ["rental", "exit", "other"].includes(s(fd, "kind")) ? s(fd, "kind") : "rental";
  const managementFee = kind === "rental" ? Math.round((gross * (o.fees?.management ?? DEFAULT_FEES.management)) / 100) : 0;
  const net = gross - managementFee;
  const holders = await FractionalHolding.find({ offering: o._id, units: { $gt: 0 } }).select("investor units").lean<{ investor: unknown; units: number }[]>();
  if (!holders.length) return { ok: false, message: "No investors hold units yet." };
  const split = splitDistribution(net, holders.map((h) => ({ investor: String(h.investor), units: h.units })));
  const d = await FractionalDistribution.create({
    offering: o._id, kind, period: s(fd, "period").slice(0, 60), gross, managementFee, net,
    perUnit: split.perUnit, unitsAtRecord: holders.reduce((a, h) => a + h.units, 0), note: s(fd, "note").slice(0, 1000),
    lines: split.lines, declaredBy: admin.userId,
  });
  const users = await User.find({ _id: { $in: split.lines.map((l) => l.investor) } }).select("email").lean<{ _id: unknown; email: string }[]>();
  const emails = Object.fromEntries(users.map((u) => [String(u._id), u.email]));
  for (const l of split.lines) {
    if (!emails[l.investor]) continue;
    mail(emails[l.investor], `${kind === "exit" ? "Sale proceeds" : "Income"} from ${o.title}: ${formatPrice(l.amount)}`, {
      heading: kind === "exit" ? "The property has been sold" : "A payout is on its way",
      intro: `${o.title} declared a ${kind === "exit" ? "sale" : kind === "rental" ? "rental income" : ""} distribution${d.period ? ` for ${d.period}` : ""}. Your share for ${l.units} units is ${formatPrice(l.amount)}, which Found will send to your payout account.`,
      cta: { label: "View portfolio", href: "/dashboard/investments" },
    });
  }
  touch();
  return { ok: true, message: `Declared ${formatPrice(net)} to ${split.lines.length} investors (${formatPrice(split.perUnit)} per unit).` };
}

export async function markDistributionPaid(id: string, reference: string): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const d = await FractionalDistribution.findById(id);
  if (!d) return { ok: false, message: "Distribution not found." };
  const due = d.lines.filter((l: { status: string }) => l.status === "due");
  if (!due.length) return { ok: false, message: "Everything on this distribution is already paid." };
  for (const l of due) {
    l.status = "paid";
    l.paidAt = new Date();
    l.reference = reference.slice(0, 120);
    await FractionalHolding.updateOne({ offering: d.offering, investor: l.investor }, { $inc: { distributionsReceived: l.amount } });
  }
  await d.save();
  touch();
  return { ok: true, message: `Marked ${due.length} payouts as paid.` };
}

export async function reviewInvestor(userId: string, decision: "approved" | "rejected", note?: string): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const u = await User.findById(userId);
  if (!u?.investorProfile) return { ok: false, message: "Investor not found." };
  u.investorProfile.kycStatus = decision;
  u.investorProfile.kycNote = note?.slice(0, 600) || undefined;
  u.investorProfile.kycReviewedAt = new Date();
  await u.save();
  mail(u.email, decision === "approved" ? "You're verified on Found Fractional" : "Action needed on your investor profile", {
    heading: decision === "approved" ? "Your investor profile is verified" : "We couldn't verify your details",
    intro: decision === "approved" ? "Thanks — your ID checks out. Your payments can now be confirmed as soon as they arrive." : "Please update your investor profile so we can verify you.",
    note,
    cta: { label: decision === "approved" ? "Browse offerings" : "Update profile", href: decision === "approved" ? "/fractional" : "/dashboard/investments/profile" },
  });
  touch();
  return { ok: true, message: decision === "approved" ? "Investor verified." : "Investor asked to update their details." };
}

export async function reviewDeveloper(userId: string, decision: "approved" | "rejected", note?: string): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const u = await User.findOne({ _id: userId, userType: "developer" });
  if (!u) return { ok: false, message: "Developer not found." };
  u.developerProfile.status = decision;
  u.developerProfile.reviewNote = note?.slice(0, 600) || undefined;
  u.developerProfile.reviewedAt = new Date();
  await u.save();
  mail(u.email, decision === "approved" ? "Your company is approved on Found Fractional" : "Update on your Found Fractional application", {
    heading: decision === "approved" ? "You're approved to raise on Found Fractional" : "We can't approve your application yet",
    intro: decision === "approved" ? "Our team has verified your company. Offerings you submit can now go live once they pass review." : "After reviewing your company we're unable to approve it at this time.",
    note,
    cta: { label: "Your offerings", href: "/dashboard/offerings" },
  });
  touch();
  return { ok: true, message: decision === "approved" ? "Developer approved." : "Developer rejected." };
}

export async function toggleFeatured(id: string): Promise<Result> {
  await requireUser(["admin"]);
  await connectDB();
  const o = await FractionalOffering.findById(id).select("featured");
  if (!o) return { ok: false, message: "Offering not found." };
  o.featured = !o.featured;
  await o.save();
  touch();
  return { ok: true, message: o.featured ? "Featured on /fractional." : "No longer featured." };
}
