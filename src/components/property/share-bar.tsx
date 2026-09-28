"use client";

import { Link2, Share2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";

export function ShareBar({ url, title, text }: { url: string; title: string; text: string }) {
  const enc = encodeURIComponent;
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* cancelled */
      }
    } else {
      await copy();
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      toast("Couldn't copy the link", "error");
    }
  };
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}`, cls: "hover:bg-[#25D366] hover:text-white" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, cls: "hover:bg-[#1877F2] hover:text-white" },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, cls: "hover:bg-black hover:text-white" },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, cls: "hover:bg-[#0A66C2] hover:text-white" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={nativeShare} className="btn-outline btn-sm">
        <Share2 className="size-3.5" /> Share
      </button>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={`btn-outline btn-sm ${l.cls}`}>
          {l.label}
        </a>
      ))}
      <button onClick={copy} className="btn-outline btn-sm" aria-label="Copy link">
        <Link2 className="size-3.5" />
      </button>
    </div>
  );
}
