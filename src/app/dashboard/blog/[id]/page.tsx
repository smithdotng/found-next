import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Blog } from "@/lib/models";
import { PageHeader } from "@/components/dashboard/ui";
import { BlogForm } from "@/components/dashboard/content-forms";
import type { BlogDoc } from "@/lib/types";

export const metadata = { title: "Edit post" };

export default async function BlogEditor({ params }: PageProps<"/dashboard/blog/[id]">) {
  await requireUser(["admin"]);
  const { id } = await params;
  let blog: BlogDoc | undefined;
  if (id !== "new") {
    if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
    await connectDB();
    const doc = await Blog.findById(id).lean();
    if (!doc) notFound();
    blog = toPlain<BlogDoc>(doc);
  }
  return (
    <>
      <Link href="/dashboard/blog" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink"><ArrowLeft className="size-4" /> Blog</Link>
      <PageHeader title={blog ? "Edit post" : "New post"} />
      <BlogForm blog={blog} />
    </>
  );
}
