import "server-only";
import { Types } from "mongoose";
import { connectDB, toPlain } from "./db";
import { BlockedDate, Booking, Property, User } from "./models";
import { escapeRegex } from "./format";
import { todayLagos } from "./stay";
import type { AuthedSession } from "./session";
import type { BookingDoc, HostProfile, PropertyDoc } from "./types";

const oid = (id: string) => new Types.ObjectId(id);

/** Properties whose bookings this user manages (admins: all). */
async function scope(session: AuthedSession) {
  if (session.userType === "admin") return {};
  const ids = await Property.find({ owner: session.userId, propertyType: "shortlet" }).distinct("_id");
  return { property: { $in: ids } };
}

export const BOOKING_TABS = ["requests", "upcoming", "current", "past", "closed", "all"] as const;
export type BookingTab = (typeof BOOKING_TABS)[number];

function tabQuery(tab: string): Record<string, unknown> {
  const today = todayLagos();
  switch (tab) {
    case "requests": return { status: "pending" };
    case "upcoming": return { status: "confirmed", "dates.checkIn": { $gte: today } };
    case "current": return { $or: [{ status: "checked_in" }, { status: "confirmed", "dates.checkIn": { $lt: today } }] };
    case "past": return { status: { $in: ["checked_out", "no_show"] } };
    case "closed": return { status: { $in: ["declined", "cancelled", "expired"] } };
    default: return {};
  }
}

export type ManagedBooking = BookingDoc & {
  property: Pick<PropertyDoc, "_id" | "title" | "slug" | "images" | "location"> | null;
  host: { _id: string; name: string; email?: string; phone?: string; hostProfile?: HostProfile } | null;
};

/**
 * Requests the host hasn't answered within 48 hours (per the host agreement),
 * or whose check-in date has passed, lapse so guests can book elsewhere.
 */
export async function expireStaleRequests() {
  await connectDB();
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000);
  await Booking.updateMany(
    { status: "pending", $or: [{ createdAt: { $lt: cutoff } }, { "dates.checkIn": { $lt: todayLagos() } }] },
    { $set: { status: "expired" }, $push: { history: { status: "expired", by: "system", at: new Date(), note: "No response from host in time" } } },
  );
}

export async function getManagedBookings(session: AuthedSession, f: { tab?: string; q?: string; property?: string; commission?: string; payout?: string; payment?: string; page?: string }) {
  await expireStaleRequests();
  const base = await scope(session);
  const query: Record<string, unknown> = { ...base, ...tabQuery(f.tab ?? "requests") };
  if (f.property && /^[a-f0-9]{24}$/i.test(f.property)) query.property = oid(f.property);
  if (f.commission && session.userType === "admin") query["commission.status"] = f.commission;
  if (f.payout && ["not_due", "due", "paid", "on_hold"].includes(f.payout)) query["payout.status"] = f.payout;
  if (f.payment === "awaiting") Object.assign(query, { status: "confirmed", "payment.status": { $ne: "paid" } });
  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q), "i");
    query.$and = [{ $or: [{ "guest.name": rx }, { "guest.email": rx }, { "guest.phone": rx }, { bookingReference: rx }, { propertyTitle: rx }] }];
  }
  const sort: Record<string, 1 | -1> = f.tab === "requests" ? { createdAt: 1 } : f.tab === "upcoming" || f.tab === "current" ? { "dates.checkIn": 1 } : { createdAt: -1 };
  const page = Math.max(1, parseInt(f.page ?? "1") || 1);
  const perPage = 25;
  const [items, total, counts] = await Promise.all([
    Booking.find(query)
      .sort(sort)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("property", "title slug images location")
      .populate("host", "name email phone hostProfile.businessName")
      .lean(),
    Booking.countDocuments(query),
    Promise.all(BOOKING_TABS.map((t) => Booking.countDocuments({ ...base, ...tabQuery(t) }))),
  ]);
  return {
    items: toPlain<ManagedBooking[]>(items),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    counts: Object.fromEntries(BOOKING_TABS.map((t, i) => [t, counts[i]])) as Record<BookingTab, number>,
  };
}

/** Commission totals: what's due to Found and what's been received. */
export async function getCommissionSummary(session: AuthedSession) {
  await connectDB();
  const base = await scope(session);
  const rows = await Booking.aggregate([
    { $match: { ...base, "commission.amount": { $gt: 0 } } },
    { $group: { _id: "$commission.status", amount: { $sum: "$commission.amount" }, count: { $sum: 1 } } },
  ]);
  const m = Object.fromEntries(rows.map((r: { _id: string; amount: number; count: number }) => [r._id, r]));
  const booked = await Booking.aggregate([
    { $match: { ...base, status: { $in: ["confirmed", "checked_in", "checked_out"] } } },
    { $group: { _id: null, total: { $sum: "$pricing.total" }, nights: { $sum: "$dates.nights" }, count: { $sum: 1 } } },
  ]);
  // Money held and owed: guest payments awaited, payouts to hosts, VAT collected.
  const [payouts, awaiting, vat] = await Promise.all([
    Booking.aggregate([
      { $match: { ...base, "payment.status": "paid", "payout.amount": { $gt: 0 } } },
      { $group: { _id: "$payout.status", amount: { $sum: "$payout.amount" }, count: { $sum: 1 } } },
    ]),
    Booking.find({ ...base, status: "confirmed", "payment.status": { $ne: "paid" } }).select("pricing.total pricing.securityDeposit").lean<{ pricing: { total: number; securityDeposit?: number } }[]>(),
    Booking.find({ ...base, "payment.status": "paid" }).select("pricing.vat").lean<{ pricing: { vat?: number } }[]>(),
  ]);
  const po = Object.fromEntries(payouts.map((r: { _id: string; amount: number; count: number }) => [r._id, r]));
  return {
    awaitingPayment: awaiting.reduce((t, x) => t + (x.pricing.total ?? 0) + (x.pricing.securityDeposit ?? 0), 0),
    awaitingCount: awaiting.length,
    payoutDue: (po.due?.amount ?? 0) + (po.on_hold?.amount ?? 0),
    payoutDueCount: (po.due?.count ?? 0) + (po.on_hold?.count ?? 0),
    payoutPaid: po.paid?.amount ?? 0,
    payoutUpcoming: po.not_due?.amount ?? 0,
    vatCollected: vat.reduce((t, x) => t + (x.pricing.vat ?? 0), 0),
    due: m.due?.amount ?? 0,
    dueCount: m.due?.count ?? 0,
    paid: m.paid?.amount ?? 0,
    upcoming: m.not_due?.amount ?? 0,
    bookedValue: booked[0]?.total ?? 0,
    bookedNights: booked[0]?.nights ?? 0,
    bookedCount: booked[0]?.count ?? 0,
  };
}

export async function getHostOverview(userId: string) {
  await connectDB();
  const today = todayLagos();
  const ids = await Property.find({ owner: userId }).distinct("_id");
  const [user, byStatus, requests, upcoming, summary] = await Promise.all([
    User.findById(userId).select("name hostProfile").lean(),
    Property.aggregate([{ $match: { owner: oid(userId) } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.find({ property: { $in: ids }, status: "pending" }).sort("createdAt").limit(5).populate("property", "title slug images").lean(),
    Booking.find({ property: { $in: ids }, status: { $in: ["confirmed", "checked_in"] }, "dates.checkOut": { $gte: today } })
      .sort("dates.checkIn")
      .limit(6)
      .populate("property", "title slug images")
      .lean(),
    getCommissionSummary({ userId, userType: "host" } as AuthedSession),
  ]);
  const st = Object.fromEntries(byStatus.map((s: { _id: string; count: number }) => [s._id, s.count])) as Record<string, number>;
  return {
    hostProfile: toPlain<{ name: string; hostProfile?: HostProfile }>(user)?.hostProfile ?? {},
    listings: { total: Object.values(st).reduce((a, b) => a + b, 0), live: st.available ?? 0, pending: st.pending ?? 0, rejected: st.rejected ?? 0 },
    requests: toPlain<ManagedBooking[]>(requests),
    upcoming: toPlain<ManagedBooking[]>(upcoming),
    summary,
  };
}

export async function getCalendarData(session: AuthedSession, propertyId?: string) {
  await connectDB();
  const q: Record<string, unknown> = { propertyType: "shortlet" };
  if (session.userType !== "admin") q.owner = session.userId;
  const apartments = toPlain<Pick<PropertyDoc, "_id" | "title" | "status" | "images">[]>(
    await Property.find(q).select("title status images").sort({ status: 1, title: 1 }).limit(300).lean(),
  );
  const selected = apartments.find((a) => a._id === propertyId) ?? apartments[0];
  if (!selected) return { apartments, selected: null, bookings: [], blocks: [] };
  const from = new Date(todayLagos().getTime() - 31 * 86400000);
  const [bookings, blocks] = await Promise.all([
    Booking.find({ property: selected._id, status: { $in: ["pending", "confirmed", "checked_in", "checked_out"] }, "dates.checkOut": { $gte: from } })
      .select("bookingReference guest dates status")
      .sort("dates.checkIn")
      .lean(),
    BlockedDate.find({ property: selected._id, endDate: { $gte: from } }).sort("startDate").lean(),
  ]);
  return {
    apartments,
    selected,
    bookings: toPlain<Pick<BookingDoc, "_id" | "bookingReference" | "guest" | "dates" | "status">[]>(bookings),
    blocks: toPlain<{ _id: string; startDate: string; endDate: string; reason?: string; notes?: string }[]>(blocks),
  };
}

export async function getHosts(f: { status?: string; q?: string }) {
  await connectDB();
  const query: Record<string, unknown> = { userType: "host" };
  if (f.status && f.status !== "all") {
    if (f.status === "unsigned") {
      query["hostProfile.status"] = "approved";
      query["hostProfile.agreement.status"] = { $ne: "accepted" };
    } else query["hostProfile.status"] = f.status;
  }
  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q), "i");
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }, { "hostProfile.businessName": rx }, { "hostProfile.city": rx }];
  }
  const hosts = toPlain<{ _id: string; name: string; email: string; phone: string; isSuspended?: boolean; createdAt: string; hostProfile?: HostProfile }[]>(
    await User.find(query).select("name email phone isSuspended createdAt hostProfile").sort({ "hostProfile.status": 1, createdAt: -1 }).limit(200).lean(),
  );
  const ids = hosts.map((h) => oid(h._id));
  const [listings, bookingCounts, dueSums, counts] = await Promise.all([
    Property.aggregate([{ $match: { owner: { $in: ids } } }, { $group: { _id: { owner: "$owner", status: "$status" }, count: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { host: { $in: ids } } }, { $group: { _id: "$host", count: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { host: { $in: ids }, "payout.status": { $in: ["due", "on_hold"] } } }, { $group: { _id: "$host", due: { $sum: "$payout.amount" } } }]),
    User.aggregate([{ $match: { userType: "host" } }, { $group: { _id: "$hostProfile.status", count: { $sum: 1 } } }]),
  ]);
  const dueMap = Object.fromEntries((dueSums as { _id: Types.ObjectId; due: number }[]).map((d) => [String(d._id), d.due]));
  const bookings = (bookingCounts as { _id: Types.ObjectId; count: number }[]).map((b) => ({ ...b, due: dueMap[String(b._id)] ?? 0 }));
  const lmap: Record<string, Record<string, number>> = {};
  for (const l of listings as { _id: { owner: Types.ObjectId; status: string }; count: number }[]) {
    const k = String(l._id.owner);
    lmap[k] = { ...(lmap[k] ?? {}), [l._id.status]: l.count };
  }
  const bmap = Object.fromEntries((bookings as { _id: Types.ObjectId; count: number; due: number }[]).map((b) => [String(b._id), b]));
  const cmap = Object.fromEntries((counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]));
  const unsigned = await User.countDocuments({ userType: "host", "hostProfile.status": "approved", "hostProfile.agreement.status": { $ne: "accepted" } });
  return {
    hosts: hosts.map((h) => ({ ...h, listings: lmap[h._id] ?? {}, bookings: bmap[h._id]?.count ?? 0, payoutDue: bmap[h._id]?.due ?? 0 })),
    counts: { pending: cmap.pending ?? 0, approved: cmap.approved ?? 0, rejected: cmap.rejected ?? 0, unsigned, all: Object.values(cmap).reduce((a, b) => a + b, 0) },
  };
}

export async function getApartmentsAdminSnapshot() {
  await connectDB();
  const today = todayLagos();
  const [hostsPending, unsigned, requests, upcoming, due, awaiting] = await Promise.all([
    User.countDocuments({ userType: "host", "hostProfile.status": "pending" }),
    User.countDocuments({ userType: "host", "hostProfile.status": "approved", "hostProfile.agreement.status": { $ne: "accepted" } }),
    Booking.countDocuments({ status: "pending" }),
    Booking.countDocuments({ status: "confirmed", "dates.checkIn": { $gte: today } }),
    Booking.aggregate([{ $match: { "payout.status": { $in: ["due", "on_hold"] } } }, { $group: { _id: null, amount: { $sum: "$payout.amount" } } }]),
    Booking.countDocuments({ status: "confirmed", "payment.status": { $ne: "paid" } }),
  ]);
  return { hostsPending, unsigned, requests, upcoming, payoutDue: due[0]?.amount ?? 0, awaitingPayment: awaiting };
}
