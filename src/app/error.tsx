"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 text-slate-600">
          We couldn&apos;t load this page. If you&apos;re offline, reconnect and try again.
        </p>
        {error.digest ? <p className="mt-2 font-mono text-xs text-slate-400">Ref: {error.digest}</p> : null}
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            <RotateCcw className="size-4" /> Try again
          </button>
          <Link href="/" className="btn-outline">Go home</Link>
        </div>
      </div>
    </div>
  );
}
