"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Download, ExternalLink, QrCode, Share2, X } from "lucide-react";
import { trackShare } from "@/app/actions/agent";
import { toast } from "@/components/ui/toaster";
import { SmartImage } from "@/components/ui/smart-image";
import { formatPrice, locationLine, primaryImage, timeAgo } from "@/lib/format";
import type { PropertyDoc } from "@/lib/types";

type Promo = {
  _id: string;
  referralCode: string;
  referralLink: string;
  clicks: number;
  inquiries: number;
  transactions: number;
  earnings: number;
  createdAt: string;
  lastClickedAt?: string;
  property: PropertyDoc | null;
};

export function PromotionList({ promotions }: { promotions: Promo[] }) {
  const [qr, setQr] = useState<Promo | null>(null);

  const copy = async (t: string) => {
    await navigator.clipboard.writeText(t).catch(() => {});
    toast("Link copied");
  };

  const shareText = (p: Promo) =>
    p.property ? `🏠 ${p.property.title} — ${formatPrice(p.property.price)} in ${locationLine(p.property.location)}. Details: ${p.referralLink}` : p.referralLink;

  return (
    <>
      <div className="space-y-3">
        {promotions.map((p) =>
          p.property ? (
            <div key={p._id} className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <SmartImage src={primaryImage(p.property)} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{p.property.title}</p>
                  <p className="text-xs text-slate-500">{formatPrice(p.property.price)} · created {timeAgo(p.createdAt)}{p.lastClickedAt ? ` · last click ${timeAgo(p.lastClickedAt)}` : ""}</p>
                  {p.property.status !== "available" ? <p className="text-xs font-medium text-amber-700">This property is no longer live</p> : null}
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-4 text-center text-sm lg:w-64">
                <div><dt className="text-xs text-slate-500">Clicks</dt><dd className="font-bold text-ink">{p.clicks}</dd></div>
                <div><dt className="text-xs text-slate-500">Enquiries</dt><dd className="font-bold text-ink">{p.inquiries}</dd></div>
                <div><dt className="text-xs text-slate-500">Earned</dt><dd className="font-bold text-ink">{formatPrice(p.earnings)}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => copy(p.referralLink)} className="btn-outline btn-sm"><Copy className="size-3.5" /> Copy link</button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText(p))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackShare(p._id, "whatsapp")}
                  className="btn btn-sm border border-[#25D366]/40 bg-[#25D366]/10 text-[#128C4B]"
                >
                  WhatsApp
                </a>
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: p.property!.title, text: shareText(p), url: p.referralLink });
                      } catch {}
                    } else copy(p.referralLink);
                  }}
                  className="btn-outline btn-sm"
                  aria-label="Share"
                >
                  <Share2 className="size-3.5" />
                </button>
                <button onClick={() => setQr(p)} className="btn-outline btn-sm" aria-label="QR code"><QrCode className="size-3.5" /></button>
                <Link href={`/properties/${p.property.slug}`} target="_blank" className="btn-ghost btn-sm" aria-label="View property"><ExternalLink className="size-3.5" /></Link>
              </div>
            </div>
          ) : null,
        )}
      </div>

      {qr ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 animate-fade-in" role="dialog" aria-modal="true" onClick={() => setQr(null)}>
          <div className="card w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button onClick={() => setQr(null)} className="btn-ghost !px-2" aria-label="Close"><X className="size-4" /></button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/dashboard/promotions/${qr._id}/qr`} alt={`QR code for ${qr.referralCode}`} className="mx-auto size-64" />
            <p className="mt-3 font-mono text-xs text-slate-500">{qr.referralCode}</p>
            <p className="mt-1 text-sm text-slate-600">Print it on flyers or show it at inspections — scans count as clicks.</p>
            <a href={`/dashboard/promotions/${qr._id}/qr?download=1`} className="btn-primary mt-5 w-full"><Download className="size-4" /> Download PNG</a>
          </div>
        </div>
      ) : null}
    </>
  );
}
