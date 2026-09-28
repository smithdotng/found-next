"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useSaved } from "@/components/property/saved-store";
import { PropertyCard } from "@/components/property/property-card";
import type { PropertyDoc } from "@/lib/types";

export function SavedList() {
  const { ids, clear } = useSaved();
  const key = ids.join(",");
  const [loaded, setLoaded] = useState<{ key: string; items: PropertyDoc[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/properties?ids=${key}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setLoaded({ key, items: d.items }))
      .catch(() => !cancelled && setLoaded({ key, items: [] }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const items = !key ? [] : loaded?.key === key ? loaded.items : null;
  if (items === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" /> Loading your shortlist…
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center">
        <Heart className="mx-auto size-10 text-slate-300" />
        <p className="mt-3 font-semibold text-ink">Nothing saved yet</p>
        <p className="mt-1 text-sm text-slate-500">Tap the heart on any property to add it to your shortlist.</p>
        <Link href="/properties" className="btn-primary mt-6">Browse properties</Link>
      </div>
    );
  }
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button className="btn-ghost btn-sm" onClick={clear}>Clear all</button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <PropertyCard key={p._id} p={p} />
        ))}
      </div>
    </>
  );
}
