"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { PreVerification, Property, User } from "@/lib/models";
import { requireUser } from "@/lib/session";
import { DocumentError, removeDocument, saveDocument } from "@/lib/private-docs";
import { adminEmail, apartmentEmail, sendMail } from "@/lib/mailer";
import { ENCUMBRANCES, TITLE_TYPES, labelFor } from "@/lib/pre-verification";
import type { FormState } from "./public";

type Result = { ok: boolean; message: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const FROM = "Found Verification";
const MAX_DOCS = 12;
const ID = /^[a-f0-9]{24}$/i;

async function loadOwnedProperty(id: string) {
  const session = await requireUser(["realtor", "admin"]);
  if (!ID.test(id)) return { session, property: null };
  await connectDB();
  const property = await Property.findById(id).select("title slug owner propertyType");
  if (!property) return { session, property: null };
  if (session.userType !== "admin" && String(property.owner) !== session.userId) return { session, property: null };
  return { session, property };
}

/** Realtor (or an admin on their behalf) submits or updates the pre-verification checklist for a listing. */
export async function savePreVerification(_prev: FormState, fd: FormData): Promise<FormState> {
  const { session, property } = await loadOwnedProperty(s(fd, "propertyId"));
  if (!property) return { ok: false, message: "Listing not found." };

  const existing = await PreVerification.findOne({ property: property._id });
  const errors: Record<string, string> = {};

  const titleType = s(fd, "titleType");
  const titleTypeOther = s(fd, "titleTypeOther").slice(0, 120);
  const titleNumber = s(fd, "titleNumber").slice(0, 120);
  const titleHolder = s(fd, "titleHolder").slice(0, 160);
  const ownership = s(fd, "ownership");
  const encumbered = s(fd, "encumbered");
  const encumbrances = fd.getAll("encumbrances").map(String).filter((v) => ENCUMBRANCES.some((e) => e.value === v));
  const encumbranceDetails = s(fd, "encumbranceDetails").slice(0, 2000);
  const surveyPlan = s(fd, "surveyPlan");
  const notes = s(fd, "notes").slice(0, 2000);
  const declaration = fd.get("declaration") === "on";

  if (!TITLE_TYPES.some((t) => t.value === titleType)) errors.titleType = "Choose the type of title.";
  if (titleType === "other" && !titleTypeOther) errors.titleTypeOther = "Describe the title.";
  if (!titleHolder) errors.titleHolder = "Enter the name on the title document.";
  if (ownership !== "owner" && ownership !== "authorised") errors.ownership = "Tell us your relationship to the property.";
  if (!["no", "yes", "unsure"].includes(encumbered)) errors.encumbered = "Tell us whether the property has any encumbrance.";
  if (encumbered === "yes" && !encumbrances.length) errors.encumbrances = "Select the kind of encumbrance.";
  if ((encumbered === "yes" || encumbered === "unsure") && encumbranceDetails.length < 10) errors.encumbranceDetails = "Give us the details.";
  if (!declaration) errors.declaration = "Please confirm the declaration.";

  // New documents by kind.
  const uploads: { kind: string; file: File }[] = [];
  for (const kind of ["title", "survey", "authority", "other"]) {
    for (const f of fd.getAll(`doc_${kind}`)) if (f instanceof File && f.size > 0) uploads.push({ kind, file: f });
  }
  const kept = existing?.documents ?? [];
  const has = (kind: string) => kept.some((d: { kind: string }) => d.kind === kind) || uploads.some((u) => u.kind === kind);
  if (!has("title")) errors.doc_title = "Upload a copy of the title document.";
  if (ownership === "authorised" && !has("authority")) errors.doc_authority = "Upload the owner's letter of authority.";
  if (kept.length + uploads.length > MAX_DOCS) errors.doc_other = `You can keep up to ${MAX_DOCS} documents. Remove some first.`;

  if (Object.keys(errors).length) return { ok: false, message: "Please check the highlighted fields.", errors };

  const saved = [];
  try {
    for (const u of uploads) saved.push({ ...(await saveDocument(u.file)), kind: u.kind });
  } catch (e) {
    await Promise.all(saved.map((d) => removeDocument(d.key)));
    return { ok: false, message: e instanceof DocumentError ? e.message : "Couldn't upload your documents. Please try again." };
  }

  const fields = {
    titleType,
    titleTypeOther: titleType === "other" ? titleTypeOther : undefined,
    titleNumber,
    titleHolder,
    ownership,
    encumbered,
    encumbrances: encumbered === "yes" ? encumbrances : [],
    encumbranceDetails: encumbered === "no" ? "" : encumbranceDetails,
    surveyPlan: ["yes", "no", "in_progress"].includes(surveyPlan) ? surveyPlan : undefined,
    notes,
    declaration,
    status: "submitted",
    submittedAt: new Date(),
  };
  const check = existing
    ? await PreVerification.findByIdAndUpdate(existing._id, { $set: fields, $push: { documents: { $each: saved } } }, { new: true })
    : await PreVerification.create({ property: property._id, owner: property.owner, ...fields, documents: saved });

  const owner = await User.findById(property.owner).select("name email realtorProfile");
  const title = labelFor(TITLE_TYPES, titleType) + (titleType === "other" ? `: ${titleTypeOther}` : "");
  void sendMail(
    adminEmail(),
    `Pre-verification ${existing ? "updated" : "submitted"}: ${property.title}`,
    apartmentEmail({
      brand: "found",
      heading: `Pre-verification checklist ${existing ? "updated" : "submitted"}`,
      intro: `${owner?.realtorProfile?.company || owner?.name || "A realtor"} has ${existing ? "updated" : "completed"} the pre-verification checklist for "${property.title}".`,
      rows: [
        ["Title", title],
        ["Name on title", titleHolder],
        ["Relationship", ownership === "owner" ? "Owner" : "Authorised by the owner"],
        ["Encumbrance", encumbered === "no" ? "None declared" : encumbered === "unsure" ? "Not sure" : encumbrances.map((e) => labelFor(ENCUMBRANCES, e)).join(", ")],
        ["Documents", String(check?.documents?.length ?? 0)],
        ["Submitted by", session.userType === "admin" ? `${session.userName} (admin)` : session.userName],
      ],
      cta: { label: "Review checklist", href: `/dashboard/listings/${property._id}/verification` },
    }),
    FROM,
  );

  revalidatePath(`/dashboard/listings/${property._id}/verification`);
  revalidatePath("/dashboard/listings");
  revalidatePath("/dashboard/verification");
  return { ok: true, message: "Checklist submitted. Found will review your documents and contact you if anything else is needed." };
}

export async function removePreVerificationDocument(propertyId: string, docId: string): Promise<Result> {
  const { property } = await loadOwnedProperty(propertyId);
  if (!property) return { ok: false, message: "Listing not found" };
  const check = await PreVerification.findOne({ property: property._id });
  const doc = check?.documents?.id(docId);
  if (!check || !doc) return { ok: false, message: "Document not found" };
  await removeDocument(doc.key);
  doc.deleteOne();
  if (check.status === "accepted") check.status = "submitted";
  await check.save();
  revalidatePath(`/dashboard/listings/${property._id}/verification`);
  return { ok: true, message: "Document removed" };
}

/** Admin marks a checklist as checked, or asks the realtor for changes. */
export async function reviewPreVerification(propertyId: string, accept: boolean, note = ""): Promise<Result> {
  const session = await requireUser(["admin"]);
  if (!ID.test(propertyId)) return { ok: false, message: "Listing not found" };
  await connectDB();
  const check = await PreVerification.findOne({ property: propertyId });
  if (!check) return { ok: false, message: "No checklist for this listing" };
  if (!accept && note.trim().length < 5) return { ok: false, message: "Tell the realtor what needs changing" };
  check.status = accept ? "accepted" : "needs_changes";
  check.adminNote = note.trim().slice(0, 1000) || undefined;
  check.reviewedBy = session.userId;
  check.reviewedAt = new Date();
  await check.save();

  const [property, owner] = await Promise.all([Property.findById(propertyId).select("title"), User.findById(check.owner).select("name email")]);
  if (owner?.email) {
    void sendMail(
      owner.email,
      accept ? `Documents checked: ${property?.title ?? "your listing"}` : `Action needed: ${property?.title ?? "your listing"}`,
      apartmentEmail({
        brand: "found",
        heading: accept ? "Your pre-verification documents are checked" : "We need a little more from you",
        intro: accept
          ? `Hi ${owner.name.split(" ")[0]}, we've reviewed the pre-verification checklist for "${property?.title}". Everything is in order.`
          : `Hi ${owner.name.split(" ")[0]}, we've reviewed the pre-verification checklist for "${property?.title}" and need a few changes before we can continue.`,
        note: note.trim() || undefined,
        cta: { label: accept ? "View checklist" : "Update checklist", href: `/dashboard/listings/${propertyId}/verification` },
      }),
      FROM,
    );
  }
  revalidatePath(`/dashboard/listings/${propertyId}/verification`);
  revalidatePath("/dashboard/verification");
  return { ok: true, message: accept ? "Marked as checked" : "Changes requested — the realtor has been emailed" };
}
