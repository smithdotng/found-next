import Link from "next/link";
import { ExternalLink, Newspaper, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Blog } from "@/lib/models";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { SmartImage } from "@/components/ui/smart-image";
import { deleteBlog } from "@/app/actions/content";
import { formatDate } from "@/lib/format";
import type { BlogDoc } from "@/lib/types";

export const metadata = { title: "Blog" };

const TONE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft: "bg-slate-100 text-slate-700 ring-slate-500/20",
  archived: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

export default async function BlogAdmin() {
  await requireUser(["admin"]);
  await connectDB();
  const posts = toPlain<BlogDoc[]>(await Blog.find().sort("-createdAt").lean());
  return (
    <>
      <PageHeader title="Blog" description="Posts on /blog. Published posts use their featured image for social previews." actions={<Link href="/dashboard/blog/new" className="btn-primary"><PlusCircle className="size-4" /> New post</Link>} />
      {posts.length ? (
        <div className="card divide-y divide-slate-100">
          {posts.map((b) => (
            <div key={b._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <SmartImage src={b.featuredImage} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink">{b.title}</span>
                    <span className={`chip capitalize ${TONE[b.status]}`}>{b.status}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.authorName} · {b.status === "published" ? `published ${formatDate(b.publishedAt)}` : `created ${formatDate(b.createdAt)}`} · {b.views ?? 0} views
                    {b.categories?.length ? ` · ${b.categories.join(", ")}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {b.status === "published" ? <Link href={`/blog/${b.slug}`} target="_blank" className="btn-ghost btn-sm" aria-label="View"><ExternalLink className="size-3.5" /></Link> : null}
                <Link href={`/dashboard/blog/${b._id}`} className="btn-outline btn-sm"><Pencil className="size-3.5" /> Edit</Link>
                <ActionButton action={deleteBlog.bind(null, b._id)} confirm={`Delete “${b.title}”?`} className="btn-ghost btn-sm text-rose-600" label="Delete post">
                  <Trash2 className="size-3.5" />
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Newspaper} title="No posts yet" action={<Link href="/dashboard/blog/new" className="btn-primary">Write the first post</Link>} />
      )}
    </>
  );
}
