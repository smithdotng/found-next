"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Search, MapPin, Home } from "lucide-react";
import { NIGERIAN_STATES, PROPERTY_TYPES, stateLabel } from "@/lib/format";

const MODES = [
  { key: "sale", label: "Buy" },
  { key: "rent", label: "Rent" },
  { key: "shortlet", label: "Shortlet" },
  { key: "lease", label: "Lease" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof MODES)[number]["key"]>("sale");
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [type, setType] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (mode === "shortlet") q.set("type", "shortlet");
    else {
      q.set("transactionType", mode);
      if (type) q.set("type", type);
    }
    if (state) q.set("state", state);
    if (search.trim()) q.set("search", search.trim());
    router.push(`/properties?${q.toString()}`);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-3xl" role="search" aria-label="Search properties">
      <div className="inline-flex rounded-t-2xl bg-white/15 p-1 backdrop-blur" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            onClick={() => setMode(m.key)}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              mode === m.key ? "bg-white text-ink shadow-sm" : "text-white/90 hover:text-white",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 rounded-2xl rounded-tl-none bg-white p-2 shadow-lift sm:grid-cols-[1.4fr_1fr_1fr_auto]">
        <label className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50">
          <Search className="size-4 shrink-0 text-slate-400" />
          <span className="sr-only">Keyword</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Area, estate or keyword"
            className="w-full bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50 sm:border-l sm:border-slate-100">
          <MapPin className="size-4 shrink-0 text-slate-400" />
          <span className="sr-only">State</span>
          <select value={state} onChange={(e) => setState(e.target.value)} className="w-full bg-transparent text-sm text-ink focus:outline-none">
            <option value="">Any state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {stateLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label
          className={clsx(
            "flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50 sm:border-l sm:border-slate-100",
            mode === "shortlet" && "opacity-50",
          )}
        >
          <Home className="size-4 shrink-0 text-slate-400" />
          <span className="sr-only">Property type</span>
          <select
            value={mode === "shortlet" ? "shortlet" : type}
            disabled={mode === "shortlet"}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-transparent text-sm text-ink focus:outline-none"
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-accent h-full py-3 sm:px-6">
          <Search className="size-4" /> Search
        </button>
      </div>
    </form>
  );
}
