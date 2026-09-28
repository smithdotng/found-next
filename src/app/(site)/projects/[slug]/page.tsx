import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Building, Check, ExternalLink, FileText, Globe, MapPin, PlayCircle, TrendingUp, X } from "lucide-react";
import { getProject } from "@/lib/queries";
import { connectDB, toPlain } from "@/lib/db";
import { Project } from "@/lib/models";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { formatDate, formatPrice, stateLabel } from "@/lib/format";
import { renderRichText } from "@/lib/content";
import type { ProjectDoc } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { Gallery } from "@/components/property/gallery";
import { InquiryForm } from "@/components/property/inquiry-form";
import { ShareBar } from "@/components/property/share-bar";
import { sendProjectInquiry } from "@/app/actions/public";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return pageMetadata({ title: "Project not found", path: `/projects/${slug}`, noIndex: true });
  // Mirrors projectController: title "<name> - Found Projects", OG from seo.* with fallbacks.
  const base = pageMetadata({
    title: p.seo?.metaTitle || p.name,
    absoluteTitle: true,
    description: p.seo?.metaDescription || p.description?.short,
    path: `/projects/${p.slug}`,
    image: p.media?.featuredImage,
    type: "article",
    keywords: p.seo?.metaKeywords,
    publishedTime: p.createdAt,
    modifiedTime: p.updatedAt,
  });
  return { ...base, title: { absolute: `${p.name} - Found Projects` }, description: p.description?.short };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) notFound();

  after(async () => {
    await connectDB();
    await Project.updateOne({ _id: p._id }, { $inc: { views: 1 } });
  });

  await connectDB();
  const related = toPlain<ProjectDoc[]>(
    await Project.find({
      _id: { $ne: p._id },
      status: "published",
      $or: [{ "developer.name": p.developer?.name }, { "location.city": p.location?.city }],
    })
      .limit(3)
      .lean(),
  );

  const images = [{ url: p.media.featuredImage }, ...(p.media.gallery ?? []).filter((g) => g.url)];
  const spec = p.specifications ?? {};
  const pricing = p.pricing ?? {};

  return (
    <div className="container-page pb-16 pt-4 lg:pt-8">
      <Gallery images={images} title={p.name} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
            <Building className="size-4" /> {p.developer?.name}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{p.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-slate-600">
            <MapPin className="size-4 text-coral-500" />
            {[p.location?.address, p.location?.city, stateLabel(p.location?.state)].filter(Boolean).join(", ")}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Starting from" value={pricing.startingPrice ? formatPrice(pricing.startingPrice) : "On request"} />
            <Stat label="Total units" value={spec.totalUnits ? String(spec.totalUnits) : "—"} />
            <Stat label="Land area" value={spec.landArea || "—"} />
            <Stat label="Completion" value={spec.completionDate ? formatDate(spec.completionDate, { month: "short", year: "numeric" }) : "—"} />
          </dl>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-ink">Overview</h2>
            <p className="mt-2 font-medium text-slate-700">{p.description?.short}</p>
            <div className="prose-found mt-4" dangerouslySetInnerHTML={{ __html: renderRichText(p.description?.long) }} />
          </section>

          {p.features?.length ? (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink">Key features</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {p.features.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-ink">{f.title}</p>
                    {f.description ? <p className="mt-1 text-sm text-slate-600">{f.description}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {p.amenities?.length ? (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink">Amenities</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {p.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="size-4 text-emerald-600" /> {a}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {spec.unitSizes?.length ? (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink">Units &amp; pricing</h2>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {spec.unitSizes.map((raw, i) => {
                      // Older records may hold plain strings (see the schema note in models/Project.js).
                      const u = typeof raw === "string" ? { type: raw as string, size: "", price: undefined, available: undefined } : raw;
                      return (
                      <tr key={i}>
                        <td className="px-4 py-3 font-medium text-ink">{u.type}</td>
                        <td className="px-4 py-3 text-slate-600">{u.size}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{u.price ? formatPrice(u.price) : "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{u.available ?? "—"}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {pricing.paymentPlan?.length ? (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink">Payment plan</h2>
              <ol className="mt-4 space-y-3">
                {pricing.paymentPlan.map((s, i) => (
                  <li key={i} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                      {s.percentage ? `${s.percentage}%` : i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{s.title}</p>
                      {s.description ? <p className="text-sm text-slate-600">{s.description}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
              {pricing.includes?.length || pricing.excludes?.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {pricing.includes?.length ? (
                    <ul className="space-y-1.5 rounded-2xl bg-emerald-50/60 p-4 text-sm">
                      <li className="font-semibold text-emerald-900">Includes</li>
                      {pricing.includes.map((x) => (
                        <li key={x} className="flex gap-2 text-emerald-900"><Check className="mt-0.5 size-4 shrink-0" /> {x}</li>
                      ))}
                    </ul>
                  ) : null}
                  {pricing.excludes?.length ? (
                    <ul className="space-y-1.5 rounded-2xl bg-rose-50/60 p-4 text-sm">
                      <li className="font-semibold text-rose-900">Excludes</li>
                      {pricing.excludes.map((x) => (
                        <li key={x} className="flex gap-2 text-rose-900"><X className="mt-0.5 size-4 shrink-0" /> {x}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {p.investment && (p.investment.roi || p.investment.rentalYield || p.investment.highlights?.length) ? (
            <section className="mt-10 rounded-2xl bg-brand-950 p-6 text-white">
              <h2 className="flex items-center gap-2 text-lg font-bold"><TrendingUp className="size-5 text-coral-200" /> Investment outlook</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                {p.investment.roi ? <Dark label="Projected ROI" value={p.investment.roi} /> : null}
                {p.investment.rentalYield ? <Dark label="Rental yield" value={p.investment.rentalYield} /> : null}
                {p.investment.capitalAppreciation ? <Dark label="Capital appreciation" value={p.investment.capitalAppreciation} /> : null}
              </dl>
              {p.investment.highlights?.length ? (
                <ul className="mt-4 space-y-1.5 text-sm text-white/80">
                  {p.investment.highlights.map((h) => (
                    <li key={h} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-coral-200" /> {h}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-2">
            {p.media.videoTour ? <a className="btn-outline" href={p.media.videoTour} target="_blank" rel="noopener noreferrer"><PlayCircle className="size-4" /> Video tour</a> : null}
            {p.media.virtualTour ? <a className="btn-outline" href={p.media.virtualTour} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Virtual tour</a> : null}
            {p.media.brochure ? <a className="btn-outline" href={p.media.brochure} target="_blank" rel="noopener noreferrer"><FileText className="size-4" /> Brochure</a> : null}
            {p.location?.googleEarthUrl ? <a className="btn-outline" href={p.location.googleEarthUrl} target="_blank" rel="noopener noreferrer"><Globe className="size-4" /> View on Google Earth</a> : null}
            {p.developer?.website ? <a className="btn-outline" href={p.developer.website} target="_blank" rel="noopener noreferrer"><Building className="size-4" /> Developer website</a> : null}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <ShareBar url={absoluteUrl(`/projects/${p.slug}`)} title={p.name} text={`🏗️ ${p.name} by ${p.developer?.name} on Found Properties`} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-ink">Interested in {p.name}?</h2>
            <p className="mt-1 text-sm text-slate-500">Get the brochure, current prices and inspection dates.</p>
            <div className="mt-5">
              <InquiryForm
                action={sendProjectInquiry}
                hidden={{ projectId: p._id }}
                defaultMessage={`Hi, I'd like more information about ${p.name}, including available units and the payment plan.`}
                submitLabel="Request information"
              />
            </div>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-ink">Related projects</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r._id} href={`/projects/${r.slug}`} className="group card overflow-hidden">
                <div className="relative aspect-[16/10] bg-slate-100">
                  <SmartImage src={r.media?.featuredImage} alt={r.name} fill sizes="33vw" className="object-cover" />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-ink group-hover:text-brand-600">{r.name}</p>
                  <p className="text-sm text-slate-500">{r.location?.city}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold text-ink">{value}</dd>
    </div>
  );
}

function Dark({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <dt className="text-xs text-white/60">{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}
