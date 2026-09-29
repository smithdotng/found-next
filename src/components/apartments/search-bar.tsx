"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { addDays, isoDay, todayLagos } from "@/lib/stay";

export function ApartmentSearchBar({
  initial = {},
  variant = "hero",
}: {
  initial?: { where?: string; checkIn?: string; checkOut?: string; guests?: string };
  variant?: "hero" | "compact";
}) {
  const router = useRouter();
  const today = isoDay(todayLagos());
  const [where, setWhere] = useState(initial.where ?? "");
  const [checkIn, setCheckIn] = useState(initial.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial.checkOut ?? "");
  const [guests, setGuests] = useState(initial.guests ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (where.trim()) q.set("where", where.trim());
    if (checkIn && checkOut && checkOut > checkIn) {
      q.set("checkIn", checkIn);
      q.set("checkOut", checkOut);
    }
    if (guests) q.set("guests", guests);
    router.push(`/apartments${q.size ? `?${q}` : ""}#results`);
  };

  const cell = "flex min-w-0 flex-1 flex-col px-4 py-2.5";
  const label = "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500";
  const input = "mt-0.5 w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-400";

  return (
    <form
      onSubmit={submit}
      className={clsx(
        "flex flex-col divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white text-left shadow-lift ring-1 ring-slate-200 md:flex-row md:items-stretch md:divide-x md:divide-y-0",
        variant === "compact" && "shadow-card",
      )}
      role="search"
    >
      <label className={clsx(cell, "md:flex-[1.4]")}>
        <span className={label}><MapPin className="size-3.5" /> Where</span>
        <input className={input} value={where} onChange={(e) => setWhere(e.target.value)} placeholder="City or area, e.g. Wuse 2" />
      </label>
      <div className="grid grid-cols-2 divide-x divide-slate-200 md:flex md:flex-[1.6]">
        <label className={cell}>
          <span className={label}><CalendarDays className="size-3.5" /> Check-in</span>
          <input
            type="date"
            className={input}
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (!checkOut || checkOut <= e.target.value) setCheckOut(e.target.value ? isoDay(addDays(new Date(`${e.target.value}T00:00:00Z`), 2)) : "");
            }}
          />
        </label>
        <label className={cell}>
          <span className={label}><CalendarDays className="size-3.5" /> Check-out</span>
          <input type="date" className={input} min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-2 pr-2">
        <label className={clsx(cell, "md:w-32")}>
          <span className={label}><Users className="size-3.5" /> Guests</span>
          <select className={clsx(input, "appearance-none")} value={guests} onChange={(e) => setGuests(e.target.value)}>
            <option value="">Any</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-accent my-2 shrink-0 px-5 py-3" aria-label="Search apartments">
          <Search className="size-4" /> <span className="md:hidden lg:inline">Search</span>
        </button>
      </div>
    </form>
  );
}
