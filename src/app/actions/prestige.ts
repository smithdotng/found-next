"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { PrivateClient, Property } from "@/lib/models";
import { requireUser } from "@/lib/session";
import { EMAIL_RE } from "@/lib/format";
import { adminEmail, apartmentEmail, sendMail } from "@/lib/mailer";
import { BUDGET_BANDS, CLIENT_INTERESTS, PAYMENT_ROUTES, TIMELINES, labelOf } from "@/lib/prestige";
import type { FormState } from "./public";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const PHONE = /^\+?[\d\s()-]{7,20}$/;

/** Public: a private client asks Found's concierge for help. */
export async function requestPrivateClient(_prev: FormState, fd: FormData): Promise<FormState> {
  if (s(fd, "website")) return { ok: true, message: "Thank you." }; // honeypot
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const phone = s(fd, "phone");
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter your name";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
  if (!PHONE.test(phone)) errors.phone = "Enter a phone number we can reach you on (include the country code if outside Nigeria)";
  if (!s(fd, "interest")) errors.interest = "Tell us what you're looking for";
  if (!fd.get("consent")) errors.consent = "Please confirm we may contact you";
  if (Object.keys(errors).length) return { ok: false, message: "Please check the highlighted fields.", errors };

  await connectDB();
  const propertyId = s(fd, "propertyId");
  const property = /^[a-f0-9]{24}$/i.test(propertyId) ? await Property.findById(propertyId).select("title slug").lean<{ _id: string; title: string; slug: string }>() : null;
  const doc = await PrivateClient.create({
    name,
    email,
    phone,
    country: s(fd, "country").slice(0, 80),
    interest: s(fd, "interest"),
    locations: fd.getAll("locations").map(String).slice(0, 12),
    budget: s(fd, "budget"),
    timeline: s(fd, "timeline"),
    payment: s(fd, "payment"),
    message: s(fd, "message").slice(0, 1500),
    partner: s(fd, "partner").replace(/[^a-z0-9-]/gi, "").slice(0, 40) || undefined,
    referredBy: s(fd, "referredBy").slice(0, 120) || undefined,
    property: property?._id,
  });

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ...(doc.country ? ([["Based in", doc.country]] as [string, string][]) : []),
    ["Looking to", labelOf(CLIENT_INTERESTS, doc.interest)],
    ...(doc.locations?.length ? ([["Areas", doc.locations.join(", ")]] as [string, string][]) : []),
    ...(doc.budget ? ([["Budget", labelOf(BUDGET_BANDS, doc.budget)]] as [string, string][]) : []),
    ...(doc.timeline ? ([["Timeline", labelOf(TIMELINES, doc.timeline)]] as [string, string][]) : []),
    ...(doc.payment ? ([["Paying by", labelOf(PAYMENT_ROUTES, doc.payment)]] as [string, string][]) : []),
    ...(property ? ([["Enquired about", property.title]] as [string, string][]) : []),
    ...(doc.partner || doc.referredBy ? ([["Referred by", [doc.partner, doc.referredBy].filter(Boolean).join(" · ")]] as [string, string][]) : []),
  ];
  void sendMail(
    adminEmail(),
    `Prestige private client: ${name}${doc.budget ? ` (${labelOf(BUDGET_BANDS, doc.budget)})` : ""}`,
    apartmentEmail({
      brand: "found",
      heading: "New Found Prestige private client",
      intro: "A private client has asked the concierge for help. Please call them within one working day.",
      rows,
      note: doc.message ? `Their note: ${doc.message}` : undefined,
      cta: { label: "Open private clients", href: "/dashboard/private-clients" },
    }),
  );
  void sendMail(
    email,
    "Found Prestige: your private client request",
    apartmentEmail({
      brand: "found",
      heading: `Thank you, ${name.split(" ")[0]}`,
      intro:
        "Your request has reached the Found Prestige concierge. A named relationship manager will contact you personally within one working day to understand what you're looking for. Everything you share with us is kept confidential.",
      note: "Every property we introduce has been through Found's title and encumbrance checks. We never share your details with a realtor or seller without your permission.",
      cta: { label: "View the Prestige collection", href: "/prestige" },
    }),
  );
  return { ok: true, message: "Your relationship manager will contact you within one working day." };
}

/** Admin: move a private client through the pipeline and keep notes. */
export async function updatePrivateClient(id: string, status: string, notes?: string) {
  await requireUser(["admin"]);
  if (!["new", "contacted", "qualified", "closed"].includes(status)) return { ok: false, message: "Unknown status" };
  await connectDB();
  const set: Record<string, unknown> = { status, updatedAt: new Date() };
  if (notes !== undefined) set.notes = notes.slice(0, 2000);
  const r = await PrivateClient.updateOne({ _id: id }, { $set: set });
  revalidatePath("/dashboard/private-clients");
  return r.matchedCount ? { ok: true, message: "Saved" } : { ok: false, message: "Not found" };
}

/** Admin: add a listing to (or remove it from) the hand-picked Prestige collection. */
export async function setPrestige(id: string, on: boolean) {
  await requireUser(["admin"]);
  await connectDB();
  await Property.updateOne({ _id: id }, { $set: { prestige: on } });
  revalidatePath("/prestige");
  revalidatePath("/dashboard/listings");
  return { ok: true, message: on ? "Added to Prestige (shows once the listing is Verified)" : "Removed from Prestige" };
}
