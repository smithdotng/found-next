"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "@/components/ui/toaster";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form-bits";
import { declareDistribution, listUnitsForSale, postOfferingUpdate, submitOrderPayment } from "@/app/actions/fractional";
import { formatPrice } from "@/lib/format";
import { resaleProceeds } from "@/lib/fractional";

/**
 * A button that asks for a short note or reference (e.g. a transfer reference or a
 * reason) before running a server action bound to a record.
 */
export function PromptAction({
  action,
  prompt,
  required,
  placeholder,
  className = "btn-outline btn-sm",
  confirmLabel = "Confirm",
  children,
}: {
  action: (text: string) => Promise<{ ok: boolean; message: string }>;
  prompt: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  confirmLabel?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      const r = await action(text.trim());
      toast(r.message, r.ok ? "success" : "error");
      if (r.ok) {
        setOpen(false);
        setText("");
        router.refresh();
      }
    });
  if (!open)
    return (
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
    );
  return (
    <div className="w-full space-y-2 rounded-xl bg-slate-50 p-3">
      <label className="block text-xs font-medium text-slate-600">{prompt}</label>
      <input value={text} onChange={(e) => setText(e.target.value)} className="field text-sm" placeholder={placeholder} autoFocus />
      <div className="flex gap-2">
        <button type="button" className="btn-primary btn-sm" disabled={pending || (required && !text.trim())} onClick={run}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} {confirmLabel}
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

/** Investor tells Found they've transferred the money for an order. */
export function PaymentForm({ reference, defaultName }: { reference: string; defaultName: string }) {
  const router = useRouter();
  const [state, action] = useActionState(async (prev: Parameters<typeof submitOrderPayment>[0], fd: FormData) => {
    const r = await submitOrderPayment(prev, fd);
    if (r?.ok) router.refresh();
    return r;
  }, null);
  const e = (k: string) => state?.errors?.[k];
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="reference" value={reference} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name on the account you paid from" name="payerName" defaultValue={defaultName} required error={e("payerName")} />
        <TextField label="Transfer reference (optional)" name="paymentReference" placeholder="From your bank app" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Date paid" name="paidOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} error={e("paidOn")} />
        <div>
          <label className="field-label" htmlFor="f-proof">Receipt screenshot (optional)</label>
          <input id="f-proof" name="proof" type="file" accept="image/*" className="field file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-brand-700" />
          {e("proof") ? <p className="mt-1 text-xs text-rose-600">{e("proof")}</p> : null}
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3 sm:w-auto" pendingText="Sending…">I&apos;ve made the transfer</SubmitButton>
    </form>
  );
}

/** Lists some of a holding's units on the resale market. */
export function SellForm({ holdings }: { holdings: { offeringId: string; title: string; free: number; unitPrice: number; value: number; resaleFee: number }[] }) {
  const router = useRouter();
  const [pick, setPick] = useState(holdings[0]?.offeringId ?? "");
  const h = holdings.find((x) => x.offeringId === pick);
  const [units, setUnits] = useState(1);
  const [price, setPrice] = useState(h?.value ?? 0);
  const [state, action] = useActionState(async (prev: Parameters<typeof listUnitsForSale>[0], fd: FormData) => {
    const r = await listUnitsForSale(prev, fd);
    if (r?.ok) router.refresh();
    return r;
  }, null);
  if (!h) return <p className="text-sm text-slate-500">You don&apos;t have units that can be sold yet. Units can be listed once an offering&apos;s raise has closed.</p>;
  const p = resaleProceeds(price || 0, units || 0, h.resaleFee);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="f-offering">Property</label>
        <select
          id="f-offering"
          name="offeringId"
          className="field"
          value={pick}
          onChange={(e) => {
            setPick(e.target.value);
            const n = holdings.find((x) => x.offeringId === e.target.value);
            if (n) setPrice(n.value);
            setUnits(1);
          }}
        >
          {holdings.map((x) => <option key={x.offeringId} value={x.offeringId}>{x.title} · {x.free} units free</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Units to sell" name="units" type="number" min={1} max={h.free} value={units} onChange={(e) => setUnits(Number(e.target.value))} error={state?.errors?.units} />
        <TextField
          label="Price per unit (₦)"
          name="pricePerUnit"
          inputMode="numeric"
          value={price ? String(price) : ""}
          onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, "")))}
          hint={`You paid ${formatPrice(h.unitPrice)} · latest valuation ${formatPrice(h.value)}`}
          error={state?.errors?.pricePerUnit}
        />
      </div>
      <dl className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-sm">
        <div className="flex justify-between"><dt className="text-slate-600">Sale price</dt><dd>{formatPrice(p.gross)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-600">Found resale fee ({h.resaleFee}%)</dt><dd>−{formatPrice(p.fee)}</dd></div>
        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-ink"><dt>You receive if all sell</dt><dd>{formatPrice(p.net)}</dd></div>
      </dl>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3 sm:w-auto" pendingText="Listing…">List units for sale</SubmitButton>
    </form>
  );
}

/** Developer or admin posts a progress update on an offering. */
export function UpdateForm({ offeringId }: { offeringId: string }) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(async (prev: Parameters<typeof postOfferingUpdate>[0], fd: FormData) => {
    const r = await postOfferingUpdate(prev, fd);
    if (r?.ok) {
      ref.current?.reset();
      router.refresh();
    }
    return r;
  }, null);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="offeringId" value={offeringId} />
      <TextField label="Title" name="title" placeholder="e.g. Roofing complete on Block B" error={state?.errors?.title} />
      <div>
        <label className="field-label" htmlFor="f-body">Details</label>
        <textarea id="f-body" name="body" rows={3} className="field" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Construction progress (%)" name="progress" type="number" min={0} max={100} />
        <div>
          <label className="field-label" htmlFor="f-uimg">Photo (optional)</label>
          <input id="f-uimg" name="image" type="file" accept="image/*" className="field" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="notify" defaultChecked className="size-4 rounded accent-brand-600" /> Email every investor
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary" pendingText="Posting…">Post update</SubmitButton>
    </form>
  );
}

/** Admin declares rental income or sale proceeds for an offering's investors. */
export function DistributionForm({ offeringId, managementFee, units }: { offeringId: string; managementFee: number; units: number }) {
  const router = useRouter();
  const [kind, setKind] = useState("rental");
  const [gross, setGross] = useState(0);
  const [state, action] = useActionState(async (prev: Parameters<typeof declareDistribution>[0], fd: FormData) => {
    const r = await declareDistribution(prev, fd);
    if (r?.ok) router.refresh();
    return r;
  }, null);
  const fee = kind === "rental" ? Math.round((gross * managementFee) / 100) : 0;
  const net = gross - fee;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="offeringId" value={offeringId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="f-kind">Type</label>
          <select id="f-kind" name="kind" className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="rental">Rental income</option>
            <option value="exit">Sale proceeds (exit)</option>
            <option value="other">Other</option>
          </select>
        </div>
        <TextField label="Period" name="period" placeholder="e.g. Q3 2026" />
        <TextField label="Amount received (₦)" name="gross" inputMode="numeric" value={gross ? String(gross) : ""} onChange={(e) => setGross(Number(e.target.value.replace(/\D/g, "")))} error={state?.errors?.gross} />
      </div>
      <TextField label="Note to investors (optional)" name="note" />
      <p className={clsx("rounded-xl bg-slate-50 p-3 text-sm text-slate-600", !gross && "opacity-60")}>
        {kind === "rental" ? `${managementFee}% management fee ${formatPrice(fee)} · ` : ""}
        <strong className="text-ink">{formatPrice(net)}</strong> to investors · about {formatPrice(units ? net / units : 0)} per unit across {units.toLocaleString()} units
      </p>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary" pendingText="Declaring…">Declare distribution</SubmitButton>
    </form>
  );
}
