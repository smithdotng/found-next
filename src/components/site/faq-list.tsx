import { ChevronDown } from "lucide-react";
import { FAQS } from "@/lib/faqs";

export function FaqList({ items = FAQS }: { items?: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {items.map((f) => (
        <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
            {f.q}
            <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-6 text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items = FAQS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
