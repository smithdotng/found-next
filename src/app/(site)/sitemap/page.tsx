import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Blog, Project, Property } from "@/lib/models";
import { PageHero } from "@/components/site/page-hero";
import { pageMetadata } from "@/lib/seo";
import { PROPERTY_TYPES } from "@/lib/format";

export const metadata: Metadata = pageMetadata({
  title: "Sitemap - Found Properties",
  absoluteTitle: true,
  description: "Every page on Found Properties: property categories, latest listings, projects and blog posts.",
  path: "/sitemap",
});

type Row = { _id: string; slug: string; title?: string; name?: string };

export default async function HtmlSitemap() {
  let properties: Row[] = [];
  let blogs: Row[] = [];
  let projects: Row[] = [];
  try {
    await connectDB();
    [properties, blogs, projects] = (await Promise.all([
      Property.find({ status: "available" }).select("title slug").sort("-createdAt").limit(60).lean(),
      Blog.find({ status: "published" }).select("title slug").sort("-publishedAt").limit(15).lean(),
      Project.find({ status: "published" }).select("name slug").sort("-createdAt").limit(30).lean(),
    ])) as unknown as [Row[], Row[], Row[]];
  } catch (e) {
    console.error("Sitemap error:", e);
  }

  const groups: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Main pages",
      links: [
        { href: "/", label: "Home" },
        { href: "/properties", label: "All properties" },
        { href: "/projects", label: "Projects" },
        { href: "/blog", label: "Blog" },
        { href: "/about", label: "About us" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/for-realtors", label: "For realtors" },
        { href: "/contact", label: "Contact" },
        { href: "/faq", label: "FAQ" },
      ],
    },
    { title: "Property types", links: PROPERTY_TYPES.map((t) => ({ href: `/properties?type=${t.value}`, label: t.plural })) },
    {
      title: "Accounts",
      links: [
        { href: "/login", label: "Sign in" },
        { href: "/register", label: "Register as a realtor" },
        { href: "/agent/register", label: "Become an agent" },
        { href: "/forgot-password", label: "Forgot password" },
      ],
    },
    { title: "Legal", links: [{ href: "/terms", label: "Terms of use" }, { href: "/privacy-policy", label: "Privacy policy" }] },
    { title: "Latest properties", links: properties.map((p) => ({ href: `/properties/${p.slug}`, label: p.title ?? p.slug })) },
    { title: "Projects", links: projects.map((p) => ({ href: `/projects/${p.slug}`, label: p.name ?? p.slug })) },
    { title: "Blog posts", links: blogs.map((b) => ({ href: `/blog/${b.slug}`, label: b.title ?? b.slug })) },
  ];

  return (
    <>
      <PageHero title="Sitemap" crumbs={[{ label: "Sitemap" }]} />
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {groups
          .filter((g) => g.links.length)
          .map((g) => (
            <section key={g.title}>
              <h2 className="font-semibold text-ink">{g.title}</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-slate-600 hover:text-brand-600">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </>
  );
}
