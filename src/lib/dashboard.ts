import "server-only";
import { Types } from "mongoose";
import { connectDB, toPlain } from "./db";
import { Inquiry, Project, ProjectInquiry, Promotion, Property, User, Blog, Booking, VerificationRequest } from "./models";
import { escapeRegex } from "./format";
import type { AuthedSession } from "./session";
import type { InquiryDoc, PropertyDoc } from "./types";

export const oid = (id: string) => new Types.ObjectId(id);

/** Badge counts for the sidebar. */
export async function getNavCounts(session: AuthedSession) {
  await connectDB();
  if (session.userType === "admin") {
    const [pending, unread, projectNew] = await Promise.all([
      Property.countDocuments({ status: "pending" }),
      Inquiry.countDocuments({ read: false }),
      ProjectInquiry.countDocuments({ status: "new" }),
    ]);
    const [bookings, hosts, verifications] = await Promise.all([
      Booking.countDocuments({ status: "pending" }),
      User.countDocuments({ userType: "host", "hostProfile.status": "pending" }),
      VerificationRequest.countDocuments({ status: "pending" }),
    ]);
    return { approvals: pending, inquiries: unread + projectNew, bookings, hosts, verifications };
  }
  if (session.userType === "realtor" || session.userType === "host") {
    const ids = await Property.find({ owner: session.userId }).distinct("_id");
    const [unread, bookings] = await Promise.all([
      Inquiry.countDocuments({ property: { $in: ids }, read: false }),
      Booking.countDocuments({ property: { $in: ids }, status: "pending" }),
    ]);
    return { approvals: 0, inquiries: unread, bookings, hosts: 0, verifications: 0 };
  }
  return { approvals: 0, inquiries: 0, bookings: 0, hosts: 0, verifications: 0 };
}

export async function getRealtorOverview(userId: string) {
  await connectDB();
  const owner = oid(userId);
  const [byStatus, totals, recent, ids] = await Promise.all([
    Property.aggregate([{ $match: { owner } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Property.aggregate([{ $match: { owner } }, { $group: { _id: null, value: { $sum: "$price" }, views: { $sum: "$views" } } }]),
    Property.find({ owner }).sort("-updatedAt").limit(5).lean(),
    Property.find({ owner }).distinct("_id"),
  ]);
  const [inquiries, unread, topViewed, perProperty] = await Promise.all([
    Inquiry.find({ property: { $in: ids } }).sort("-createdAt").limit(6).populate("property", "title slug images").lean(),
    Inquiry.countDocuments({ property: { $in: ids }, read: false }),
    Property.find({ owner, status: "available" }).sort("-views").limit(5).select("title slug views images price").lean(),
    Inquiry.aggregate([{ $match: { property: { $in: ids } } }, { $group: { _id: "$property", count: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(byStatus.map((s: { _id: string; count: number }) => [s._id, s.count]));
  const leadsByProperty = Object.fromEntries(perProperty.map((x: { _id: Types.ObjectId; count: number }) => [String(x._id), x.count]));
  return {
    counts: {
      total: Object.values(counts).reduce((a: number, b) => a + (b as number), 0) as number,
      live: counts.available ?? 0,
      pending: counts.pending ?? 0,
      closed: (counts.sold ?? 0) + (counts.rented ?? 0),
      rejected: counts.rejected ?? 0,
    },
    value: totals[0]?.value ?? 0,
    views: totals[0]?.views ?? 0,
    unread,
    totalLeads: Object.values(leadsByProperty).reduce((a: number, b) => a + (b as number), 0) as number,
    recent: toPlain<PropertyDoc[]>(recent),
    inquiries: toPlain<InquiryDoc[]>(inquiries),
    topViewed: toPlain<PropertyDoc[]>(topViewed).map((p) => ({ ...p, leads: leadsByProperty[p._id] ?? 0 })),
  };
}

export async function getAdminOverview() {
  await connectDB();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [byStatus, byType, users, newUsers, inquiries30, pendingList, recentInquiries, projects, blogs, dailyInquiries] = await Promise.all([
    Property.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Property.aggregate([{ $match: { status: "available" } }, { $group: { _id: "$propertyType", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$userType", count: { $sum: 1 } } }]),
    User.countDocuments({ createdAt: { $gte: since } }),
    Inquiry.countDocuments({ createdAt: { $gte: since } }),
    Property.find({ status: "pending" }).sort("createdAt").limit(5).populate("owner", "name").lean(),
    Inquiry.find().sort("-createdAt").limit(6).lean(),
    Project.countDocuments({ status: "published" }),
    Blog.countDocuments({ status: "published" }),
    Inquiry.find({ createdAt: { $gte: new Date(Date.now() - 14 * 24 * 3600 * 1000) } }).select("createdAt").lean<{ createdAt: Date }[]>(),
  ]);
  const st = Object.fromEntries(byStatus.map((s: { _id: string; count: number }) => [s._id, s.count]));
  const us = Object.fromEntries(users.map((s: { _id: string; count: number }) => [s._id, s.count]));
  const days: { date: string; count: number }[] = [];
  const map: Record<string, number> = {};
  for (const q of dailyInquiries) {
    const k = new Date(q.createdAt).toISOString().slice(0, 10);
    map[k] = (map[k] ?? 0) + 1;
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
    days.push({ date: d, count: map[d] ?? 0 });
  }
  return {
    listings: { live: st.available ?? 0, pending: st.pending ?? 0, closed: (st.sold ?? 0) + (st.rented ?? 0), rejected: st.rejected ?? 0 },
    byType: Object.fromEntries(byType.map((s: { _id: string; count: number }) => [s._id, s.count])) as Record<string, number>,
    users: { realtors: us.realtor ?? 0, agents: us.agent ?? 0, admins: us.admin ?? 0, new30: newUsers },
    inquiries30,
    projects,
    blogs,
    days,
    pending: toPlain<PropertyDoc[]>(pendingList),
    recentInquiries: toPlain<InquiryDoc[]>(recentInquiries),
  };
}

export async function getAgentOverview(userId: string) {
  await connectDB();
  const [user, promos] = await Promise.all([
    User.findById(userId).select("name agentProfile referralStats").lean(),
    Promotion.find({ agent: userId }).sort("-createdAt").populate("property", "title slug images price location status").lean(),
  ]);
  type Promo = {
    _id: string;
    referralCode: string;
    referralLink: string;
    clicks: number;
    inquiries: number;
    transactions: number;
    earnings: number;
    qrCode?: string;
    createdAt: string;
    lastClickedAt?: string;
    property: PropertyDoc | null;
  };
  const list = toPlain<Promo[]>(promos);
  const sum = (k: "clicks" | "inquiries" | "transactions" | "earnings") => list.reduce((a, p) => a + (p[k] || 0), 0);
  return {
    user: toPlain<{ name: string; agentProfile?: { totalEarnings?: number; pendingWithdrawal?: number; bankDetails?: { bankName?: string; accountNumber?: string; accountName?: string } } }>(user),
    promotions: list,
    totals: { clicks: sum("clicks"), inquiries: sum("inquiries"), transactions: sum("transactions"), earnings: sum("earnings"), count: list.length },
  };
}

export interface ListingQuery {
  status?: string;
  q?: string;
  type?: string;
  sort?: string;
  page?: string;
  owner?: string;
}

export async function getManagedListings(session: AuthedSession, f: ListingQuery) {
  await connectDB();
  const base: Record<string, unknown> = {};
  if (session.userType !== "admin") base.owner = oid(session.userId);
  else if (f.owner && /^[a-f0-9]{24}$/i.test(f.owner)) base.owner = oid(f.owner);

  const query: Record<string, unknown> = { ...base };
  if (f.status === "closed") query.status = { $in: ["sold", "rented"] };
  else if (f.status && f.status !== "all") query.status = f.status;
  if (f.type) query.propertyType = f.type;
  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q), "i");
    query.$or = [{ title: rx }, { "location.city": rx }, { "location.state": rx }, { "location.address": rx }];
  }
  const sorts: Record<string, Record<string, 1 | -1>> = {
    updated: { updatedAt: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    views: { views: -1 },
    "price-desc": { price: -1 },
    "price-asc": { price: 1 },
  };
  const sort = sorts[f.sort ?? ""] ?? (f.status === "pending" ? { createdAt: 1 } : { updatedAt: -1 });
  const page = Math.max(1, parseInt(f.page ?? "1") || 1);
  const perPage = 20;

  const [items, total, byStatus] = await Promise.all([
    Property.find(query).sort(sort).skip((page - 1) * perPage).limit(perPage).populate("owner", "name email").lean(),
    Property.countDocuments(query),
    Property.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const plain = toPlain<PropertyDoc[]>(items);
  const ids = plain.map((p) => oid(p._id));
  const [all, unread] = await Promise.all([
    Inquiry.aggregate([{ $match: { property: { $in: ids } } }, { $group: { _id: "$property", count: { $sum: 1 } } }]),
    Inquiry.aggregate([{ $match: { property: { $in: ids }, read: false } }, { $group: { _id: "$property", count: { $sum: 1 } } }]),
  ]);
  const unreadMap = Object.fromEntries(unread.map((l: { _id: Types.ObjectId; count: number }) => [String(l._id), l.count]));
  const leadMap: Record<string, { count: number; unread: number }> = Object.fromEntries(
    all.map((l: { _id: Types.ObjectId; count: number }) => [String(l._id), { count: l.count, unread: unreadMap[String(l._id)] ?? 0 }]),
  );
  const st = Object.fromEntries(byStatus.map((s: { _id: string; count: number }) => [s._id, s.count])) as Record<string, number>;
  return {
    items: plain.map((p) => ({ ...p, leads: leadMap[p._id]?.count ?? 0, unreadLeads: leadMap[p._id]?.unread ?? 0 })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    counts: {
      all: Object.values(st).reduce((a, b) => a + b, 0),
      available: st.available ?? 0,
      pending: st.pending ?? 0,
      closed: (st.sold ?? 0) + (st.rented ?? 0),
      unavailable: st.unavailable ?? 0,
      rejected: st.rejected ?? 0,
    },
  };
}

export async function getManagedInquiries(session: AuthedSession, f: { filter?: string; q?: string; property?: string; page?: string }) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (session.userType !== "admin") {
    const ids = await Property.find({ owner: session.userId }).distinct("_id");
    query.property = { $in: ids };
  }
  if (f.property && /^[a-f0-9]{24}$/i.test(f.property)) query.property = oid(f.property);
  if (f.filter === "unread") query.read = false;
  if (f.filter === "replied") query.replied = true;
  if (f.filter === "open") query.replied = { $ne: true };
  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q), "i");
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }, { propertyTitle: rx }, { message: rx }];
  }
  const page = Math.max(1, parseInt(f.page ?? "1") || 1);
  const perPage = 25;
  const [items, total] = await Promise.all([
    Inquiry.find(query).sort("-createdAt").skip((page - 1) * perPage).limit(perPage).populate("property", "title slug images").lean(),
    Inquiry.countDocuments(query),
  ]);
  return { items: toPlain<InquiryDoc[]>(items), total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}
