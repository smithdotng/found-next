"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import clsx from "clsx";
import { SmartImage } from "@/components/ui/smart-image";

export function Gallery({ images, title }: { images: { url: string }[]; title: string }) {
  const list = images.length ? images : [{ url: "/assets/images/og-1200x630.jpg" }];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const go = useCallback((d: number) => setIndex((i) => (i + d + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  // Touch swipe
  const [touchX, setTouchX] = useState<number | null>(null);
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => setTouchX(e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      setTouchX(null);
    },
  };

  return (
    <>
      {/* Mobile: swipeable single image. Desktop: mosaic */}
      <div className="relative md:hidden -mx-4 sm:mx-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 sm:rounded-2xl" {...swipe}>
          <SmartImage src={list[index].url} alt={`${title} — photo ${index + 1}`} fill priority sizes="100vw" className="object-cover" />
        </div>
        {list.length > 1 ? (
          <>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {list.slice(0, 10).map((_, i) => (
                <span key={i} className={clsx("h-1.5 rounded-full bg-white transition-all", i === index ? "w-5" : "w-1.5 opacity-60")} />
              ))}
            </div>
            <button onClick={() => setOpen(true)} className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-ink/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">
              <Images className="size-3.5" /> {index + 1}/{list.length}
            </button>
          </>
        ) : null}
      </div>

      <div className="hidden gap-2 overflow-hidden rounded-3xl md:grid md:h-[460px] md:grid-cols-4 md:grid-rows-2">
        {list.slice(0, 5).map((img, i) => (
          <button
            key={img.url + i}
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            className={clsx("group relative overflow-hidden bg-slate-100", mosaicClass(list.length, i))}
            aria-label={`Open photo ${i + 1}`}
          >
            <SmartImage
              src={img.url}
              alt={`${title} — photo ${i + 1}`}
              fill
              priority={i === 0}
              sizes={i === 0 ? "50vw" : "25vw"}
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            {i === 4 && list.length > 5 ? (
              <span className="absolute inset-0 grid place-items-center bg-ink/50 text-lg font-semibold text-white">+{list.length - 5} photos</span>
            ) : null}
          </button>
        ))}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-ink/95 animate-fade-in" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="flex items-center justify-between p-4 text-sm text-white/80">
            <span>
              {index + 1} / {list.length}
            </span>
            <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex-1" {...swipe}>
            <SmartImage src={list[index].url} alt={`${title} — photo ${index + 1}`} fill sizes="100vw" className="object-contain" />
            {list.length > 1 ? (
              <>
                <button onClick={() => go(-1)} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous photo">
                  <ChevronLeft className="size-6" />
                </button>
                <button onClick={() => go(1)} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next photo">
                  <ChevronRight className="size-6" />
                </button>
              </>
            ) : null}
          </div>
          <div className="flex gap-2 overflow-x-auto p-4 scrollbar-none">
            {list.map((img, i) => (
              <button
                key={img.url + i}
                onClick={() => setIndex(i)}
                className={clsx("relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition", i === index ? "ring-white" : "opacity-50 ring-transparent hover:opacity-80")}
              >
                <SmartImage src={img.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function mosaicClass(n: number, i: number) {
  const big = "col-span-2 row-span-2";
  const layouts: Record<number, string[]> = {
    1: ["col-span-4 row-span-2"],
    2: [big, big],
    3: [big, "col-span-2", "col-span-2"],
    4: [big, "", "", "col-span-2"],
  };
  return (layouts[n] ?? [big, "", "", "", ""])[i] ?? "";
}
