import "server-only";
import { Types } from "mongoose";
import { connectDB, toPlain } from "./db";
import { FractionalDistribution, FractionalHolding, FractionalOffering, FractionalOrder, FractionalResale, User } from "./models";
import { escapeRegex } from "./format";
import { PUBLIC_STATUSES, TRADABLE_STATUSES, type OfferingDoc, type OrderDoc } from "./fractional";

const oid = (id: string) => new Types.ObjectId(id);
export const isId = (id?: string) => !!id && /^[a-f0-9]{24}$/i.test(id);

export interface ResaleDoc {
  _id: string;
  offering: string | Pick<OfferingDoc, "_id" | "title" | "slug" | "images" | "unitPrice" | "currentUnitValue" | "location" | "status" | "projections" | "fees">;
  seller: string;
  units: number;
  unitsReserved: number;
  unitsSold: number;
  pricePerUnit: number;
  status: "listed" | "sold" | "withdrawn";
  createdAt: string;
}

export interface HoldingDoc {
  _id: string;
  offering: OfferingDoc;
  units: number;
  unitsListed: number;
  costBasis: number;
  distributionsReceived: number;
  firstAcquiredAt?: string;
}

/** Gives back the units an unpaid order was holding. Safe to call once per order. */
export async function releaseReservation(order: { offering: unknown; units: number; source: string; resale?: unknown }) {
  if (order.source === "resale" && order.resale) {
    await FractionalResale.updateOne({ _id: order.resale }, { $inc: { unitsReserved: -order.units } });
  } else {
    await FractionalOffering.updateOne({ _id: order.offering }, { $inc: { unitsReserved: -order.units } });
  }
}

/** Unpaid orders past their hold time expire and their units go back on sale. Runs on page loads. */
export async function expireStaleOrders() {
  await connectDB();
  const stale = await FractionalOrder.find({ status: "pending_payment", expiresAt: { $lt: new Date() } }).select("_id offering units source resale").lean<
    { _id: Types.ObjectId; offering: Types.ObjectId; units: number; source: string; resale?: Types.ObjectId }[]
  >();
  for (const o of stale) {
    // Only the call that flips the status releases the units.
    const r = await FractionalOrder.updateOne(
      { _id: o._id, status: "pending_payment" },
      { $set: { status: "expired" }, $push: { history: { status: "expired", by: "system", note: "Payment not received in time" } } },
    );
    if (r.modifiedCount) await releaseReservation(o);
  }
}

export async function getPublicOfferings(f: { stage?: string; state?: string; q?: string; status?: string } = {}) {
  await connectDB();
  await expireStaleOrders();
  const query: Record<string, unknown> = { status: { $in: f.status === "closed" ? ["funded", "active", "exited"] : f.status === "open" ? ["live"] : PUBLIC_STATUSES } };
  if (f.stage === "off_plan" || f.stage === "income") query.stage = f.stage;
  if (f.state) query["location.state"] = f.state;
  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q), "i");
    query.$or = [{ title: rx }, { "location.city": rx }, { "location.state": rx }, { summary: rx }];
  }
  const items = await FractionalOffering.find(query)
    .select("-documents -updates -history -paymentAccount")
    .sort({ status: 1, featured: -1, goLiveAt: -1, createdAt: -1 })
    .populate("developer", "name developerProfile.company")
    .lean();
  // "live" sorts before the closed statuses alphabetically except "active"/"exited"/"funded"; order explicitly.
  const rank: Record<string, number> = { live: 0, funded: 1, active: 2, exited: 3 };
  return toPlain<OfferingDoc[]>(items).sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
}

export async function getFractionalStats() {
  await connectDB();
  const [rows, investors, paid] = await Promise.all([
    FractionalOffering.find({ status: { $in: PUBLIC_STATUSES } }).select("unitsSold unitPrice").lean<{ unitsSold: number; unitPrice: number }[]>(),
    FractionalHolding.distinct("investor", { units: { $gt: 0 } }),
    FractionalDistribution.aggregate([{ $group: { _id: null, net: { $sum: "$net" } } }]),
  ]);
  const raised = rows.reduce((a, r) => a + (r.unitsSold || 0) * (r.unitPrice || 0), 0);
  return { offerings: rows.length, raised, investors: investors.length, distributed: paid[0]?.net ?? 0 };
}

export async function getOfferingBySlug(slug: string) {
  await connectDB();
  await expireStaleOrders();
  const o = await FractionalOffering.findOne({ slug })
    .populate("developer", "name developerProfile.company developerProfile.website developerProfile.projectsCompleted developerProfile.status")
    .lean();
  if (!o) return null;
  return toPlain<OfferingDoc>(o);
}

export async function getOfferingResales(offeringId: string) {
  await connectDB();
  const items = await FractionalResale.find({ offering: offeringId, status: "listed" }).sort({ pricePerUnit: 1, createdAt: 1 }).lean();
  return toPlain<ResaleDoc[]>(items).filter((r) => r.units - r.unitsSold - r.unitsReserved > 0);
}

export async function getMarketListings() {
  await connectDB();
  await expireStaleOrders();
  const tradable = await FractionalOffering.find({ status: { $in: TRADABLE_STATUSES }, resaleEnabled: true }).distinct("_id");
  const items = await FractionalResale.find({ offering: { $in: tradable }, status: "listed" })
    .sort({ createdAt: -1 })
    .populate("offering", "title slug images unitPrice currentUnitValue location status projections fees")
    .lean();
  return toPlain<ResaleDoc[]>(items).filter((r) => r.units - r.unitsSold - r.unitsReserved > 0);
}

/** Amount committed by an investor (confirmed + in-progress orders) in the last 12 months. */
export async function investedLast12Months(investorId: string) {
  const since = new Date(Date.now() - 365 * 86_400_000);
  const agg = await FractionalOrder.aggregate([
    { $match: { investor: oid(investorId), status: { $in: ["pending_payment", "payment_submitted", "confirmed"] }, createdAt: { $gte: since } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return agg[0]?.total ?? 0;
}

export async function getInvestorProfile(userId: string) {
  await connectDB();
  const u = await User.findById(userId).select("name email phone userType investorProfile").lean();
  return toPlain<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    userType: string;
    investorProfile?: {
      category?: "retail" | "sophisticated" | "hnw";
      annualIncome?: number;
      occupation?: string;
      address?: string;
      city?: string;
      state?: string;
      idType?: string;
      idDocument?: { key?: string; name?: string };
      kycStatus?: "none" | "pending" | "approved" | "rejected";
      kycNote?: string;
      kycSubmittedAt?: string;
      riskAcknowledgedAt?: string;
      bankDetails?: { bankName?: string; accountNumber?: string; accountName?: string };
    };
  } | null>(u);
}

export async function getPortfolio(userId: string) {
  await connectDB();
  await expireStaleOrders();
  const [holdings, orders, distributions, listings] = await Promise.all([
    FractionalHolding.find({ investor: userId, $or: [{ units: { $gt: 0 } }, { distributionsReceived: { $gt: 0 } }] })
      .populate("offering", "-documents -history -paymentAccount")
      .sort({ updatedAt: -1 })
      .lean(),
    FractionalOrder.find({ investor: userId }).sort({ createdAt: -1 }).limit(50).populate("offering", "title slug images status").lean(),
    FractionalDistribution.find({ "lines.investor": userId }).sort({ declaredAt: -1 }).limit(50).populate("offering", "title slug").lean(),
    FractionalResale.find({ seller: userId, status: "listed" }).populate("offering", "title slug images unitPrice currentUnitValue").sort({ createdAt: -1 }).lean(),
  ]);
  const h = toPlain<HoldingDoc[]>(holdings).filter((x) => x.offering);
  const value = h.reduce((a, x) => a + x.units * (x.offering.currentUnitValue || x.offering.unitPrice), 0);
  const cost = h.reduce((a, x) => a + x.costBasis, 0);
  const income = h.reduce((a, x) => a + x.distributionsReceived, 0);
  type Dist = { _id: string; offering: { _id: string; title: string; slug: string }; kind: string; period?: string; perUnit?: number; declaredAt: string; lines: { investor: string; units: number; amount: number; status: string; paidAt?: string }[] };
  const mine = toPlain<Dist[]>(distributions).map((d) => ({ ...d, line: d.lines.find((l) => String(l.investor) === userId)!, lines: undefined }));
  return {
    holdings: h,
    orders: toPlain<OrderDoc[]>(orders),
    distributions: mine,
    listings: toPlain<ResaleDoc[]>(listings),
    totals: { value, cost, income, gain: value - cost, properties: h.filter((x) => x.units > 0).length, units: h.reduce((a, x) => a + x.units, 0) },
  };
}

export async function getOrderForUser(reference: string, userId: string, isAdmin: boolean) {
  await connectDB();
  await expireStaleOrders();
  const o = await FractionalOrder.findOne({ reference })
    .populate("offering", "title slug images paymentAccount status unitPrice fees")
    .populate("investor", "name email phone investorProfile.kycStatus investorProfile.category")
    .populate("seller", "name")
    .lean<{ investor: { _id: Types.ObjectId } }>();
  if (!o) return null;
  if (!isAdmin && String(o.investor._id) !== userId) return null;
  return toPlain<OrderDoc>(o);
}

export async function getDeveloperOfferings(developerId?: string) {
  await connectDB();
  await expireStaleOrders();
  const q = developerId ? { developer: developerId } : {};
  const items = await FractionalOffering.find(q).select("-documents -updates -history").sort({ updatedAt: -1 }).populate("developer", "name email developerProfile.company").lean();
  const plain = toPlain<OfferingDoc[]>(items);
  const investors = await FractionalHolding.aggregate([
    { $match: { offering: { $in: plain.map((p) => oid(p._id)) }, units: { $gt: 0 } } },
    { $group: { _id: "$offering", count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(investors.map((i: { _id: Types.ObjectId; count: number }) => [String(i._id), i.count]));
  return plain.map((p) => ({ ...p, investorCount: map[p._id] ?? 0 }));
}

export async function getOfferingForManage(id: string, userId: string, isAdmin: boolean) {
  if (!isId(id)) return null;
  await connectDB();
  const o = await FractionalOffering.findById(id).populate("developer", "name email phone developerProfile").lean<{ developer: { _id: Types.ObjectId } }>();
  if (!o) return null;
  if (!isAdmin && String(o.developer._id) !== userId) return null;
  const [holders, orders, distributions] = await Promise.all([
    FractionalHolding.find({ offering: id, units: { $gt: 0 } }).sort({ units: -1 }).populate("investor", "name email phone").lean(),
    FractionalOrder.find({ offering: id }).sort({ createdAt: -1 }).limit(100).populate("investor", "name email").lean(),
    FractionalDistribution.find({ offering: id }).sort({ declaredAt: -1 }).lean(),
  ]);
  type Holder = { _id: string; investor: { _id: string; name: string; email: string; phone?: string }; units: number; costBasis: number };
  type Dist = { _id: string; kind: string; period?: string; gross: number; managementFee: number; net: number; perUnit?: number; declaredAt: string; lines: { _id: string; investor: string; units: number; amount: number; status: string }[] };
  return {
    offering: toPlain<OfferingDoc>(o),
    holders: toPlain<Holder[]>(holders),
    orders: toPlain<OrderDoc[]>(orders),
    distributions: toPlain<Dist[]>(distributions),
  };
}

/* ---------- Admin ---------- */

export async function getAdminOrders(f: { status?: string; q?: string }) {
  await connectDB();
  await expireStaleOrders();
  const query: Record<string, unknown> = {};
  if (f.status === "open") query.status = { $in: ["pending_payment", "payment_submitted"] };
  else if (f.status === "payouts") query["sellerPayout.status"] = "due";
  else if (f.status && f.status !== "all") query.status = f.status;
  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q), "i");
    query.$or = [{ reference: rx }, { offeringTitle: rx }, { "payment.payerName": rx }, { "payment.reference": rx }];
  }
  const [items, counts, payouts] = await Promise.all([
    FractionalOrder.find(query)
      .sort({ status: 1, createdAt: -1 })
      .limit(100)
      .populate("investor", "name email phone investorProfile.kycStatus investorProfile.category")
      .populate("seller", "name email investorProfile.bankDetails")
      .populate("offering", "title slug status")
      .lean(),
    FractionalOrder.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    FractionalOrder.countDocuments({ "sellerPayout.status": "due" }),
  ]);
  const c = Object.fromEntries(counts.map((x: { _id: string; count: number }) => [x._id, x.count])) as Record<string, number>;
  const out: Record<string, number> = { ...c, payouts, open: (c.pending_payment ?? 0) + (c.payment_submitted ?? 0) };
  return { items: toPlain<OrderDoc[]>(items), counts: out };
}

export async function getInvestorsForReview(f: { status?: string; q?: string }) {
  await connectDB();
  const status = f.status || "pending";
  const query: Record<string, unknown> = { "investorProfile.kycStatus": status === "all" ? { $in: ["pending", "approved", "rejected"] } : status };
  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q), "i");
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [items, counts, developers] = await Promise.all([
    User.find(query).select("name email phone userType investorProfile createdAt").sort({ "investorProfile.kycSubmittedAt": 1 }).limit(100).lean(),
    User.aggregate([{ $match: { "investorProfile.kycStatus": { $in: ["pending", "approved", "rejected"] } } }, { $group: { _id: "$investorProfile.kycStatus", count: { $sum: 1 } } }]),
    User.find({ userType: "developer" }).select("name email phone developerProfile createdAt").sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  const ids = items.map((u) => u._id as Types.ObjectId);
  const invested = await FractionalHolding.aggregate([{ $match: { investor: { $in: ids } } }, { $group: { _id: "$investor", cost: { $sum: "$costBasis" } } }]);
  const map = Object.fromEntries(invested.map((x: { _id: Types.ObjectId; cost: number }) => [String(x._id), x.cost]));
  type Inv = NonNullable<Awaited<ReturnType<typeof getInvestorProfile>>> & { createdAt: string };
  type Dev = { _id: string; name: string; email: string; phone: string; createdAt: string; developerProfile?: { company?: string; rcNumber?: string; city?: string; state?: string; website?: string; projectsCompleted?: number; about?: string; status?: string; reviewNote?: string } };
  return {
    investors: toPlain<Inv[]>(items).map((u) => ({ ...u, invested: map[u._id] ?? 0 })),
    developers: toPlain<Dev[]>(developers),
    counts: Object.fromEntries(counts.map((x: { _id: string; count: number }) => [x._id, x.count])) as Record<string, number>,
  };
}

export async function getFractionalAdminSnapshot() {
  await connectDB();
  const [review, openOrders, kyc, devs, live] = await Promise.all([
    FractionalOffering.countDocuments({ status: "in_review" }),
    FractionalOrder.countDocuments({ status: "payment_submitted" }),
    User.countDocuments({ "investorProfile.kycStatus": "pending" }),
    User.countDocuments({ userType: "developer", "developerProfile.status": "pending" }),
    FractionalOffering.countDocuments({ status: "live" }),
  ]);
  return { review, openOrders, kyc, devs, live };
}
