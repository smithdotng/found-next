"use client";

import { useActionState, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { saveBlog, saveFeatured, saveProject } from "@/app/actions/content";
import { SubmitButton, TextField } from "@/components/ui/form-bits";
import { BLOG_CATEGORIES, NIGERIAN_STATES, stateLabel } from "@/lib/format";
import type { BlogDoc, ProjectDoc } from "@/lib/types";

type State = { ok: boolean; message: string; errors?: Record<string, string> } | null;

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-semibold text-ink">{title}</h2>
      {desc ? <p className="mt-0.5 text-sm text-slate-500">{desc}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Area({ label, name, def, rows = 4, hint, error }: { label: string; name: string; def?: string; rows?: number; hint?: string; error?: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={`f-${name}`}>{label}</label>
      <textarea id={`f-${name}`} name={name} rows={rows} defaultValue={def} className="field leading-6" />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

function Banner({ state }: { state: State }) {
  if (!state || state.ok) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
      <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.message}
    </div>
  );
}

function ImageField({ label, name, current, error }: { label: string; name: string; current?: string; error?: string }) {
  const [preview, setPreview] = useState<string | undefined>(current);
  return (
    <div>
      <label className="field-label" htmlFor={`f-${name}`}>{label}</label>
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-20 w-32 rounded-lg object-cover ring-1 ring-slate-200" />
        ) : (
          <div className="grid h-20 w-32 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">No image</div>
        )}
        <input
          id={`f-${name}`}
          type="file"
          name={name}
          accept="image/*"
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
          }}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

const pipe = (rows: (string | number | undefined)[][] | undefined) => (rows ?? []).map((r) => r.map((c) => c ?? "").join(" | ")).join("\n");

export function ProjectForm({ project }: { project?: ProjectDoc }) {
  const [state, action] = useActionState<State, FormData>(saveProject, null);
  const e = (k: string) => state?.errors?.[k];
  const p = project;
  const [gallery, setGallery] = useState(p?.media?.gallery ?? []);
  return (
    <form action={action} className="space-y-6 pb-10">
      {p ? <input type="hidden" name="id" value={p._id} /> : null}
      {gallery.map((g) => <input key={g.url} type="hidden" name="keepGallery" value={g.url} />)}
      <Banner state={state} />
      <Card title="Project">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Project name" name="name" defaultValue={p?.name} error={e("name")} className="sm:col-span-2" />
          <TextField label="Developer" name="developerName" defaultValue={p?.developer?.name} error={e("developerName")} />
          <TextField label="Developer website" name="developerWebsite" defaultValue={p?.developer?.website} />
          <TextField label="Developer email" name="developerEmail" type="email" defaultValue={p?.developer?.contactEmail} />
          <TextField label="Developer phone" name="developerPhone" defaultValue={p?.developer?.contactPhone} />
        </div>
        <Area label="Short description (max 300 characters)" name="short" def={p?.description?.short} rows={2} error={e("short")} />
        <Area label="Full description" name="long" def={p?.description?.long} rows={10} hint="Plain text or Markdown. Blank lines start new paragraphs; lines starting with - become bullets." error={e("long")} />
      </Card>
      <Card title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Address" name="address" defaultValue={p?.location?.address} className="sm:col-span-2" />
          <TextField label="City / area" name="city" defaultValue={p?.location?.city} />
          <div>
            <label className="field-label" htmlFor="f-state">State</label>
            <select id="f-state" name="state" className="field" defaultValue={p?.location?.state ?? ""}>
              <option value="">Select…</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{stateLabel(s)}</option>)}
            </select>
          </div>
          <TextField label="LGA" name="lga" defaultValue={p?.location?.lga} />
          <TextField label="Google Earth / Maps link" name="googleEarthUrl" defaultValue={p?.location?.googleEarthUrl} />
        </div>
      </Card>
      <Card title="Specifications & pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Total units" name="totalUnits" inputMode="numeric" defaultValue={p?.specifications?.totalUnits} />
          <TextField label="Land area" name="landArea" defaultValue={p?.specifications?.landArea} placeholder="e.g. 5 hectares" />
          <TextField label="Completion date" name="completionDate" type="date" defaultValue={p?.specifications?.completionDate?.slice(0, 10)} />
          <div>
            <label className="field-label" htmlFor="f-projectStatus">Build status</label>
            <select id="f-projectStatus" name="projectStatus" className="field" defaultValue={p?.specifications?.status ?? "upcoming"}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing / selling</option>
              <option value="completed">Completed</option>
              <option value="sold_out">Sold out</option>
            </select>
          </div>
          <TextField label="Starting price (₦)" name="startingPrice" inputMode="numeric" defaultValue={p?.pricing?.startingPrice} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Min (₦)" name="priceMin" inputMode="numeric" defaultValue={p?.pricing?.priceRange?.min} />
            <TextField label="Max (₦)" name="priceMax" inputMode="numeric" defaultValue={p?.pricing?.priceRange?.max} />
          </div>
        </div>
        <Area label="Unit types — one per line: Type | Size | Price | Available" name="unitSizes" rows={4} def={pipe(p?.specifications?.unitSizes?.map((u) => (typeof u === "string" ? [u as string] : [u.type, u.size, u.price, u.available])))} />
        <Area label="Payment plan — one per line: Title | Percentage | Description" name="paymentPlan" rows={3} def={pipe(p?.pricing?.paymentPlan?.map((x) => [x.title, x.percentage, x.description]))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Area label="Price includes (one per line)" name="includes" rows={3} def={p?.pricing?.includes?.join("\n")} />
          <Area label="Price excludes (one per line)" name="excludes" rows={3} def={p?.pricing?.excludes?.join("\n")} />
        </div>
      </Card>
      <Card title="Features & amenities">
        <Area label="Key features — one per line: Title | Description" name="features" rows={4} def={pipe(p?.features?.map((f) => [f.title, f.description]))} />
        <Area label="Amenities (one per line)" name="amenities" rows={4} def={p?.amenities?.join("\n")} />
      </Card>
      <Card title="Investment outlook" desc="Optional — shown in a highlighted panel.">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Projected ROI" name="roi" defaultValue={p?.investment?.roi} placeholder="e.g. 25% in 2 years" />
          <TextField label="Rental yield" name="rentalYield" defaultValue={p?.investment?.rentalYield} />
          <TextField label="Capital appreciation" name="capitalAppreciation" defaultValue={p?.investment?.capitalAppreciation} />
        </div>
        <Area label="Highlights (one per line)" name="highlights" rows={3} def={p?.investment?.highlights?.join("\n")} />
      </Card>
      <Card title="Media">
        <ImageField label="Featured image" name="featuredImage" current={p?.media?.featuredImage} error={e("featuredImage")} />
        {gallery.length ? (
          <div>
            <p className="field-label">Gallery</p>
            <ul className="flex flex-wrap gap-2">
              {gallery.map((g) => (
                <li key={g.url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" className="h-20 w-28 rounded-lg object-cover" />
                  <button type="button" onClick={() => setGallery((x) => x.filter((y) => y.url !== g.url))} className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-rose-600 text-white" aria-label="Remove image">
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <label className="field-label" htmlFor="f-gallery">Add gallery images</label>
          <input id="f-gallery" type="file" name="gallery" accept="image/*" multiple className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Video tour URL" name="videoTour" defaultValue={p?.media?.videoTour} />
          <TextField label="Virtual tour URL" name="virtualTour" defaultValue={p?.media?.virtualTour} />
          <TextField label="Brochure URL" name="brochure" defaultValue={p?.media?.brochure} />
        </div>
      </Card>
      <Card title="SEO & publishing" desc="Meta title and description are used for the page's Open Graph tags when shared.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Meta title" name="metaTitle" defaultValue={p?.seo?.metaTitle} />
          <TextField label="Meta keywords" name="metaKeywords" defaultValue={p?.seo?.metaKeywords} />
        </div>
        <Area label="Meta description" name="metaDescription" rows={2} def={p?.seo?.metaDescription} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="f-status">Status</label>
            <select id="f-status" name="status" className="field" defaultValue={p?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <TextField label="Display order" name="order" inputMode="numeric" defaultValue={p?.order ?? 0} />
          <label className="flex items-center gap-2 pt-7 text-sm text-slate-700">
            <input type="checkbox" name="featured" defaultChecked={p?.featured} className="size-4 accent-brand-600" /> Feature on home page
          </label>
        </div>
      </Card>
      <div className="flex justify-end">
        <SubmitButton className="btn-primary min-w-40" pendingText="Saving…">{p ? "Save project" : "Create project"}</SubmitButton>
      </div>
    </form>
  );
}

export function BlogForm({ blog }: { blog?: BlogDoc }) {
  const [state, action] = useActionState<State, FormData>(saveBlog, null);
  const e = (k: string) => state?.errors?.[k];
  const b = blog;
  return (
    <form action={action} className="grid gap-6 pb-10 xl:grid-cols-[1fr_320px]">
      {b ? <input type="hidden" name="id" value={b._id} /> : null}
      <div className="space-y-6">
        <Banner state={state} />
        <Card title="Post">
          <TextField label="Title" name="title" defaultValue={b?.title} error={e("title")} />
          <Area label="Excerpt (max 300 characters)" name="excerpt" rows={2} def={b?.excerpt} error={e("excerpt")} />
          <Area label="Body" name="content" rows={18} def={b?.content} hint="Markdown supported: ## headings, **bold**, - bullets, [links](https://…). HTML also works." error={e("content")} />
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Publishing">
          <div>
            <label className="field-label" htmlFor="f-status">Status</label>
            <select id="f-status" name="status" className="field" defaultValue={b?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <TextField label="Author name" name="authorName" defaultValue={b?.authorName} placeholder="Defaults to you" />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="featured" defaultChecked={b?.featured} className="size-4 accent-brand-600" /> Featured post
          </label>
          <SubmitButton className="btn-primary w-full" pendingText="Saving…">{b ? "Save post" : "Create post"}</SubmitButton>
        </Card>
        <Card title="Featured image">
          <ImageField label="Image (also used for social sharing)" name="featuredImage" current={b?.featuredImage} error={e("featuredImage")} />
        </Card>
        <Card title="Categories & tags">
          <div className="flex flex-wrap gap-2">
            {BLOG_CATEGORIES.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                <input type="checkbox" name="categories" value={c} defaultChecked={b?.categories?.includes(c)} className="size-3 accent-brand-600" /> {c}
              </label>
            ))}
          </div>
          <TextField label="Tags (comma separated)" name="tags" defaultValue={b?.tags?.join(", ")} />
        </Card>
        <Card title="SEO" desc="Overrides for search and social previews.">
          <TextField label="Meta title" name="metaTitle" defaultValue={b?.metaTitle} />
          <Area label="Meta description" name="metaDescription" rows={3} def={b?.metaDescription} />
          <TextField label="Meta keywords" name="metaKeywords" defaultValue={b?.metaKeywords} />
        </Card>
      </div>
    </form>
  );
}

export type FeaturedDoc = {
  _id: string;
  property: string | { _id: string; title: string };
  title: string;
  description?: string;
  image?: string;
  badge?: { text?: string; color?: string };
  arrangementType: string;
  partnerDetails?: { name?: string; contact?: string };
  startDate: string;
  endDate?: string;
  isActive: boolean;
  displayOrder?: number;
};

export function FeaturedForm({ doc, properties }: { doc?: FeaturedDoc; properties: { _id: string; title: string }[] }) {
  const [state, action] = useActionState<State, FormData>(saveFeatured, null);
  const e = (k: string) => state?.errors?.[k];
  const propId = doc ? (typeof doc.property === "object" ? doc.property._id : doc.property) : "";
  return (
    <form action={action} className="max-w-3xl space-y-6 pb-10">
      {doc ? <input type="hidden" name="id" value={doc._id} /> : null}
      <Banner state={state} />
      <Card title="Deal">
        <div>
          <label className="field-label" htmlFor="f-property">Property</label>
          <select id="f-property" name="property" className="field" defaultValue={propId}>
            <option value="">Select a live listing…</option>
            {properties.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          {e("property") ? <p className="mt-1 text-xs text-rose-600">{e("property")}</p> : null}
        </div>
        <TextField label="Headline" name="title" defaultValue={doc?.title} error={e("title")} />
        <Area label="Description" name="description" rows={3} def={doc?.description} />
        <ImageField label="Custom image (optional — defaults to the listing's cover)" name="image" current={doc?.image} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Badge text" name="badgeText" defaultValue={doc?.badge?.text} placeholder="e.g. 20% off" />
          <div>
            <label className="field-label" htmlFor="f-badgeColor">Badge colour</label>
            <input id="f-badgeColor" type="color" name="badgeColor" defaultValue={doc?.badge?.color || "#cb4850"} className="h-11 w-full rounded-xl border border-slate-200 p-1" />
          </div>
          <div>
            <label className="field-label" htmlFor="f-arr">Arrangement</label>
            <select id="f-arr" name="arrangementType" className="field" defaultValue={doc?.arrangementType ?? "special_deal"}>
              <option value="special_deal">Special deal</option>
              <option value="promotion">Promotion</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>
          <TextField label="Partner name" name="partnerName" defaultValue={doc?.partnerDetails?.name} />
          <TextField label="Partner contact" name="partnerContact" defaultValue={doc?.partnerDetails?.contact} />
          <TextField label="Display order" name="displayOrder" inputMode="numeric" defaultValue={doc?.displayOrder ?? 0} />
          <TextField label="Starts" name="startDate" type="date" defaultValue={(doc?.startDate ?? new Date().toISOString()).slice(0, 10)} error={e("startDate")} />
          <TextField label="Ends (optional)" name="endDate" type="date" defaultValue={doc?.endDate?.slice(0, 10)} />
          <label className="flex items-center gap-2 pt-7 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={doc?.isActive ?? true} className="size-4 accent-brand-600" /> Show on home page
          </label>
        </div>
      </Card>
      <div className="flex justify-end">
        <SubmitButton className="btn-primary min-w-40" pendingText="Saving…">{doc ? "Save" : "Add featured deal"}</SubmitButton>
      </div>
    </form>
  );
}
