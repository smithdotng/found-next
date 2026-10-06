"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies `value` to the clipboard and briefly shows a tick. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          /* clipboard blocked: the value is visible to copy by hand */
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
      aria-label={`${label} ${value}`}
    >
      {done ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />} {done ? "Copied" : label}
    </button>
  );
}
