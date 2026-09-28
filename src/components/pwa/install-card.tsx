"use client";

import { Download, Share, Smartphone } from "lucide-react";
import { usePwa } from "./pwa-provider";

/** Install call-to-action: native prompt on Android/desktop, instructions on iOS. */
export function InstallCard() {
  const { canInstall, install, isIos, isStandalone } = usePwa();
  if (isStandalone) return null;

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Smartphone className="size-4 text-brand-600" /> Get the app
      </div>
      <p className="mt-1.5 text-xs leading-5 text-slate-600">
        Install Found on your phone for faster search, saved listings and offline access.
      </p>
      {canInstall ? (
        <button onClick={install} className="btn-primary btn-sm mt-3 w-full">
          <Download className="size-3.5" /> Install
        </button>
      ) : isIos ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
          Tap <Share className="size-3.5" /> then &ldquo;Add to Home Screen&rdquo;
        </p>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
          Use your browser menu → &ldquo;Install app&rdquo;
        </p>
      )}
    </div>
  );
}
