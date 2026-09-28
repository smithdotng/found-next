import type { Metadata } from "next";
import Link from "next/link";
import { Building, CalendarDays, MapPin } from "lucide-react";
import { getPublishedProjects } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";
import { formatDate, formatPrice, stateLabel } from "@/lib/format";
import { SmartImage } from "@/components/ui/smart-image";

export const metadata: Metadata = pageMetadata({
  title: "Real Estate Projects & Estates in Nigeria - Found Projects",
  absoluteTitle: true,
  description: "Explore off-plan and completed real estate developments across Nigeria — estates, apartments and mixed-use projects with flexible payment plans.",
  path: "/projects",
});

const STATUS: Record<string, { label: string; cls: string }> = {
  upcoming: { label: "Upcoming", cls: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  ongoing: { label: "Selling now", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  sold_out: { label: "Sold out", cls: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  return (
    <div className="container-page py-10 lg:py-14">
      <p className="text-sm font-semibold text-coral-500">Developments</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Projects &amp; estates</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Off-plan and completed developments from trusted developers, with payment plans and investment details in one place.
      </p>

      {projects.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const st = STATUS[p.specifications?.status ?? "upcoming"];
            return (
              <Link key={p._id} href={`/projects/${p.slug}`} className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="relative aspect-[16/10] bg-slate-100">
                  <SmartImage src={p.media?.featuredImage} alt={p.name} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  {st ? <span className={`chip absolute left-3 top-3 bg-white/95 ${st.cls}`}>{st.label}</span> : null}
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                    <Building className="size-3.5" /> {p.developer?.name}
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold text-ink">{p.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="size-3.5" /> {[p.location?.city, stateLabel(p.location?.state)].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.description?.short}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <span className="font-bold text-ink">{p.pricing?.startingPrice ? `From ${formatPrice(p.pricing.startingPrice)}` : "Price on request"}</span>
                    {p.specifications?.completionDate ? (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays className="size-3.5" /> {formatDate(p.specifications.completionDate, { month: "short", year: "numeric" })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">New projects are coming soon.</p>
      )}
    </div>
  );
}
