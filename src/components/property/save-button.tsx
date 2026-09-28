"use client";

import { Heart } from "lucide-react";
import clsx from "clsx";
import { useSaved } from "./saved-store";
import { toast } from "@/components/ui/toaster";

export function SaveButton({ id, variant = "overlay" }: { id: string; variant?: "overlay" | "button" }) {
  const saved = useSaved();
  const on = saved.has(id);
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saved.toggle(id);
    toast(on ? "Removed from saved" : "Saved — find it under Saved");
  };

  if (variant === "button") {
    return (
      <button onClick={onClick} className="btn-outline" aria-pressed={on}>
        <Heart className={clsx("size-4", on && "fill-coral-500 text-coral-500")} />
        {on ? "Saved" : "Save"}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save property"}
      className="grid size-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white"
    >
      <Heart className={clsx("size-[18px]", on && "fill-coral-500 text-coral-500")} />
    </button>
  );
}
