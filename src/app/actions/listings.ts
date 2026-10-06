"use server";

import { isRealtorVerified } from "@/lib/verification";

import slugify from "slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Property, User, Inquiry, Promotion, FeaturedProperty } from "@/lib/models";
import { requireUser, type AuthedSession } from "@/lib/session";
import { filesFrom, removeUpload, saveImages, UploadError } from "@/lib/uploads";
import emailService from "@/lib/email";
import type { FormState } from "./public";
import type { PropertyStatus } from "@/lib/types";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => {
  const v = parseFloat(s(fd, k).replace(/,/g, ""));
  return Number.isFinite(v) ? v : 0;
};
const on = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

const TYPES = ["shortlet", "land", "building", "shop", "business_complex"];
const TXS = ["rent", "sale", "lease"];

async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title, { lower: true, strict: true }) || "property";
  let slug = base;
  let i = 1;
  while (await Property.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug })) slug = `${base}-${i++}`;
  return slug;
}

function readListing(fd: FormData) {
  const errors: Record<string, string> = {};
  const title = s(fd, "title");
  const description = s(fd, "description");
  const propertyType = s(fd, "propertyType");
  const transactionType = s(fd, "transactionType");
  const price = n(fd, "price");
  if (title.length < 6) errors.title = "Give the listing a descriptive title (at least 6 characters)";
  if (description.length < 30) errors.description = "Describe the property in a few sentences (at least 30 characters)";
  if (!TYPES.includes(propertyType)) errors.propertyType = "Choose a property type";
  if (!TXS.includes(transactionType)) errors.transactionType = "Choose sale, rent or lease";
  if (!(price > 0)) errors.price = "Enter the price in naira";
  if (!s(fd, "state")) errors.state = "Choose a state";
  if (!s(fd, "city")) errors.city = "Enter the city or area";

  const data: Record<string, unknown> = {
    title,
    description,
    propertyType,
    transactionType,
    price,
    priceNegotiable: on(fd, "priceNegotiable"),
    videoUrl: s(fd, "videoUrl") || undefined,
    location: {
      address: s(fd, "address"),
      city: s(fd, "city"),
      state: s(fd, "state"),
      lga: s(fd, "lga"),
      landmark: s(fd, "landmark"),
    },
    features: {
      bedrooms: n(fd, "bedrooms"),
      bathrooms: n(fd, "bathrooms"),
      toilets: n(fd, "toilets"),
      parkingSpaces: n(fd, "parkingSpaces"),
      floorArea: n(fd, "floorArea"),
      landArea: n(fd, "landArea"),
      furnished: on(fd, "furnished"),
      serviced: on(fd, "serviced"),
      security: on(fd, "security"),
      powerSupply: on(fd, "powerSupply"),
      borehole: on(fd, "borehole"),
    },
    agencyFee: price * 0.1,
  };

  if (propertyType === "shortlet") {
    data.shortletDetails = {
      isAvailable: true,
      minimumStay: n(fd, "minimumStay") || 1,
      maximumStay: n(fd, "maximumStay") || 30,
      checkInTime: s(fd, "checkInTime") || "14:00",
      checkOutTime: s(fd, "checkOutTime") || "11:00",
      maxGuests: n(fd, "maxGuests") || 2,
      bedrooms: n(fd, "bedrooms"),
      bathrooms: n(fd, "bathrooms"),
      amenities: fd.getAll("amenities").map(String),
      houseRules: fd.getAll("houseRules").map(String),
      cancellationPolicy: s(fd, "cancellationPolicy") || "moderate",
      cleaningFee: n(fd, "cleaningFee"),
      securityDeposit: n(fd, "securityDeposit"),
      weekendRate: n(fd, "weekendRate") || null,
      weeklyDiscount: n(fd, "weeklyDiscount"),
      monthlyDiscount: n(fd, "monthlyDiscount"),
    };
  }
  return { errors, data };
}

/**
 * Photo order comes from the client as a list of tokens:
 *   "existing:<url>" for photos already on the listing, "new:<n>" for the n-th uploaded file.
 * The first token becomes the cover (isPrimary).
 */
async function buildImages(fd: FormData, existing: { url: string }[] = []) {
  const files = filesFrom(fd, "images");
  if (files.length > 10) throw new UploadError("You can upload up to 10 photos at a time.");
  const saved = await saveImages(files, "property");
  const order = fd.getAll("imageOrder").map(String);
  const keep = new Set(existing.map((i) => i.url));
  const urls: string[] = [];
  if (order.length) {
    for (const tok of order) {
      if (tok.startsWith("existing:")) {
        const u = tok.slice(9);
        if (keep.has(u)) urls.push(u);
      } else if (tok.startsWith("new:")) {
        const u = saved[parseInt(tok.slice(4))];
        if (u) urls.push(u);
      }
    }
    // Any uploads not referenced (shouldn't happen) are appended rather than lost.
    for (const u of saved) if (!urls.includes(u)) urls.push(u);
  } else {
    urls.push(...existing.map((i) => i.url), ...saved);
  }
  const removed = existing.map((i) => i.url).filter((u) => !urls.includes(u));
  return { images: urls.map((url, i) => ({ url, isPrimary: i === 0 })), removed };
}

/** Hosts on Found Apartments can only list shortlets. */
function forceShortlet(fd: FormData) {
  fd.set("propertyType", "shortlet");
  fd.set("transactionType", "rent");
}

async function loadOwned(session: AuthedSession, id: string) {
  const property = await Property.findById(id);
  if (!property) return null;
  if (session.userType !== "admin" && String(property.owner) !== session.userId) return null;
  return property;
}

export async function createListing(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser(["realtor", "admin", "host"]);
  if (session.userType === "host") forceShortlet(fd);
  const { errors, data } = readListing(fd);
  if (Object.keys(errors).length) return { ok: false, message: "Some details need attention.", errors };

  await connectDB();
  let images;
  try {
    ({ images } = await buildImages(fd));
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Couldn't save your photos. Please try again." };
  }
  // Listings by a realtor with active annual verification are verified automatically.
  const ownerDoc = session.userType === "realtor" ? await User.findById(session.userId).select("realtorProfile").lean<{ realtorProfile?: { verified?: boolean; verifiedUntil?: Date } }>() : null;
  const verification = isRealtorVerified(ownerDoc?.realtorProfile)
    ? { verified: true, via: "realtor", verifiedAt: new Date(), until: ownerDoc?.realtorProfile?.verifiedUntil ?? null }
    : undefined;
  const property = await Property.create({
    ...data,
    ...(verification ? { verification } : {}),
    slug: await uniqueSlug(String(data.title)),
    images,
    owner: session.userId,
    ownerType: session.userType === "admin" ? "admin" : session.userType === "host" ? "host" : "realtor",
    // Realtor listings go through review; admins publish directly.
    status: session.userType === "admin" ? "available" : "pending",
    listingTier: "free",
  });

  if (session.userType !== "admin") {
    const owner = await User.findById(session.userId).select("name email");
    emailService.sendAdminNewPropertyNotification(property, owner).catch((e: unknown) => console.error("Admin notify error:", e));
  }
  revalidatePath("/dashboard", "layout");
  const notice =
    session.userType === "admin"
      ? "Listing published"
      : session.userType === "host"
        ? "Apartment submitted — the Found team will review it. It goes live once you're vetted and your listing agreement is signed."
        : "Listing submitted — we'll review it shortly and notify you when it's live.";
  redirect(`/dashboard/listings?notice=${encodeURIComponent(notice)}`);
}

export async function updateListing(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireUser(["realtor", "admin", "host"]);
  if (session.userType === "host") forceShortlet(fd);
  const id = s(fd, "id");
  const { errors, data } = readListing(fd);
  if (Object.keys(errors).length) return { ok: false, message: "Some details need attention.", errors };

  await connectDB();
  const property = await loadOwned(session, id);
  if (!property) return { ok: false, message: "Listing not found or you don't have access to it." };

  let result;
  try {
    result = await buildImages(fd, property.images);
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Couldn't save your photos. Please try again." };
  }

  const titleChanged = data.title !== property.title;
  property.set(data);
  if (titleChanged) property.slug = await uniqueSlug(String(data.title), id);
  property.images = result.images;
  if (data.propertyType !== "shortlet") property.shortletDetails = undefined;

  // Same rule as the Express app: realtor edits go back for re-review; admin edits don't.
  const wasLive = property.status === "available";
  if (session.userType !== "admin" && ["available", "rejected"].includes(property.status)) property.status = "pending";
  property.rejectionReason = undefined;
  await property.save();
  await Promise.all(result.removed.map(removeUpload));

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/properties/${property.slug}`);
  revalidatePath(`/apartments/${property.slug}`);
  const msg =
    session.userType !== "admin" && wasLive ? "Changes saved and sent for a quick re-review." : "Listing updated.";
  redirect(`/dashboard/listings?notice=${encodeURIComponent(msg)}`);
}

const OWNER_STATUSES: PropertyStatus[] = ["available", "sold", "rented", "unavailable"];

/** Quick status change from the listings table (sold/rented/off-market/back on market). */
export async function setListingStatus(id: string, status: PropertyStatus) {
  const session = await requireUser(["realtor", "admin", "host"]);
  await connectDB();
  const property = await loadOwned(session, id);
  if (!property) return { ok: false, message: "Listing not found" };
  if (session.userType !== "admin") {
    if (!OWNER_STATUSES.includes(status)) return { ok: false, message: "Not allowed" };
    // Only listings that were approved before can be switched back to live without review.
    if (["pending", "rejected"].includes(property.status)) return { ok: false, message: "This listing is still awaiting review." };
  }
  property.status = status;
  if (status !== "rejected") property.rejectionReason = undefined;
  await property.save();
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `Marked as ${status === "available" ? "live" : status}` };
}

export async function deleteListing(id: string) {
  const session = await requireUser(["realtor", "admin", "host"]);
  await connectDB();
  const property = await loadOwned(session, id);
  if (!property) return { ok: false, message: "Listing not found" };
  const urls = (property.images ?? []).map((i: { url: string }) => i.url);
  await Promise.all([
    Property.deleteOne({ _id: property._id }),
    FeaturedProperty.deleteMany({ property: property._id }),
    Promotion.deleteMany({ property: property._id }),
  ]);
  await Promise.all(urls.map(removeUpload));
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Listing deleted" };
}

/* ---------- Admin review ---------- */

export async function approveListing(id: string) {
  await requireUser(["admin"]);
  await connectDB();
  const listing = await Property.findById(id).select("owner").populate("owner", "userType hostProfile.status hostProfile.agreement.status");
  const owner = listing?.owner as { userType?: string; hostProfile?: { status?: string; agreement?: { status?: string } } } | undefined;
  if (owner?.userType === "host") {
    if (owner.hostProfile?.status !== "approved") return { ok: false, message: "Vet and approve this host first (Hosts page)." };
    if (owner.hostProfile?.agreement?.status !== "accepted") return { ok: false, message: "The host hasn't signed the listing agreement yet." };
  }
  await Property.updateOne({ _id: id }, { $set: { status: "available" }, $unset: { rejectionReason: "" } });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Listing approved and live" };
}

export async function rejectListing(id: string, reason: string) {
  await requireUser(["admin"]);
  await connectDB();
  await Property.updateOne({ _id: id }, { $set: { status: "rejected", rejectionReason: reason.slice(0, 500) } });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Listing rejected" };
}

export async function toggleFeatured(id: string) {
  await requireUser(["admin"]);
  await connectDB();
  const p = await Property.findById(id).select("featured");
  if (!p) return { ok: false, message: "Not found" };
  p.featured = !p.featured;
  await p.save();
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: p.featured ? "Marked as featured" : "Removed from featured" };
}

/* ---------- Enquiries ---------- */

async function loadInquiry(session: AuthedSession, id: string) {
  const inquiry = await Inquiry.findById(id).populate("property", "owner slug title");
  if (!inquiry) return null;
  if (session.userType === "admin") return inquiry;
  const ownerId = inquiry.property?.owner ? String(inquiry.property.owner) : String(inquiry.realtor?.id ?? "");
  return ownerId === session.userId ? inquiry : null;
}

export async function markInquiry(id: string, read: boolean) {
  const session = await requireUser(["realtor", "admin", "host"]);
  await connectDB();
  const inquiry = await loadInquiry(session, id);
  if (!inquiry) return { ok: false, message: "Not found" };
  inquiry.read = read;
  await inquiry.save();
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: read ? "Marked as read" : "Marked as unread" };
}

export async function replyInquiry(id: string, message: string) {
  const session = await requireUser(["realtor", "admin", "host"]);
  if (message.trim().length < 2) return { ok: false, message: "Write a reply first" };
  await connectDB();
  const inquiry = await loadInquiry(session, id);
  if (!inquiry) return { ok: false, message: "Not found" };
  if (session.userType !== "admin" && inquiry.agent?.name) {
    return { ok: false, message: "This enquiry came through an agent, so Found handles the correspondence. Contact admin@found.ng." };
  }
  inquiry.replied = true;
  inquiry.read = true;
  inquiry.replyMessage = message.trim();
  inquiry.repliedAt = new Date();
  inquiry.repliedBy = session.userId;
  await inquiry.save();
  const sent = await emailService
    .sendInquiryReplyEmail(inquiry, message.trim(), session.userName)
    .catch((e: unknown) => {
      console.error("Reply email error:", e);
      return false;
    });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: sent === false ? "Reply saved, but the email couldn't be sent — check SMTP settings." : "Reply sent by email" };
}

export async function deleteInquiry(id: string) {
  const session = await requireUser(["admin"]);
  await connectDB();
  const inquiry = await loadInquiry(session, id);
  if (!inquiry) return { ok: false, message: "Not found" };
  await Inquiry.deleteOne({ _id: id });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Enquiry deleted" };
}
