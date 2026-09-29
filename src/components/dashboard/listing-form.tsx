"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AlertCircle, BedDouble, Camera, CheckCircle2, Info, Loader2, MapPin, Sparkles, Tag } from "lucide-react";
import { createListing, updateListing } from "@/app/actions/listings";
import { PhotoManager, type PhotoItem } from "./photo-manager";
import {
  HOUSE_RULES, NIGERIAN_STATES, PROPERTY_TYPES, SHORTLET_AMENITIES, TRANSACTION_TYPES, formatPrice, stateLabel,
} from "@/lib/format";
import type { PropertyDoc } from "@/lib/types";

const SECTIONS = [
  { id: "basics", label: "Basics", icon: Tag },
  { id: "location", label: "Location", icon: MapPin },
  { id: "details", label: "Details", icon: BedDouble },
  { id: "photos", label: "Photos", icon: Camera },
];

export function ListingForm({ listing, isAdmin, shortletOnly = false }: { listing?: PropertyDoc; isAdmin: boolean; shortletOnly?: boolean }) {
  const [state, dispatch, pending] = useActionState(listing ? updateListing : createListing, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<string>(shortletOnly ? "shortlet" : listing?.propertyType ?? "");
  const [tx, setTx] = useState<string>(shortletOnly ? "rent" : listing?.transactionType ?? "sale");
  const [price, setPrice] = useState<string>(listing?.price ? String(listing.price) : "");
  const [title, setTitle] = useState(listing?.title ?? "");
  const [desc, setDesc] = useState(listing?.description ?? "");
  const [photos, setPhotos] = useState<PhotoItem[]>(
    (listing?.images ?? [])
      .slice()
      .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary))
      .map((i) => ({ id: i.url, kind: "existing" as const, url: i.url })),
  );
  const f = listing?.features ?? {};
  const sl = listing?.shortletDetails ?? {};
  const loc = listing?.location ?? {};
  const err = (k: string) => state?.errors?.[k];
  const isLand = type === "land";
  const isShortlet = type === "shortlet";

  const priceNum = Number(price.replace(/[^\d.]/g, "")) || 0;
  const checklist = useMemo(
    () => [
      { label: "Title", done: title.trim().length >= 6 },
      { label: "Type & price", done: !!type && priceNum > 0 },
      { label: "Description", done: desc.trim().length >= 30 },
      { label: "At least 3 photos", done: photos.length >= 3 },
    ],
    [title, type, priceNum, desc, photos.length],
  );
  const score = checklist.filter((c) => c.done).length;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("images");
    fd.set("price", String(priceNum));
    let n = 0;
    for (const p of photos) {
      if (p.kind === "existing") fd.append("imageOrder", `existing:${p.url}`);
      else {
        fd.append("images", p.file, p.file.name);
        fd.append("imageOrder", `new:${n++}`);
      }
    }
    startTransition(() => dispatch(fd));
  };

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-8 pb-28 lg:grid-cols-[1fr_280px]" noValidate>
      {listing ? <input type="hidden" name="id" value={listing._id} /> : null}

      <div className="min-w-0 space-y-6">
        {state && !state.ok ? (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.message}
          </div>
        ) : null}
        {listing?.status === "rejected" && listing.rejectionReason ? (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <strong>Changes requested:</strong> {listing.rejectionReason}
          </div>
        ) : null}

        <Section id="basics" title="Basics" desc="What you're offering and for how much.">
          <div className="grid gap-5">
            <div>
              <Label htmlFor="title">Listing title</Label>
              <input id="title" name="title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={shortletOnly ? "e.g. Cosy 2-bedroom apartment with pool, Wuse 2" : "e.g. Newly built 4-bedroom duplex with BQ in Lekki Phase 1"} maxLength={140} />
              <Err e={err("title")} />
            </div>
            {shortletOnly ? (
              <>
                <input type="hidden" name="propertyType" value="shortlet" />
                <input type="hidden" name="transactionType" value="rent" />
              </>
            ) : null}
            <div className={clsx(shortletOnly && "hidden")}>
              <Label>Property type</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {PROPERTY_TYPES.map((t) => (
                  <label key={t.value} className={clsx("cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition", type === t.value ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-600/15" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                    <input type="radio" name="propertyType" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="sr-only" />
                    {t.label}
                  </label>
                ))}
              </div>
              <Err e={err("propertyType")} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className={clsx(shortletOnly && "hidden")}>
                <Label>Offer type</Label>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                  {TRANSACTION_TYPES.map((t) => (
                    <label key={t.value} className={clsx("cursor-pointer rounded-lg py-2 text-center text-sm font-semibold transition", tx === t.value ? "bg-white text-ink shadow-sm" : "text-slate-500")}>
                      <input type="radio" name="transactionType" value={t.value} checked={tx === t.value} onChange={() => setTx(t.value)} className="sr-only" />
                      {t.label.replace("For ", "")}
                    </label>
                  ))}
                </div>
                <Err e={err("transactionType")} />
              </div>
              <div>
                <Label htmlFor="price">Price (₦) {isShortlet ? "per night" : tx === "sale" ? "" : "per year"}</Label>
                <input
                  id="price"
                  name="price"
                  inputMode="numeric"
                  className="field text-base font-semibold"
                  value={priceNum ? priceNum.toLocaleString("en-NG") : price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                />
                <p className="field-hint">
                  {priceNum
                    ? isShortlet
                      ? <>{formatPrice(priceNum)} per night · set a weekend rate and discounts under Details</>
                      : <>{formatPrice(priceNum)} · agency fee capped at {formatPrice(priceNum * 0.1)} (10%)</>
                    : "Numbers only"}
                </p>
                <Err e={err("price")} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="priceNegotiable" defaultChecked={listing?.priceNegotiable} className="size-4 rounded accent-brand-600" /> Price is negotiable
            </label>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea id="description" name="description" rows={7} className="field leading-6" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the layout, finishing, neighbourhood, access roads, documents (C of O, Governor's consent)…" />
              <p className="field-hint flex justify-between"><span>Tip: mention title documents and nearby landmarks — it builds trust.</span><span>{desc.length} chars</span></p>
              <Err e={err("description")} />
            </div>
          </div>
        </Section>

        <Section id="location" title="Location" desc="The exact address is only shared with serious enquirers.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="state">State</Label>
              <select id="state" name="state" className="field" defaultValue={loc.state ?? ""}>
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{stateLabel(s)}</option>
                ))}
              </select>
              <Err e={err("state")} />
            </div>
            <div>
              <Label htmlFor="city">City / area</Label>
              <input id="city" name="city" className="field" defaultValue={loc.city} placeholder="e.g. Lekki, Wuse 2, GRA" />
              <Err e={err("city")} />
            </div>
            <div>
              <Label htmlFor="lga">LGA (optional)</Label>
              <input id="lga" name="lga" className="field" defaultValue={loc.lga} />
            </div>
            <div>
              <Label htmlFor="landmark">Nearby landmark (optional)</Label>
              <input id="landmark" name="landmark" className="field" defaultValue={loc.landmark} placeholder="e.g. Opposite Jabi Lake Mall" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">Street address</Label>
              <input id="address" name="address" className="field" defaultValue={loc.address} placeholder="House number and street" />
            </div>
          </div>
        </Section>

        <Section id="details" title="Details" desc={isLand ? "Size and access details for the plot." : "Rooms, size and what's included."}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {!isLand ? (
              <>
                <Num name="bedrooms" label="Bedrooms" def={f.bedrooms} />
                <Num name="bathrooms" label="Bathrooms" def={f.bathrooms} />
                <Num name="toilets" label="Toilets" def={f.toilets} />
                <Num name="parkingSpaces" label="Parking spaces" def={f.parkingSpaces} />
                <Num name="floorArea" label="Floor area (sqm)" def={f.floorArea} />
              </>
            ) : null}
            <Num name="landArea" label="Land area (sqm)" def={f.landArea} />
          </div>
          {!isLand ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ["furnished", "Furnished", f.furnished],
                ["serviced", "Serviced", f.serviced],
                ["security", "24/7 security", f.security],
                ["powerSupply", "Steady power", f.powerSupply],
                ["borehole", "Borehole / water", f.borehole],
              ].map(([k, l, d]) => (
                <label key={k as string} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                  <input type="checkbox" name={k as string} defaultChecked={!!d} className="size-3.5 accent-brand-600" /> {l as string}
                </label>
              ))}
            </div>
          ) : null}
          <div className="mt-5">
            <Label htmlFor="videoUrl">Video tour link (optional)</Label>
            <input id="videoUrl" name="videoUrl" type="url" className="field" defaultValue={listing?.videoUrl} placeholder="YouTube, Instagram or TikTok link" />
          </div>

          {isShortlet ? (
            <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
              <p className="flex items-center gap-2 font-semibold text-ink"><Sparkles className="size-4 text-brand-600" /> Shortlet settings</p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Num name="maxGuests" label="Max guests" def={sl.maxGuests ?? 2} />
                <Num name="minimumStay" label="Min nights" def={sl.minimumStay ?? 1} />
                <Num name="maximumStay" label="Max nights" def={sl.maximumStay ?? 30} />
                <div>
                  <Label htmlFor="checkInTime">Check-in</Label>
                  <input id="checkInTime" name="checkInTime" type="time" className="field" defaultValue={sl.checkInTime ?? "14:00"} />
                </div>
                <div>
                  <Label htmlFor="checkOutTime">Check-out</Label>
                  <input id="checkOutTime" name="checkOutTime" type="time" className="field" defaultValue={sl.checkOutTime ?? "11:00"} />
                </div>
                <div>
                  <Label htmlFor="cancellationPolicy">Cancellation</Label>
                  <select id="cancellationPolicy" name="cancellationPolicy" className="field capitalize" defaultValue={sl.cancellationPolicy ?? "moderate"}>
                    {["flexible", "moderate", "strict", "super strict"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Num name="weekendRate" label="Weekend rate (₦)" def={sl.weekendRate ?? undefined} />
                <Num name="cleaningFee" label="Cleaning fee (₦)" def={sl.cleaningFee} />
                <Num name="securityDeposit" label="Caution fee (₦)" def={sl.securityDeposit} />
                <Num name="weeklyDiscount" label="Weekly discount %" def={sl.weeklyDiscount} />
                <Num name="monthlyDiscount" label="Monthly discount %" def={sl.monthlyDiscount} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-700">Amenities</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SHORTLET_AMENITIES.map((a) => (
                  <label key={a} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs capitalize text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                    <input type="checkbox" name="amenities" value={a} defaultChecked={sl.amenities?.includes(a)} className="size-3 accent-brand-600" /> {a}
                  </label>
                ))}
              </div>
              <p className="mt-5 text-sm font-medium text-slate-700">House rules</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {HOUSE_RULES.map((a) => (
                  <label key={a} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs capitalize text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                    <input type="checkbox" name="houseRules" value={a} defaultChecked={sl.houseRules?.includes(a)} className="size-3 accent-brand-600" /> {a}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </Section>

        <Section id="photos" title="Photos" desc="The first photo is the cover. Listings with 5+ bright, landscape photos get far more enquiries.">
          <PhotoManager items={photos} onChange={setPhotos} />
        </Section>
      </div>

      {/* Side rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-8 space-y-4">
          <nav className="card p-2" aria-label="Form sections">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-ink">
                <s.icon className="size-4 text-slate-400" /> {s.label}
              </a>
            ))}
          </nav>
          <div className="card p-4">
            <p className="text-sm font-semibold text-ink">Listing quality</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={clsx("h-full rounded-full transition-all", score === 4 ? "bg-emerald-500" : "bg-brand-500")} style={{ width: `${(score / 4) * 100}%` }} />
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className={clsx("flex items-center gap-2", c.done ? "text-emerald-700" : "text-slate-500")}>
                  <CheckCircle2 className={clsx("size-4", c.done ? "text-emerald-600" : "text-slate-300")} /> {c.label}
                </li>
              ))}
            </ul>
          </div>
          {!isAdmin ? (
            <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" />
              {listing && listing.status === "available"
                ? "Editing a live listing sends it for a quick re-review. Use the status menu to mark it sold or rented instead."
                : shortletOnly
                  ? "New apartments are reviewed by the Found team. They go live once your host account is vetted and your listing agreement is signed."
                  : "New listings are reviewed by the Found team before going live, usually within a day."}
            </p>
          ) : null}
        </div>
      </aside>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur lg:left-64 safe-bottom">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <p className="hidden text-sm text-slate-500 sm:block">
            {photos.length} photo{photos.length === 1 ? "" : "s"} · {score}/4 quality checks
          </p>
          <div className="ml-auto flex gap-2">
            <Link href="/dashboard/listings" className="btn-ghost">Cancel</Link>
            <button type="submit" className="btn-primary min-w-40" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Saving…" : listing ? "Save changes" : isAdmin ? "Publish listing" : "Submit for review"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-20 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {desc ? <p className="mt-0.5 text-sm text-slate-500">{desc}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label className="field-label" htmlFor={htmlFor}>{children}</label>;
}

function Err({ e }: { e?: string }) {
  return e ? <p className="mt-1 text-xs text-rose-600">{e}</p> : null;
}

function Num({ name, label, def }: { name: string; label: string; def?: number | null }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <input id={name} name={name} inputMode="numeric" type="number" min={0} className="field" defaultValue={def || ""} />
    </div>
  );
}
