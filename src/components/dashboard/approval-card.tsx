"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, Pencil, ShieldCheck, X } from "lucide-react";
import { approveListing, rejectListing } from "@/app/actions/listings";
import { toast } from "@/components/ui/toaster";
import { SmartImage } from "@/components/ui/smart-image";
import { formatPrice, locationLine, plainText, priceSuffix, stateLabel, timeAgo, txLabel, typeLabel } from "@/lib/format";
import type { OwnerLite, PropertyDoc } from "@/lib/types";

const REASONS = [
  "Photos are unclear or not of the actual property",
  "Price looks incorrect — please confirm",
  "Address or location details are incomplete",
  "Description needs more detail (size, documents, access)",
  "Possible duplicate listing",
];

export function ApprovalCard({ p }: { p: PropertyDoc }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const owner = (typeof p.owner === "object" ? p.owner : null) as OwnerLite | null;
  const checks = [
    { ok: p.images.length >= 3, label: `${p.images.length} photo${p.images.length === 1 ? "" : "s"}` },
    { ok: p.description.length >= 120, label: `${p.description.length} char description` },
    { ok: !!p.location?.address, label: p.location?.address ? "Street address given" : "No street address" },
  ];

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const r = await fn();
      toast(r.message, r.ok ? "success" : "error");
      router.refresh();
    });

  return (
    <article className="card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[320px_1fr]">
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 md:grid-cols-2">
          {(p.images.length ? p.images.slice(0, 4) : [{ url: "" }]).map((img, i) => (
            <div key={i} className={`relative aspect-[4/3] overflow-hidden rounded-md bg-slate-200 ${i === 0 ? "col-span-3 md:col-span-2" : ""}`}>
              {img.url ? <SmartImage src={img.url} alt="" fill sizes="320px" className="object-cover" /> : <span className="grid h-full place-items-center text-xs text-slate-400">No photos</span>}
            </div>
          ))}
        </div>
        <div className="flex flex-col p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{typeLabel(p.propertyType)} · {txLabel(p.transactionType)}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{p.title}</h2>
              <p className="text-sm text-slate-500">{[p.location?.address, p.location?.city, stateLabel(p.location?.state)].filter(Boolean).join(", ") || locationLine(p.location)}</p>
            </div>
            <p className="text-xl font-bold text-ink">
              {formatPrice(p.price)} <span className="text-xs font-medium text-slate-500">{priceSuffix(p)}</span>
            </p>
          </div>
          <p className="mt-3 line-clamp-3 text-sm text-slate-600">{plainText(p.description, 400)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {checks.map((c) => (
              <span key={c.label} className={`chip ${c.ok ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-800 ring-amber-600/20"}`}>
                {c.ok ? <Check className="size-3" /> : "!"} {c.label}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-ink">{owner?.realtorProfile?.company || owner?.name}</span>
            {owner?.realtorProfile?.verified ? <ShieldCheck className="size-4 text-emerald-600" aria-label="Verified realtor" /> : null}
            {owner?.email ? <a href={`mailto:${owner.email}`} className="text-brand-600 hover:underline">{owner.email}</a> : null}
            <span className="text-slate-400">· submitted {timeAgo(p.createdAt)}</span>
          </div>

          {rejecting ? (
            <div className="mt-4 rounded-xl bg-rose-50/60 p-4">
              <label htmlFor={`r-${p._id}`} className="field-label">Reason (sent to the realtor)</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button key={r} type="button" onClick={() => setReason(r)} className={`rounded-full border px-2.5 py-1 text-xs ${reason === r ? "border-rose-500 bg-white text-rose-700" : "border-slate-200 bg-white text-slate-600"}`}>
                    {r}
                  </button>
                ))}
              </div>
              <textarea id={`r-${p._id}`} rows={2} className="field" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setRejecting(false)} className="btn-ghost btn-sm">Cancel</button>
                <button onClick={() => run(() => rejectListing(p._id, reason))} className="btn-danger btn-sm" disabled={pending}>
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Reject listing
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <button onClick={() => run(() => approveListing(p._id))} className="btn bg-emerald-600 text-white hover:bg-emerald-700" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve &amp; publish
              </button>
              <button onClick={() => setRejecting(true)} className="btn-outline text-rose-700" disabled={pending}>
                <X className="size-4" /> Reject…
              </button>
              <Link href={`/dashboard/listings/${p._id}/edit`} className="btn-ghost"><Pencil className="size-4" /> Edit</Link>
              <Link href={`/properties/${p.slug}`} target="_blank" className="btn-ghost"><ExternalLink className="size-4" /> Preview</Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
