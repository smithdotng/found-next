import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

// Precached by the service worker and shown when a page isn't available offline.
export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm text-center">
        <Image src="/assets/images/logo2.png" alt="Found" width={1000} height={355} className="mx-auto h-12 w-auto" />
        <span className="mx-auto mt-8 grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600">
          <WifiOff className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">You&apos;re offline</h1>
        <p className="mt-2 text-slate-600">
          This page hasn&apos;t been saved for offline use yet. Properties and pages you&apos;ve already opened are still available.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/saved" className="btn-primary">View saved</Link>
          <Link href="/" className="btn-outline">Home</Link>
        </div>
      </div>
    </div>
  );
}
