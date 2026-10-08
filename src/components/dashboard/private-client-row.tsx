"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { updatePrivateClient } from "@/app/actions/prestige";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/format";
import { BUDGET_BANDS, CLIENT_INTERESTS, CLIENT_STATUS, PAYMENT_ROUTES, TIMELINES, labelOf } from "@/lib/prestige";

export type ClientRow = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  interest?: string;
  locations?: string[];
  budget?: string;
  timeline?: string;
  payment?: string;
  message?: string;
  partner?: string;
  referredBy?: string;
  property?: { title: string; slug: string } | null;
  status: string;
  notes?: string;
  createdAt: string;
};

export function PrivateClientRow({ r }: { r: ClientRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(r.notes ?? "");
  const st = CLIENT_STATUS[r.status] ?? CLIENT_STATUS.new;
  const save = (status: string) =>
    start(async () => {
      const res = await updatePrivateClient(r._id, status, notes);
      toast(res.message, res.ok ? "success" : "error");
      if (res.ok) router.refresh();
    });
  const wa = `https://wa.me/${r.phone.replace(/\D/g, "").replace(/^0/, "234")}?text=${encodeURIComponent(`Hello ${r.name.split(" ")[0]}, this is your relationship manager at Found Prestige.`)}`;
  const facts = [
    ["Looking to", labelOf(CLIENT_INTERESTS, r.interest)],
    ["Budget", labelOf(BUDGET_BANDS, r.budget)],
    ["Timeline", labelOf(TIMELINES, r.timeline)],
    ["Paying by", labelOf(PAYMENT_ROUTES, r.payment)],
    ["Areas", r.locations?.join(", ")],
    ["Based in", r.country],
    ["Referred by", [r.partner, r.referredBy].filter(Boolean).join(" · ")],
    ["Enquired about", r.property?.title],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <details className="card group p-4" open={r.status === "new"}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
        <span className={`chip ${st.tone}`}>{st.label}</span>
        <span className="font-semibold text-ink">{r.name}</span>
        <span className="text-sm text-slate-500">{labelOf(BUDGET_BANDS, r.budget) || "Budget not given"}</span>
        <span className="ml-auto text-xs text-slate-400">{formatDate(r.createdAt)}</span>
      </summary>
      <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium text-ink">{v}</dd></div>
            ))}
          </dl>
          {r.message ? <blockquote className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{r.message}</blockquote> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`tel:${r.phone}`} className="btn-outline btn-sm"><Phone className="size-3.5" /> {r.phone}</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm"><MessageCircle className="size-3.5" /> WhatsApp</a>
            <a href={`mailto:${r.email}?subject=${encodeURIComponent("Found Prestige")}`} className="btn-outline btn-sm"><Mail className="size-3.5" /> {r.email}</a>
          </div>
        </div>
        <div className="space-y-2">
          <label className="field-label" htmlFor={`n-${r._id}`}>Private notes</label>
          <textarea id={`n-${r._id}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="field text-sm" placeholder="Call notes, brief, next step…" />
          <div className="flex flex-wrap gap-2">
            {(["contacted", "qualified", "closed"] as const).map((s) => (
              <button key={s} type="button" disabled={pending} onClick={() => save(s)} className={s === "qualified" ? "btn-primary btn-sm" : "btn-outline btn-sm"}>
                Mark {CLIENT_STATUS[s].label.toLowerCase()}
              </button>
            ))}
            <button type="button" disabled={pending} onClick={() => save(r.status)} className="btn-ghost btn-sm">Save notes</button>
          </div>
        </div>
      </div>
    </details>
  );
}
