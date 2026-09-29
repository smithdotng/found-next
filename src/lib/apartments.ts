import "server-only";
import { cache } from "react";
import { Types } from "mongoose";
import { connectDB, toPlain } from "./db";
import { BlockedDate, Booking, Property } from "./models";
import { escapeRegex } from "./format";
import { HOLDING_STATUSES, isoDay, parseDay, todayLagos, type Range } from "./stay";
import type { PropertyDoc } from "./types";

export const APT_PAGE_SIZE = 12;

export interface ApartmentFilters {
  where?: string;
  state?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  amenities?: string[];
  sort?: string;
  page?: string;
}

export function parseApartmentFilters(sp: Record<string, string | string[] | undefined>): ApartmentFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  const amen = sp.amenities;
  return {
    where: one(sp.where),
    state: one(sp.state),
    checkIn: one(sp.checkIn),
    checkOut: one(sp.checkOut),
    guests: one(sp.guests),
    minPrice: one(sp.minPrice),
    maxPrice: one(sp.maxPrice),
    bedrooms: one(sp.bedrooms),
    amenities: (Array.isArray(amen) ? amen : amen ? amen.split(",") : []).filter(Boolean),
    sort: one(sp.sort),
    page: one(sp.page),
  };
}

/** Property IDs that are booked or blocked for any night in [checkIn, checkOut). */
async function unavailableIds(checkIn: Date, checkOut: Date, among?: Types.ObjectId[]) {
  const scope = among ? { property: { $in: among } } : {};
  const [booked, blocked] = await Promise.all([
    Booking.find({ ...scope, status: { $in: HOLDING_STATUSES }, "dates.checkIn": { $lt: checkOut }, "dates.checkOut": { $gt: checkIn } }).distinct("property"),
    BlockedDate.find({ ...scope, startDate: { $lt: checkOut }, endDate: { $gt: checkIn } }).distinct("property"),
  ]);
  return [...booked, ...blocked].map(String);
}

/** Live shortlets, with optional date availability, guests, budget and amenities. */
export async function searchApartments(f: ApartmentFilters) {
  await connectDB();
  const query: Record<string, unknown> = { status: "available", propertyType: "shortlet" };
  if (f.state) query["location.state"] = f.state;
  if (f.where) {
    const rx = new RegExp(escapeRegex(f.where), "i");
    query.$or = [{ "location.city": rx }, { "location.state": rx }, { "location.lga": rx }, { "location.landmark": rx }, { title: rx }];
  }
  const guests = parseInt(f.guests ?? "") || 0;
  if (guests > 0) query["shortletDetails.maxGuests"] = { $gte: guests };
  const beds = parseInt(f.bedrooms ?? "") || 0;
  if (beds > 0) query["features.bedrooms"] = { $gte: beds };
  if (f.minPrice || f.maxPrice) {
    const price: Record<string, number> = {};
    if (f.minPrice) price.$gte = parseInt(f.minPrice);
    if (f.maxPrice) price.$lte = parseInt(f.maxPrice);
    query.price = price;
  }
  if (f.amenities?.length) query["shortletDetails.amenities"] = { $all: f.amenities };

  const ci = parseDay(f.checkIn);
  const co = parseDay(f.checkOut);
  if (ci && co && co > ci) {
    const busy = await unavailableIds(ci, co);
    if (busy.length) query._id = { $nin: busy.map((id) => new Types.ObjectId(id)) };
  }

  let sort: Record<string, 1 | -1> = { featured: -1, views: -1, createdAt: -1 };
  if (f.sort === "price-asc") sort = { price: 1 };
  if (f.sort === "price-desc") sort = { price: -1 };
  if (f.sort === "newest") sort = { createdAt: -1 };

  const page = Math.max(1, parseInt(f.page ?? "1") || 1);
  const [items, total] = await Promise.all([
    Property.find(query)
      .populate("owner", "name userType hostProfile.businessName hostProfile.status realtorProfile.company realtorProfile.verified")
      .sort(sort)
      .skip((page - 1) * APT_PAGE_SIZE)
      .limit(APT_PAGE_SIZE)
      .lean(),
    Property.countDocuments(query),
  ]);
  return { items: toPlain<PropertyDoc[]>(items), total, page, totalPages: Math.max(1, Math.ceil(total / APT_PAGE_SIZE)) };
}

export const getApartmentCities = cache(async () => {
  await connectDB();
  const rows = await Property.find({ status: "available", propertyType: "shortlet" })
    .select("location.city location.state images views")
    .sort({ views: -1 })
    .limit(1000)
    .lean<{ location?: { city?: string; state?: string }; images?: { url: string }[] }[]>();
  const map = new Map<string, { city: string; state: string; count: number; image?: string }>();
  for (const r of rows) {
    const city = r.location?.city?.trim();
    if (!city) continue;
    const key = `${city.toLowerCase()}|${r.location?.state ?? ""}`;
    const cur = map.get(key) ?? { city, state: r.location?.state ?? "", count: 0, image: r.images?.[0]?.url };
    cur.count++;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
});

export const getApartment = cache(async (slug: string) => {
  await connectDB();
  const p = await Property.findOne({ slug, propertyType: "shortlet" })
    .populate("owner", "name phone profileImage userType createdAt realtorProfile hostProfile.businessName hostProfile.status hostProfile.about")
    .lean();
  return p ? toPlain<PropertyDoc & { owner: PropertyDoc["owner"] & { createdAt?: string } }>(p) : null;
});

/** Future nights that can't be booked (confirmed stays + host blocks), as exclusive-end ranges. */
export async function getUnavailableRanges(propertyId: string, horizonDays = 400): Promise<Range[]> {
  await connectDB();
  const from = todayLagos();
  const to = new Date(from.getTime() + horizonDays * 86400000);
  const [bookings, blocks] = await Promise.all([
    Booking.find({ property: propertyId, status: { $in: HOLDING_STATUSES }, "dates.checkOut": { $gt: from }, "dates.checkIn": { $lt: to } })
      .select("dates")
      .lean<{ dates: { checkIn: Date; checkOut: Date } }[]>(),
    BlockedDate.find({ property: propertyId, endDate: { $gt: from }, startDate: { $lt: to } })
      .select("startDate endDate")
      .lean<{ startDate: Date; endDate: Date }[]>(),
  ]);
  return [
    ...bookings.map((b) => ({ start: isoDay(b.dates.checkIn), end: isoDay(b.dates.checkOut) })),
    ...blocks.map((b) => ({ start: isoDay(b.startDate), end: isoDay(b.endDate) })),
  ];
}

/** True when no confirmed stay or block overlaps [checkIn, checkOut). */
export async function isRangeFree(propertyId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) {
  await connectDB();
  const bookingQuery: Record<string, unknown> = {
    property: propertyId,
    status: { $in: HOLDING_STATUSES },
    "dates.checkIn": { $lt: checkOut },
    "dates.checkOut": { $gt: checkIn },
  };
  if (excludeBookingId) bookingQuery._id = { $ne: excludeBookingId };
  const [b, x] = await Promise.all([
    Booking.exists(bookingQuery),
    BlockedDate.exists({ property: propertyId, startDate: { $lt: checkOut }, endDate: { $gt: checkIn } }),
  ]);
  return !b && !x;
}

export async function getSimilarApartments(p: PropertyDoc) {
  await connectDB();
  const items = await Property.find({ _id: { $ne: p._id }, propertyType: "shortlet", status: "available", "location.state": p.location?.state })
    .sort({ views: -1 })
    .limit(4)
    .lean();
  return toPlain<PropertyDoc[]>(items);
}
