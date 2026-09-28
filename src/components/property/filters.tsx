"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";
import { NIGERIAN_STATES, PROPERTY_TYPES, TRANSACTION_TYPES, stateLabel } from "@/lib/format";

type Facets = { types: Record<string, number>; states: { state: string; count: number }[] };

const PRICE_PRESETS = [
  { label: "Any", min: "", max: "" },
  { label: "Under ₦1M", min: "", max: "1000000" },
  { label: "₦1M – ₦10M", min: "1000000", max: "10000000" },
  { label: "₦10M – ₦50M", min: "10000000", max: "50000000" },
  { label: "₦50M – ₦200M", min: "50000000", max: "200000000" },
  { label: "₦200M+", min: "200000000", max: "" },
];

export function PropertyFilters({ facets }: { facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const get = (k: string) => params.get(k) ?? "";

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const stateCounts = Object.fromEntries(facets.states.map((s) => [s.state, s.count]));
  const activeCount = ["type", "transactionType", "state", "minPrice", "maxPrice", "bedrooms", "search"].filter((k) => params.get(k)).length;

  const panel = (
    <div className="space-y-7">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ search: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
        }}
      >
        <label className="field-label" htmlFor="f-search">
          Keyword
        </label>
        <div className="flex gap-2">
          <input id="f-search" name="q" className="field" placeholder="e.g. Lekki, duplex" defaultValue={get("search")} key={get("search")} />
          <button className="btn-primary !px-3" aria-label="Apply keyword">
            Go
          </button>
        </div>
      </form>

      <fieldset>
        <legend className="field-label">Looking to</legend>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
          {[{ value: "", label: "Any" }, ...TRANSACTION_TYPES.map((t) => ({ value: t.value, label: t.label.replace("For ", "") }))].map((t) => (
            <button
              key={t.value || "any"}
              type="button"
              onClick={() => update({ transactionType: t.value })}
              className={clsx(
                "rounded-lg py-1.5 text-xs font-semibold transition",
                get("transactionType") === t.value ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">Property type</legend>
        <div className="space-y-1">
          {[{ value: "", label: "All types" }, ...PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.plural }))].map((t) => {
            const on = get("type") === t.value;
            return (
              <button
                key={t.value || "all"}
                type="button"
                onClick={() => update({ type: t.value })}
                className={clsx(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                  on ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                {t.label}
                {t.value ? <span className="text-xs text-slate-400">{facets.types[t.value] ?? 0}</span> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label className="field-label" htmlFor="f-state">
          State
        </label>
        <select id="f-state" className="field" value={get("state")} onChange={(e) => update({ state: e.target.value })}>
          <option value="">All states</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {stateLabel(s)}
              {stateCounts[s] ? ` (${stateCounts[s]})` : ""}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="field-label">Budget</legend>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((p) => {
            const on = get("minPrice") === p.min && get("maxPrice") === p.max;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => update({ minPrice: p.min, maxPrice: p.max })}
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <form
          className="mt-3 grid grid-cols-2 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            update({ minPrice: String(fd.get("min") || ""), maxPrice: String(fd.get("max") || "") });
          }}
        >
          <input name="min" inputMode="numeric" className="field" placeholder="Min ₦" defaultValue={get("minPrice")} key={`min-${get("minPrice")}`} />
          <input name="max" inputMode="numeric" className="field" placeholder="Max ₦" defaultValue={get("maxPrice")} key={`max-${get("maxPrice")}`} />
          <button className="btn-outline col-span-2 btn-sm">Apply budget</button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="field-label">Bedrooms</legend>
        <div className="grid grid-cols-6 gap-1">
          {["", "1", "2", "3", "4", "5"].map((b) => (
            <button
              key={b || "any"}
              type="button"
              onClick={() => update({ bedrooms: b })}
              className={clsx(
                "rounded-lg border py-1.5 text-xs font-semibold transition",
                get("bedrooms") === b ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              {b ? `${b}+` : "Any"}
            </button>
          ))}
        </div>
      </fieldset>

      {activeCount ? (
        <button type="button" className="btn-ghost w-full" onClick={() => start(() => router.push(pathname))}>
          <X className="size-4" /> Clear all filters
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Filters</h2>
            {pending ? <Loader2 className="size-4 animate-spin text-brand-600" /> : null}
          </div>
          {panel}
        </div>
      </aside>

      <button type="button" onClick={() => setOpen(true)} className="btn-outline lg:hidden">
        <SlidersHorizontal className="size-4" /> Filters
        {activeCount ? <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-[10px] text-white">{activeCount}</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold">Filters</h2>
              <button className="btn-ghost !px-2" onClick={() => setOpen(false)} aria-label="Close filters">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{panel}</div>
            <div className="border-t border-slate-100 p-4 safe-bottom">
              <button className="btn-primary w-full" onClick={() => setOpen(false)}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null} Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm text-slate-500">
      <span className="hidden sm:inline">Sort</span>
      <select
        className="field !w-auto !py-2"
        value={params.get("sort") ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value) next.set("sort", e.target.value);
          else next.delete("sort");
          next.delete("page");
          router.push(`${pathname}?${next.toString()}`, { scroll: false });
        }}
      >
        <option value="">Recommended</option>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="popular">Most viewed</option>
      </select>
    </label>
  );
}
