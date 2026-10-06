"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BadgeCheck, Building2, Check, Loader2, X } from "lucide-react";
import { reviewVerification, submitVerification } from "@/app/actions/verification";
import { FormMessage, TextField } from "@/components/ui/form-bits";
import { toast } from "@/components/ui/toaster";
import { formatPrice } from "@/lib/format";
import { VERIFICATION_PLANS, type VerificationPlan } from "@/lib/verification";
import type { FormState } from "@/app/actions/public";

type Listing = { _id: string; title: string; location: string; status: string; pending: boolean; checklist: "none" | "submitted" | "needs_changes" | "accepted" };

export function VerificationRequestForm({ listings, defaultPlan, annualBlocked }: { listings: Listing[]; defaultPlan: VerificationPlan; annualBlocked?: string }) {
  const [state, action, isPending] = useActionState<FormState, FormData>(submitVerification, null);
  const [, startSubmit] = useTransition();
  const [plan, setPlan] = useState<VerificationPlan>(annualBlocked && defaultPlan === "annual" ? "property" : defaultPlan);
  const [picked, setPicked] = useState<string[]>([]);
  const e = (k: string) => state?.errors?.[k];
  const total = plan === "annual" ? VERIFICATION_PLANS.annual.price : VERIFICATION_PLANS.property.price * picked.length;
  const today = new Date().toISOString().slice(0, 10);

  if (state?.ok) {
    return (
      <div className="card p-6 text-center sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <BadgeCheck className="size-6" />
        </span>
        <p className="mt-4 font-semibold text-ink">Payment details received</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      className="card space-y-6 p-5 sm:p-6"
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        startSubmit(() => action(fd));
      }}
    >
      <div>
        <p className="field-label">1. Choose a plan</p>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          {(Object.values(VERIFICATION_PLANS) as (typeof VERIFICATION_PLANS)[VerificationPlan][]).map((p) => {
            const disabled = p.key === "annual" && Boolean(annualBlocked);
            return (
              <label
                key={p.key}
                className={clsx(
                  "relative flex cursor-pointer flex-col rounded-2xl border p-4 transition",
                  plan === p.key ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-600/15" : "border-slate-200 hover:border-slate-300",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input type="radio" name="plan" value={p.key} checked={plan === p.key} disabled={disabled} onChange={() => setPlan(p.key)} className="sr-only" />
                <span className="text-sm font-semibold text-ink">{p.name}</span>
                <span className="mt-1 text-xl font-bold text-ink">
                  {formatPrice(p.price)} <span className="text-xs font-medium text-slate-500">{p.unit}</span>
                </span>
                <span className="mt-1 text-xs leading-5 text-slate-500">{disabled ? annualBlocked : p.summary}</span>
                {plan === p.key ? <Check className="absolute right-3 top-3 size-4 text-brand-600" /> : null}
              </label>
            );
          })}
        </div>
      </div>

      {plan === "property" ? (
        <div>
          <p className="field-label">2. Choose the listings to verify</p>
          <p className="-mt-1 mb-2 text-xs text-slate-500">Each listing needs a completed pre-verification checklist (title, encumbrances and a copy of the title).</p>
          {listings.length ? (
            <div className="mt-1 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200">
              {listings.map((l) => {
                const ready = l.checklist === "submitted" || l.checklist === "accepted";
                return (
                <label key={l._id} className={clsx("flex cursor-pointer items-center gap-3 px-4 py-3 text-sm", (l.pending || !ready) && "cursor-not-allowed")}>
                  <input
                    type="checkbox"
                    name="properties"
                    value={l._id}
                    disabled={l.pending || !ready}
                    checked={picked.includes(l._id)}
                    onChange={(ev) => setPicked((cur) => (ev.target.checked ? [...cur, l._id] : cur.filter((x) => x !== l._id)))}
                    className="size-4 accent-brand-600"
                  />
                  <span className={clsx("min-w-0 flex-1", (l.pending || !ready) && "opacity-60")}>
                    <span className="block truncate font-medium text-ink">{l.title}</span>
                    <span className="block truncate text-xs text-slate-500">{l.pending ? "Awaiting review in another request" : l.location}</span>
                  </span>
                  {ready ? (
                    <span className="chip shrink-0 bg-emerald-50 text-emerald-700">Checklist done</span>
                  ) : (
                    <a href={`/dashboard/listings/${l._id}/verification`} className="chip shrink-0 bg-amber-50 text-amber-800 hover:bg-amber-100">
                      {l.checklist === "needs_changes" ? "Update checklist" : "Complete checklist"}
                    </a>
                  )}
                </label>
                );
              })}
            </div>
          ) : (
            <p className="mt-1 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <Building2 className="size-4 text-slate-400" /> All your listings are verified, or you haven&apos;t added any yet.
            </p>
          )}
          {e("properties") ? <p className="mt-1 text-xs text-rose-600">{e("properties")}</p> : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-2xl bg-ink px-5 py-4 text-white">
        <span className="text-sm text-white/70">Amount to transfer</span>
        <span className="text-2xl font-bold tracking-tight">{formatPrice(total)}</span>
      </div>

      <div>
        <p className="field-label">{plan === "property" ? "3" : "2"}. Tell us about your transfer</p>
        <div className="mt-1 grid gap-4 sm:grid-cols-2">
          <TextField label="Name on the paying account" name="payerName" required error={e("payerName")} placeholder="e.g. Ada Okafor or Okafor Homes Ltd" />
          <TextField label="Payment reference (optional)" name="paymentReference" error={e("paymentReference")} placeholder="From your bank app or receipt" />
          <TextField label="Date paid" name="paidOn" type="date" max={today} defaultValue={today} error={e("paidOn")} />
          <div>
            <label className="field-label" htmlFor="f-proof">Receipt (optional)</label>
            <input id="f-proof" type="file" name="proof" accept="image/*" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
            {e("proof") ? <p className="mt-1 text-xs text-rose-600">{e("proof")}</p> : <p className="field-hint">A screenshot of the transfer speeds things up.</p>}
          </div>
        </div>
      </div>

      <FormMessage state={state} />
      <button type="submit" className="btn-primary w-full py-3" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isPending ? "Submitting…" : "I've paid, submit for verification"}
      </button>
    </form>
  );
}

export function ReviewButtons({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const run = (approve: boolean) =>
    start(async () => {
      const r = await reviewVerification(id, approve, note);
      toast(r.message, r.ok ? "success" : "error");
      router.refresh();
    });

  if (rejecting) {
    return (
      <div className="w-full space-y-2">
        <textarea
          value={note}
          onChange={(ev) => setNote(ev.target.value)}
          rows={2}
          className="field text-sm"
          placeholder="Reason, sent to the realtor (e.g. we couldn't find this transfer)"
        />
        <div className="flex gap-2">
          <button type="button" className="btn-sm btn bg-rose-600 text-white hover:bg-rose-700" disabled={pending} onClick={() => run(false)}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Reject
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setRejecting(false)}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-primary btn-sm"
        disabled={pending}
        onClick={() => window.confirm("Have you confirmed this payment in the Zenith Bank account? Approving switches on the badge.") && run(true)}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Payment confirmed, approve
      </button>
      <button type="button" className="btn-outline btn-sm" disabled={pending} onClick={() => setRejecting(true)}>
        Reject
      </button>
    </div>
  );
}
