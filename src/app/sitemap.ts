import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Blog, Project, Property } from "@/lib/models";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Same URL set and priorities as the Express /sitemap.xml route.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPages: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
    ["/", "daily", 1.0],
    ["/properties", "daily", 0.9],
    ["/apartments", "daily", 0.9],
    ["/host", "monthly", 0.6],
    ["/projects", "weekly", 0.8],
    ["/blog", "weekly", 0.7],
    ["/about", "monthly", 0.6],
    ["/how-it-works", "monthly", 0.6],
    ["/for-realtors", "monthly", 0.6],
    ["/get-verified", "monthly", 0.6],
    ["/contact", "monthly", 0.5],
    ["/faq", "monthly", 0.5],
    ["/terms", "yearly", 0.3],
    ["/privacy-policy", "yearly", 0.3],
    ["/sitemap", "weekly", 0.3],
  ];
  const out: MetadataRoute.Sitemap = staticPages.map(([p, changeFrequency, priority]) => ({ url: base + p, changeFrequency, priority }));

  try {
    await connectDB();
    const [properties, blogs, projects] = await Promise.all([
      Property.find({ status: "available" }).select("slug updatedAt propertyType").sort("-createdAt").limit(5000).lean(),
      Blog.find({ status: "published" }).select("slug updatedAt").sort("-publishedAt").limit(2000).lean(),
      Project.find({ status: "published" }).select("slug updatedAt").sort("-createdAt").limit(2000).lean(),
    ]);
    type Row = { slug?: string; updatedAt?: Date; propertyType?: string };
    for (const p of properties as Row[])
      if (p.slug)
        out.push({ url: `${base}/${p.propertyType === "shortlet" ? "apartments" : "properties"}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.8 });
    for (const b of blogs as Row[]) if (b.slug) out.push({ url: `${base}/blog/${b.slug}`, lastModified: b.updatedAt, changeFrequency: "monthly", priority: 0.6 });
    for (const pr of projects as Row[]) if (pr.slug) out.push({ url: `${base}/projects/${pr.slug}`, lastModified: pr.updatedAt, changeFrequency: "weekly", priority: 0.7 });
  } catch (e) {
    console.error("XML sitemap error:", e);
  }
  return out;
}
