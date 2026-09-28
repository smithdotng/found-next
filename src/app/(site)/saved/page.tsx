import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { SavedList } from "./saved-list";

export const metadata: Metadata = pageMetadata({
  title: "Saved properties",
  description: "Your shortlist of saved properties on Found.",
  path: "/saved",
  noIndex: true,
});

export default function SavedPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Saved properties</h1>
      <p className="mt-1 text-sm text-slate-500">Your shortlist is stored on this device — no account needed.</p>
      <div className="mt-8">
        <SavedList />
      </div>
    </div>
  );
}
