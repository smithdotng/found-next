import "server-only";
import { cache } from "react";
import { connectDB, toPlain } from "./db";
import { Blog, FeaturedProperty, Project, Property } from "./models";
import { escapeRegex } from "./format";
import { slugify } from "./locations";
import type { BlogDoc, ProjectDoc, PropertyDoc } from "./types";

export const PAGE_SIZE = 12;

export interface PropertyFilters {
  type?: string;
  transactionType?: string;
  state?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  search?: string;
  sort?: string;
  tier?: string;
  page?: string;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): PropertyFilters {
  const keys: (keyof PropertyFilters)[] = [
    "type", "transactionType", "state", "city", "minPrice", "maxPrice", "bedrooms", "search", "sort", "tier", "page",
  ];
  const out: PropertyFilters = {};
  for (const k of keys) {
    const v = one(sp[k])?.trim();
    if (v) out[k] = v;
  }
  return out;
}

/** Same filters and ranking as the Express getAllProperties controller. */
export async function searchProperties(f: PropertyFilters) {
  await connectDB();
  const query: Record<string, unknown> = { status: "available" };
  if (f.type) query.propertyType = f.type;
  if (f.transactionType) query.transactionType = f.transactionType;
  if (f.state) query["location.state"] = f.state;
  if (f.city) query["location.city"] = new RegExp(`^${escapeRegex(f.city)}$`, "i");
  if (f.tier) query.listingTier = f.tier;
  if (f.bedrooms) query["features.bedrooms"] = { $gte: parseInt(f.bedrooms) || 0 };
  if (f.minPrice || f.maxPrice) {
    const price: Record<string, number> = {};
    if (f.minPrice) price.$gte = parseInt(f.minPrice);
    if (f.maxPrice) price.$lte = parseInt(f.maxPrice);
    query.price = price;
  }
  if (f.search) {
    // Regex search instead of $text: the old app's text index was never created
    // (create-text-index.js is empty), which made keyword search throw.
    const rx = new RegExp(escapeRegex(f.search), "i");
    query.$or = [
      { title: rx },
      { description: rx },
      { "location.city": rx },
      { "location.state": rx },
      { "location.address": rx },
      { "location.lga": rx },
    ];
  }

  let sort: Record<string, 1 | -1> = { listingTier: -1, featured: -1, createdAt: -1 };
  if (f.sort === "price-asc") sort = { price: 1, listingTier: -1 };
  if (f.sort === "price-desc") sort = { price: -1, listingTier: -1 };
  if (f.sort === "popular") sort = { views: -1, listingTier: -1 };
  if (f.sort === "newest") sort = { createdAt: -1 };

  const page = Math.max(1, parseInt(f.page ?? "1") || 1);
  const [items, total] = await Promise.all([
    Property.find(query)
      .populate("owner", "name")
      .sort(sort)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Property.countDocuments(query),
  ]);

  return {
    items: toPlain<PropertyDoc[]>(items),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export const getFacetCounts = cache(async () => {
  await connectDB();
  const [types, states] = await Promise.all([
    Property.aggregate([{ $match: { status: "available" } }, { $group: { _id: "$propertyType", count: { $sum: 1 } } }]),
    Property.aggregate([
      { $match: { status: "available" } },
      { $group: { _id: "$location.state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  return {
    types: Object.fromEntries(types.map((t: { _id: string; count: number }) => [t._id, t.count])) as Record<string, number>,
    states: states.filter((s: { _id?: string }) => s._id).map((s: { _id: string; count: number }) => ({ state: s._id, count: s.count })),
  };
});

/** Public lookup — only live listings are visible to visitors. */
export const getPublicProperty = cache(async (slug: string) => {
  await connectDB();
  const p = await Property.findOne({ slug }).populate("owner", "name email phone profileImage realtorProfile").lean();
  return p ? toPlain<PropertyDoc>(p) : null;
});

/** Resolve an area URL slug to the real city name for a state, but only if it has live listings. */
export async function findCityInState(state: string, areaSlug: string) {
  await connectDB();
  const cities = (await Property.distinct("location.city", { status: "available", "location.state": state })) as string[];
  const slug = slugify(areaSlug);
  return cities.find((c) => c && slugify(c) === slug) ?? null;
}

/** Every state+city that has live listings — powers the location pages' sitemap entries. */
export async function listAreasWithListings(): Promise<{ state: string; city: string; count: number }[]> {
  await connectDB();
  const rows = (await Property.aggregate([
    { $match: { status: "available", "location.state": { $nin: [null, ""] }, "location.city": { $nin: [null, ""] } } },
    { $group: { _id: { state: "$location.state", city: "$location.city" }, count: { $sum: 1 } } },
  ])) as { _id: { state: string; city: string }; count: number }[];
  return rows.map((r) => ({ state: r._id.state, city: r._id.city, count: r.count }));
}

export async function getSimilarProperties(p: PropertyDoc) {
  await connectDB();
  const LIMIT = 4;
  const base = { _id: { $ne: p._id }, propertyType: p.propertyType, status: "available" as const };
  // Prefer listings in the same city (same area reads better and strengthens internal linking),
  // then top up from the same state so the row is never empty.
  const sameCity = p.location?.city
    ? await Property.find({ ...base, "location.city": p.location.city }).limit(LIMIT).lean()
    : [];
  let items = sameCity;
  if (items.length < LIMIT && p.location?.state) {
    const exclude = [p._id, ...sameCity.map((x: { _id: unknown }) => x._id)];
    const topUp = await Property.find({ ...base, _id: { $nin: exclude }, "location.state": p.location.state })
      .limit(LIMIT - items.length)
      .lean();
    items = [...items, ...topUp];
  }
  return toPlain<PropertyDoc[]>(items);
}

export async function getHomeData() {
  await connectDB();
  const [featured, latest, blogs, projects, facets, totalLive] = await Promise.all([
    FeaturedProperty.find({ isActive: true }).populate("property").sort("displayOrder").limit(4).lean(),
    Property.find({ status: "available" }).sort("-createdAt").limit(8).lean(),
    Blog.find({ status: "published" }).sort("-publishedAt").limit(3).lean(),
    Project.find({ status: "published" }).sort({ featured: -1, order: 1, createdAt: -1 }).limit(3).lean(),
    getFacetCounts(),
    Property.countDocuments({ status: "available" }),
  ]);
  type Featured = {
    _id: string;
    title: string;
    description?: string;
    image?: string;
    badge?: { text?: string; color?: string };
    property: PropertyDoc | null;
  };
  return {
    featured: toPlain<Featured[]>(featured).filter((f) => f.property && f.property.status === "available"),
    latest: toPlain<PropertyDoc[]>(latest),
    blogs: toPlain<BlogDoc[]>(blogs),
    projects: toPlain<ProjectDoc[]>(projects),
    facets,
    totalLive,
  };
}

export async function getPropertiesByIds(ids: string[]) {
  await connectDB();
  const valid = ids.filter((id) => /^[a-f0-9]{24}$/i.test(id)).slice(0, 100);
  if (!valid.length) return [];
  const items = await Property.find({ _id: { $in: valid }, status: "available" }).lean();
  const list = toPlain<PropertyDoc[]>(items);
  return valid.map((id) => list.find((p) => p._id === id)).filter(Boolean) as PropertyDoc[];
}

export async function getPublishedProjects() {
  await connectDB();
  const items = await Project.find({ status: "published" }).sort({ featured: -1, order: 1, createdAt: -1 }).lean();
  return toPlain<ProjectDoc[]>(items);
}

export const getProject = cache(async (slug: string) => {
  await connectDB();
  const p = await Project.findOne({ slug, status: "published" }).lean();
  return p ? toPlain<ProjectDoc>(p) : null;
});

export async function getPublishedBlogs(opts: { category?: string; page?: number } = {}) {
  await connectDB();
  const q: Record<string, unknown> = { status: "published" };
  if (opts.category) q.categories = opts.category;
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 9;
  const [items, total] = await Promise.all([
    Blog.find(q).sort("-publishedAt").skip((page - 1) * perPage).limit(perPage).lean(),
    Blog.countDocuments(q),
  ]);
  return { items: toPlain<BlogDoc[]>(items), total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export const getBlog = cache(async (slug: string) => {
  await connectDB();
  const b = await Blog.findOne({ slug, status: "published" }).lean();
  return b ? toPlain<BlogDoc>(b) : null;
});
