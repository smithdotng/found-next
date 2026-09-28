"use server";

import { connectDB } from "@/lib/db";
import { Inquiry, Project, ProjectInquiry, Promotion, Property, User } from "@/lib/models";
import { getSession } from "@/lib/session";
import { EMAIL_RE, NG_PHONE } from "@/lib/format";
import emailService from "@/lib/email";

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

function field(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}

/** Port of inquiryController.createPropertyInquiry (same validation, agent credit and emails). */
export async function sendPropertyInquiry(_prev: FormState, fd: FormData): Promise<FormState> {
  const propertyId = field(fd, "propertyId");
  const name = field(fd, "name");
  const email = field(fd, "email").toLowerCase();
  const phone = field(fd, "phone");
  const message = field(fd, "message");
  if (field(fd, "website")) return { ok: true, message: "Thanks! Your inquiry has been sent." }; // honeypot

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please enter your name";
  if (!email || !EMAIL_RE.test(email)) errors.email = "Please enter a valid email address";
  if (phone && !NG_PHONE.test(phone.replace(/\s/g, ""))) errors.phone = "Use a Nigerian number, e.g. 08031234567 or +2348031234567";
  if (!message) errors.message = "Please add a short message";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  try {
    await connectDB();
    const property = await Property.findById(propertyId).populate("owner", "name email phone realtorProfile");
    if (!property) return { ok: false, message: "This property is no longer available." };

    const realtor = property.owner;
    const realtorInfo = realtor
      ? { id: realtor._id, name: realtor.name, email: realtor.email, phone: realtor.phone, company: realtor.realtorProfile?.company || "" }
      : null;

    const session = await getSession();
    let agentInfo = null;
    if (session.referringAgent) {
      const agent = await User.findById(session.referringAgent.id).select("name email phone agentProfile");
      if (agent) {
        agentInfo = { id: agent._id, name: agent.name, email: agent.email, phone: agent.phone, referralCode: session.referringAgent.referralCode };
        await Promotion.findOneAndUpdate({ agent: agent._id, property: propertyId }, { $inc: { inquiries: 1 } });
      }
    }

    const inquiry = await Inquiry.create({
      property: propertyId,
      propertyTitle: property.title,
      name,
      email,
      phone: phone.replace(/\s/g, ""),
      message,
      realtor: realtorInfo,
      agent: agentInfo,
      read: false,
      replied: false,
    });

    try {
      if (realtorInfo?.email) await emailService.sendInquiryNotificationToRealtor(inquiry, property, realtorInfo);
      if (agentInfo?.email) await emailService.sendInquiryNotificationToAgent(inquiry, property, agentInfo);
      await emailService.sendAdminInquiryNotification(inquiry, property);
    } catch (e) {
      console.error("Inquiry email error:", e);
    }

    return { ok: true, message: "Your inquiry has been sent. The property team will contact you shortly." };
  } catch (e) {
    console.error("Create property inquiry error:", e);
    return { ok: false, message: "Error sending inquiry. Please try again." };
  }
}

export async function sendProjectInquiry(_prev: FormState, fd: FormData): Promise<FormState> {
  const projectId = field(fd, "projectId");
  const name = field(fd, "name");
  const email = field(fd, "email").toLowerCase();
  const phone = field(fd, "phone");
  const message = field(fd, "message");
  if (field(fd, "website")) return { ok: true, message: "Thanks! Your inquiry has been sent." };

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please enter your name";
  if (!email || !EMAIL_RE.test(email)) errors.email = "Please enter a valid email address";
  if (!message) errors.message = "Please add a short message";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  try {
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) return { ok: false, message: "Project not found." };
    await ProjectInquiry.create({ project: projectId, projectName: project.name, name, email, phone, message, status: "new" });
    return { ok: true, message: "Your inquiry has been sent. We will get back to you shortly." };
  } catch (e) {
    console.error("Create project inquiry error:", e);
    return { ok: false, message: "Error sending inquiry. Please try again." };
  }
}

/** Contact form — the Express route only logged submissions; this also emails the team when SMTP is set. */
export async function sendContactMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = field(fd, "name");
  const email = field(fd, "email");
  const phone = field(fd, "phone");
  const subject = field(fd, "subject") || "General Inquiry";
  const message = field(fd, "message");
  if (field(fd, "website")) return { ok: true, message: "Thanks!" };
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please enter your name";
  if (!email || !EMAIL_RE.test(email)) errors.email = "Please enter a valid email address";
  if (!message) errors.message = "Please enter a message";
  if (Object.keys(errors).length) return { ok: false, message: "Please fill in all required fields.", errors };

  console.log("Contact form submission:", { name, email, phone, subject, message });
  try {
    const admin = process.env.ADMIN_EMAIL || "hello@found.ng";
    const html = `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}${phone ? `, ${escapeHtml(phone)}` : ""}) wrote:</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;
    await emailService.sendNewsletterEmail({ email: admin, name: "Found team" }, `[Contact] ${subject}`, html);
  } catch (e) {
    console.error("Contact email error:", e);
  }
  return { ok: true, message: "Your message has been sent. We'll get back to you soon!" };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
