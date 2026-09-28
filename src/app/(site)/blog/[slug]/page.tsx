import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ArrowLeft } from "lucide-react";
import { getBlog } from "@/lib/queries";
import { connectDB, toPlain } from "@/lib/db";
import { Blog } from "@/lib/models";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { renderRichText } from "@/lib/content";
import type { BlogDoc } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { ShareBar } from "@/components/property/share-bar";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBlog(slug);
  if (!b) return pageMetadata({ title: "Post not found", path: `/blog/${slug}`, noIndex: true });
  // Same rules as the EJS blog/detail view.
  const base = pageMetadata({
    title: b.metaTitle || b.title,
    absoluteTitle: true,
    description: b.metaDescription || b.excerpt,
    path: `/blog/${b.slug}`,
    image: b.ogImage || b.featuredImage,
    type: "article",
    keywords: b.metaKeywords || b.tags?.join(", "),
    publishedTime: b.publishedAt,
    modifiedTime: b.updatedAt,
  });
  return { ...base, title: { absolute: `${b.title} - Found Blog` } };
}

export default async function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const b = await getBlog(slug);
  if (!b) notFound();

  after(async () => {
    await connectDB();
    await Blog.updateOne({ _id: b._id }, { $inc: { views: 1 } });
  });

  await connectDB();
  const related = toPlain<BlogDoc[]>(
    await Blog.find({ _id: { $ne: b._id }, status: "published", categories: { $in: b.categories ?? [] } })
      .sort("-publishedAt")
      .limit(3)
      .lean(),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: b.title,
    description: b.excerpt,
    image: absoluteUrl(b.featuredImage),
    datePublished: b.publishedAt,
    dateModified: b.updatedAt,
    author: { "@type": "Person", name: b.authorName },
    publisher: { "@type": "Organization", name: "Found Projects & Realty Limited", logo: { "@type": "ImageObject", url: absoluteUrl("/assets/images/logo2.png") } },
  };

  return (
    <article className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="container-page max-w-3xl pt-8 lg:pt-14">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-ink">
          <ArrowLeft className="size-4" /> All posts
        </Link>
        {b.categories?.length ? (
          <p className="mt-6 text-sm font-semibold text-brand-600">{b.categories.join(" · ")}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">{b.title}</h1>
        <p className="mt-4 text-lg text-slate-600">{b.excerpt}</p>
        <p className="mt-5 text-sm text-slate-500">
          By <span className="font-medium text-ink">{b.authorName}</span> · {formatDate(b.publishedAt)} · {b.readingTime || 1} min read
        </p>
      </header>
      <div className="container-page mt-8 max-w-5xl">
        <div className="relative aspect-[16/8] overflow-hidden rounded-3xl bg-slate-100">
          <SmartImage src={b.featuredImage} alt={b.title} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
        </div>
      </div>
      <div className="container-page mt-10 max-w-3xl">
        <div className="prose-found text-base leading-8" dangerouslySetInnerHTML={{ __html: renderRichText(b.content) }} />
        {b.tags?.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {b.tags.map((t) => (
              <span key={t} className="chip bg-slate-50 text-slate-600 ring-slate-500/10">#{t}</span>
            ))}
          </div>
        ) : null}
        <div className="mt-10 border-t border-slate-200 pt-6">
          <ShareBar url={absoluteUrl(`/blog/${b.slug}`)} title={b.title} text={b.title} />
        </div>
      </div>

      {related.length ? (
        <section className="container-page mt-16 max-w-5xl">
          <h2 className="mb-6 text-xl font-bold text-ink">Keep reading</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r._id} href={`/blog/${r.slug}`} className="group">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                  <SmartImage src={r.featuredImage} alt={r.title} fill sizes="33vw" className="object-cover transition group-hover:scale-105" />
                </div>
                <h3 className="mt-3 font-semibold leading-snug text-ink group-hover:text-brand-600">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
