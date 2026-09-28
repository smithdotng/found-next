"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { createPromotion } from "@/app/actions/agent";
import { toast } from "@/components/ui/toaster";
import { SmartImage } from "@/components/ui/smart-image";
import { formatCompactPrice, formatPrice, locationLine, primaryImage, typeLabel } from "@/lib/format";
import type { PropertyDoc } from "@/lib/types";

export function PromoteGrid({ items, promoted }: { items: PropertyDoc[]; promoted: Record<string, string> }) {
  const router = useRouter();
  const [links, setLinks] = useState(promoted);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    toast("Link copied");
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => {
        const link = links[p._id];
        const fee = (p.agencyFee || p.price * 0.1) * 0.7;
        return (
          <div key={p._id} className="card flex flex-col overflow-hidden">
            <Link href={`/properties/${p.slug}`} target="_blank" className="relative aspect-[16/10] bg-slate-100">
              <SmartImage src={primaryImage(p)} alt={p.title} fill sizes="(min-width: 1280px) 33vw, 50vw" className="object-cover" />
            </Link>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs font-semibold uppercase text-brand-600">{typeLabel(p.propertyType)} · {locationLine(p.location)}</p>
              <p className="mt-1 line-clamp-2 font-semibold text-ink">{p.title}</p>
              <p className="mt-1 text-sm font-bold text-ink">{formatPrice(p.price)}</p>
              <p className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
                Potential commission: <strong>up to {formatCompactPrice(fee)}</strong>
              </p>
              <div className="mt-auto pt-4">
                {link ? (
                  <div className="flex gap-2">
                    <input readOnly value={link} className="field !py-2 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="Your referral link" />
                    <button onClick={() => copy(link)} className="btn-outline !px-3" aria-label="Copy link"><Copy className="size-4" /></button>
                  </div>
                ) : (
                  <button
                    className="btn-primary w-full"
                    disabled={busy === p._id}
                    onClick={() => {
                      setBusy(p._id);
                      start(async () => {
                        const r = await createPromotion(p._id);
                        setBusy(null);
                        toast(r.message, r.ok ? "success" : "error");
                        if (r.link) {
                          setLinks((l) => ({ ...l, [p._id]: r.link! }));
                          copy(r.link);
                        }
                        router.refresh();
                      });
                    }}
                  >
                    {busy === p._id ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Get my link
                  </button>
                )}
                {link ? <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700"><Check className="size-3.5" /> You&apos;re promoting this property</p> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
