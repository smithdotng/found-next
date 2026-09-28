import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { getPublishedBlogs } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";
import { BLOG_CATEGORIES, formatDate } from "@/lib/format";
import { SmartImage } from "@/components/ui/smart-image";
import { Pagination } from "@/components/ui/pagination";

export async function generateMetadata({ searchParams }: PageProps<"/blog">): Promise<Metadata> {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  return pageMetadata({
    title: category ? `${category} - Found Properties Blog` : "Found Properties Blog - Real Estate Insights Nigeria",
    absoluteTitle: true,
    description: "Market news, buying and renting guides, investment insight and legal tips for Nigerian real estate from the Found team.",
    path: category ? `/blog?category=${encodeURIComponent(category)}` : "/blog",
  });
}

export default async function BlogIndex({ searchParams }: PageProps<"/blog">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const page = parseInt(typeof sp.page === "string" ? sp.page : "1") || 1;
  const { items, totalPages } = await getPublishedBlogs({ category, page });
  const [lead, ...rest] = items;

  return (
    <div className="container-page py-10 lg:py-14">
      <p className="text-sm font-semibold text-coral-500">Insights</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">The Found blog</h1>

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        <CatLink href="/blog" on={!category}>All</CatLink>
        {BLOG_CATEGORIES.map((c) => (
          <CatLink key={c} href={`/blog?category=${encodeURIComponent(c)}`} on={category === c}>
            {c}
          </CatLink>
        ))}
      </div>

      {!items.length ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No posts here yet.</p>
      ) : null}

      {lead && page === 1 ? (
        <Link href={`/blog/${lead.slug}`} className="group mt-8 grid overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-2">
          <div className="relative aspect-[16/10] bg-slate-100 md:aspect-auto md:min-h-80">
            <SmartImage src={lead.featuredImage} alt={lead.title} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{lead.categories?.[0] ?? "Featured"}</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-ink group-hover:text-brand-600">{lead.title}</h2>
            <p className="mt-3 line-clamp-3 text-slate-600">{lead.excerpt}</p>
            <p className="mt-5 text-xs text-slate-500">
              {lead.authorName} · {formatDate(lead.publishedAt)} · {lead.readingTime || 1} min read
            </p>
          </div>
        </Link>
      ) : null}

      <div className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {(page === 1 ? rest : items).map((b) => (
          <Link key={b._id} href={`/blog/${b.slug}`} className="group">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
              <SmartImage src={b.featuredImage} alt={b.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {b.categories?.[0] ? <span className="font-semibold text-brand-600">{b.categories[0]} · </span> : null}
              {formatDate(b.publishedAt)} · {b.readingTime || 1} min read
            </p>
            <h2 className="mt-1 font-semibold leading-snug text-ink group-hover:text-brand-600">{b.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{b.excerpt}</p>
          </Link>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/blog" params={{ category }} />
    </div>
  );
}

function CatLink({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={clsx(
        "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
        on ? "bg-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
    >
      {children}
    </Link>
  );
}
