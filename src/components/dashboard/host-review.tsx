"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { reviewHost } from "@/app/actions/host";
import { toast } from "@/components/ui/toaster";

export function HostReview({ id, status, rate }: { id: string; status?: string; rate: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"" | "approve" | "reject">("");
  const [r, setR] = useState(String(rate));
  const [note, setNote] = useState("");
  const run = (decision: "approved" | "rejected" | "pending") =>
    start(async () => {
      const res = await reviewHost(id, decision, { rate: Number(r), note });
      toast(res.message, res.ok ? "success" : "error");
      if (res.ok) {
        setMode("");
        router.refresh();
      }
    });

  if (mode === "approve")
    return (
      <div className="w-full space-y-2 rounded-xl bg-emerald-50/60 p-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Commission
          <input value={r} onChange={(e) => setR(e.target.value.replace(/[^\d.]/g, ""))} className="field !w-20 !py-1.5 text-center" inputMode="decimal" />%
        </label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field text-sm" placeholder="Note to host (optional) — e.g. inspection notes" />
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => run("approved")} className="btn bg-emerald-600 text-white hover:bg-emerald-700 btn-sm">{pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Approve & send agreement</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setMode("")}>Cancel</button>
        </div>
      </div>
    );
  if (mode === "reject")
    return (
      <div className="w-full space-y-2 rounded-xl bg-rose-50/60 p-3">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field text-sm" placeholder="Reason — sent to the host" />
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => run("rejected")} className="btn-danger btn-sm">Reject host</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setMode("")}>Cancel</button>
        </div>
      </div>
    );
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" ? (
        <button type="button" onClick={() => setMode("approve")} className="btn bg-emerald-600 text-white hover:bg-emerald-700 btn-sm"><Check className="size-3.5" /> Approve</button>
      ) : (
        <button type="button" onClick={() => setMode("approve")} className="btn-outline btn-sm">Change commission</button>
      )}
      {status !== "rejected" ? <button type="button" onClick={() => setMode("reject")} className="btn-outline btn-sm text-rose-600"><X className="size-3.5" /> Reject</button> : null}
      {status !== "pending" ? <button type="button" disabled={pending} onClick={() => run("pending")} className="btn-ghost btn-sm"><RotateCcw className="size-3.5" /> Back to review</button> : null}
    </div>
  );
}
