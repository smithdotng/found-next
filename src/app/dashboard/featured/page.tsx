import Link from "next/link";
import { Eye, EyeOff, Pencil, PlusCircle, Star, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { FeaturedProperty } from "@/lib/models";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/dashboard/action-button";
import { SmartImage } from "@/components/ui/smart-image";
import { deleteFeatured, toggleFeaturedActive } from "@/app/actions/content";
import { formatDate, primaryImage } from "@/lib/format";
import type { PropertyDoc } from "@/lib/types";

export const metadata = { title: "Featured deals" };

type Row = { _id: string; title: string; image?: string; isActive: boolean; startDate: string; endDate?: string; displayOrder?: number; arrangementType: string; badge?: { text?: string; color?: string }; property: PropertyDoc | null };

export default async function FeaturedAdmin() {
  await requireUser(["admin"]);
  await connectDB();
  const rows = toPlain<Row[]>(await FeaturedProperty.find().sort({ isActive: -1, displayOrder: 1 }).populate("property", "title slug images status").lean());
  return (
    <>
      <PageHeader
        title="Featured deals"
        description="Special arrangements shown in the “Featured deals” section of the home page (the first four active ones)."
        actions={<Link href="/dashboard/featured/new" className="btn-primary"><PlusCircle className="size-4" /> Add deal</Link>}
      />
      {rows.length ? (
        <div className="card divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <SmartImage src={r.image || (r.property ? primaryImage(r.property) : undefined)} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-ink">{r.title}</span>
                    {r.badge?.text ? <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: r.badge.color || "#cb4850" }}>{r.badge.text}</span> : null}
                    <span className={`chip ${r.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>{r.isActive ? "Active" : "Hidden"}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {r.property?.title ?? "Listing removed"} · {r.arrangementType.replace("_", " ")} · {formatDate(r.startDate)}{r.endDate ? ` → ${formatDate(r.endDate)}` : ""} · order {r.displayOrder ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <ActionButton action={toggleFeaturedActive.bind(null, r._id)} className="btn-ghost btn-sm" label={r.isActive ? "Hide" : "Show"}>
                  {r.isActive ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </ActionButton>
                <Link href={`/dashboard/featured/${r._id}`} className="btn-outline btn-sm"><Pencil className="size-3.5" /> Edit</Link>
                <ActionButton action={deleteFeatured.bind(null, r._id)} confirm="Remove this featured deal?" className="btn-ghost btn-sm text-rose-600" label="Delete">
                  <Trash2 className="size-3.5" />
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Star} title="No featured deals" text="Promote a partner listing or special offer on the home page." action={<Link href="/dashboard/featured/new" className="btn-primary">Add a deal</Link>} />
      )}
    </>
  );
}
