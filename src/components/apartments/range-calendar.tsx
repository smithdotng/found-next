"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, isoDay, parseDay } from "@/lib/stay";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function addMonths(d: Date, n: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

/**
 * Two-month range picker. `blocked` holds nights (YYYY-MM-DD) that are taken.
 * A stay can end on a blocked night's date (check-out morning) but can't span it.
 */
export function RangeCalendar({
  today,
  blocked,
  checkIn,
  checkOut,
  minNights = 1,
  onChange,
  months = 2,
}: {
  today: string;
  blocked: Set<string>;
  checkIn: string;
  checkOut: string;
  minNights?: number;
  onChange: (ci: string, co: string) => void;
  months?: number;
}) {
  const todayD = parseDay(today)!;
  const [view, setView] = useState(() => monthStart(parseDay(checkIn) ?? todayD));
  const [hover, setHover] = useState<string>("");

  // When choosing check-out, the first blocked night after check-in is the limit.
  const limit = useMemo(() => {
    if (!checkIn || checkOut) return null;
    let d = parseDay(checkIn)!;
    for (let i = 0; i < 400; i++) {
      if (blocked.has(isoDay(d))) return isoDay(d);
      d = addDays(d, 1);
    }
    return null;
  }, [checkIn, checkOut, blocked]);

  const pick = (day: string) => {
    if (!checkIn || checkOut || day <= checkIn) {
      if (blocked.has(day)) return;
      onChange(day, "");
      return;
    }
    if (limit && day > limit) {
      onChange(day, "");
      return;
    }
    const nights = Math.round((parseDay(day)!.getTime() - parseDay(checkIn)!.getTime()) / 86400000);
    if (nights < minNights) return;
    onChange(checkIn, day);
  };

  const end = checkOut || (checkIn && hover > checkIn && (!limit || hover <= limit) ? hover : "");

  return (
    <div>
      <div className="relative z-10 flex items-center justify-between">
        <button type="button" onClick={() => setView(addMonths(view, -1))} disabled={view <= monthStart(todayD)} className="grid size-8 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-30" aria-label="Previous month">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" onClick={() => setView(addMonths(view, 1))} className="grid size-8 place-items-center rounded-full hover:bg-slate-100" aria-label="Next month">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className={clsx("-mt-7 grid gap-6", months === 2 && "sm:grid-cols-2")}>
        {Array.from({ length: months }, (_, m) => {
          const first = addMonths(view, m);
          const pad = first.getUTCDay();
          const daysIn = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
          return (
            <div key={m} className={clsx(m > 0 && "hidden sm:block")}>
              <p className="pointer-events-none text-center text-sm font-semibold leading-8 text-ink">
                {first.toLocaleDateString("en-NG", { month: "long", year: "numeric", timeZone: "UTC" })}
              </p>
              <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
                {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-y-0.5 text-center text-sm" onMouseLeave={() => setHover("")}>
                {Array.from({ length: pad }, (_, i) => <span key={`p${i}`} />)}
                {Array.from({ length: daysIn }, (_, i) => {
                  const d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), i + 1));
                  const day = isoDay(d);
                  const past = day < today;
                  const taken = blocked.has(day);
                  const choosingOut = !!checkIn && !checkOut;
                  const beyond = choosingOut && limit ? day > limit : false;
                  // A taken night can still be picked as the check-out date.
                  const disabled = past || (choosingOut ? day <= checkIn ? taken : beyond : taken);
                  const isStart = day === checkIn;
                  const isEnd = day === end;
                  const inRange = checkIn && end && day > checkIn && day < end;
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => pick(day)}
                      onMouseEnter={() => setHover(day)}
                      aria-label={d.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
                      aria-pressed={isStart || isEnd}
                      className={clsx(
                        "relative h-10 text-sm transition",
                        inRange && "bg-brand-50",
                        isStart && end && "rounded-l-full bg-brand-50",
                        isEnd && "rounded-r-full bg-brand-50",
                        disabled ? "cursor-not-allowed text-slate-300" : "text-ink",
                        taken && !past && "line-through decoration-slate-300",
                      )}
                    >
                      <span
                        className={clsx(
                          "mx-auto grid size-10 place-items-center rounded-full",
                          (isStart || isEnd) && "bg-brand-600 font-semibold text-white",
                          !disabled && !isStart && !isEnd && "hover:ring-1 hover:ring-ink",
                        )}
                      >
                        {i + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
