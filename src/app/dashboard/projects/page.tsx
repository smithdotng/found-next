import Link from "next/link";
import { ExternalLink, Landmark, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { Project, ProjectInquiry } from "@/lib/models";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { SmartImage } from "@/components/ui/smart-image";
import { deleteProject } from "@/app/actions/content";
import { formatPrice, timeAgo } from "@/lib/format";
import type { ProjectDoc } from "@/lib/types";

export const metadata = { title: "Projects" };

const STATUS_TONE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft: "bg-slate-100 text-slate-700 ring-slate-500/20",
  archived: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

export default async function ProjectsAdmin() {
  await requireUser(["admin"]);
  await connectDB();
  const [items, leads] = await Promise.all([
    Project.find().sort({ order: 1, createdAt: -1 }).lean(),
    ProjectInquiry.aggregate([{ $group: { _id: "$project", count: { $sum: 1 } } }]),
  ]);
  const lc = Object.fromEntries(leads.map((l: { _id: unknown; count: number }) => [String(l._id), l.count]));
  const projects = toPlain<ProjectDoc[]>(items);
  return (
    <>
      <PageHeader title="Projects" description="Developments and estates shown on /projects." actions={<Link href="/dashboard/projects/new" className="btn-primary"><PlusCircle className="size-4" /> New project</Link>} />
      {projects.length ? (
        <div className="card divide-y divide-slate-100">
          {projects.map((p) => (
            <div key={p._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <SmartImage src={p.media?.featuredImage} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink">{p.name}</span>
                    <span className={`chip capitalize ${STATUS_TONE[p.status]}`}>{p.status}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.developer?.name} · {p.location?.city} · {p.pricing?.startingPrice ? `from ${formatPrice(p.pricing.startingPrice)}` : "price on request"} · {p.views ?? 0} views · {lc[p._id] ?? 0} enquiries · updated {timeAgo(p.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {p.status === "published" ? <Link href={`/projects/${p.slug}`} target="_blank" className="btn-ghost btn-sm" aria-label="View"><ExternalLink className="size-3.5" /></Link> : null}
                <Link href={`/dashboard/projects/${p._id}`} className="btn-outline btn-sm"><Pencil className="size-3.5" /> Edit</Link>
                <ActionButton action={deleteProject.bind(null, p._id)} confirm={`Delete ${p.name}?`} className="btn-ghost btn-sm text-rose-600" label="Delete project">
                  <Trash2 className="size-3.5" />
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Landmark} title="No projects yet" action={<Link href="/dashboard/projects/new" className="btn-primary">Create a project</Link>} />
      )}
    </>
  );
}
