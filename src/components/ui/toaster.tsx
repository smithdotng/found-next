"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Toast = { id: number; kind: "success" | "error"; text: string };

/** Fire a toast from any client component. */
export function toast(text: string, kind: Toast["kind"] = "success") {
  window.dispatchEvent(new CustomEvent("found:toast", { detail: { text, kind } }));
}

function ToasterInner() {
  const [items, setItems] = useState<Toast[]>([]);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onToast = (e: Event) => {
      const { text, kind } = (e as CustomEvent).detail as Omit<Toast, "id">;
      const id = Date.now() + Math.random();
      setItems((t) => [...t, { id, text, kind }]);
      setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 5000);
    };
    window.addEventListener("found:toast", onToast);
    return () => window.removeEventListener("found:toast", onToast);
  }, []);

  // Server redirects carry flash messages as ?notice= / ?error= (replaces connect-flash).
  useEffect(() => {
    const notice = params.get("notice");
    const error = params.get("error");
    if (!notice && !error) return;
    if (notice) toast(notice, "success");
    if (error) toast(error, "error");
    const next = new URLSearchParams(params.toString());
    next.delete("notice");
    next.delete("error");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-lift animate-slide-up"
        >
          {t.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden />
          )}
          <p className="flex-1 text-slate-700">{t.text}</p>
          <button
            onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Toaster() {
  return (
    <Suspense fallback={null}>
      <ToasterInner />
    </Suspense>
  );
}
