import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Project } from "@/lib/models";
import { PageHeader } from "@/components/dashboard/ui";
import { ProjectForm } from "@/components/dashboard/content-forms";
import type { ProjectDoc } from "@/lib/types";

export const metadata = { title: "Edit project" };

// /dashboard/projects/new creates; /dashboard/projects/<id> edits.
export default async function ProjectEditor({ params }: PageProps<"/dashboard/projects/[id]">) {
  await requireUser(["admin"]);
  const { id } = await params;
  let project: ProjectDoc | undefined;
  if (id !== "new") {
    if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
    await connectDB();
    const doc = await Project.findById(id).lean();
    if (!doc) notFound();
    project = toPlain<ProjectDoc>(doc);
  }
  return (
    <>
      <Link href="/dashboard/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink"><ArrowLeft className="size-4" /> Projects</Link>
      <PageHeader title={project ? `Edit ${project.name}` : "New project"} />
      <ProjectForm project={project} />
    </>
  );
}
