"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, FileText, Loader2, Trash2, X } from "lucide-react";
import { removePreVerificationDocument, reviewPreVerification, savePreVerification } from "@/app/actions/pre-verification";
import { FormMessage, TextField } from "@/components/ui/form-bits";
import { toast } from "@/components/ui/toaster";
import { DOC_KINDS, ENCUMBRANCES, TITLE_TYPES, labelFor } from "@/lib/pre-verification";
import type { FormState } from "@/app/actions/public";

export type CheckDoc = { _id: string; name: string; kind: string; size: number; contentType: string; uploadedAt: string };
export type Check = {
  titleType: string;
  titleTypeOther?: string;
  titleNumber?: string;
  titleHolder?: string;
  ownership: "owner" | "authorised";
  encumbered: "no" | "yes" | "unsure";
  encumbrances?: string[];
  encumbranceDetails?: string;
  surveyPlan?: string;
  notes?: string;
  documents: CheckDoc[];
};

function Section({ n, title, desc, children }: { n: number; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">{title}</h2>
          {desc ? <p className="mt-0.5 text-sm text-slate-500">{desc}</p> : null}
          <div className="mt-4 space-y-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-rose-600">{msg}</p> : null;
}

function Choice({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={clsx("flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition", checked ? "border-brand-600 bg-brand-50/60 font-medium text-ink" : "border-slate-200 text-slate-700 hover:border-slate-300")}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="accent-brand-600" />
      {children}
    </label>
  );
}

function FilePicker({ name, label, hint, error }: { name: string; label: string; hint?: string; error?: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={`f-${name}`}>{label}</label>
      <input
        id={`f-${name}`}
        type="file"
        name={name}
        multiple
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
      />
      {error ? <Err msg={error} /> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function PreVerificationForm({ propertyId, check }: { propertyId: string; check: Check | null }) {
  const [state, action, isPending] = useActionState<FormState, FormData>(savePreVerification, null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  // After a successful save the files are attached to the checklist: clear the pickers.
  useEffect(() => {
    if (state?.ok) formRef.current?.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((i) => (i.value = ""));
  }, [state]);
  const e = (k: string) => state?.errors?.[k];
  const [titleType, setTitleType] = useState(check?.titleType ?? "");
  const [ownership, setOwnership] = useState<string>(check?.ownership ?? "");
  const [encumbered, setEncumbered] = useState<string>(check?.encumbered ?? "");
  const [survey, setSurvey] = useState<string>(check?.surveyPlan ?? "");

  return (
    <form
      ref={formRef}
      className="space-y-5"
      // Submit manually so a validation error doesn't reset what the realtor typed and picked.
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="propertyId" value={propertyId} />

      <Section n={1} title="Title" desc="What document proves ownership of this property?">
        <div>
          <label className="field-label" htmlFor="f-titleType">Type of title <span className="text-coral-500">*</span></label>
          <select id="f-titleType" name="titleType" value={titleType} onChange={(ev) => setTitleType(ev.target.value)} className="field">
            <option value="" disabled>Choose…</option>
            {TITLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Err msg={e("titleType")} />
        </div>
        {titleType === "other" ? <TextField label="Describe the title" name="titleTypeOther" defaultValue={check?.titleTypeOther} error={e("titleTypeOther")} required /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name on the title document" name="titleHolder" defaultValue={check?.titleHolder} error={e("titleHolder")} required placeholder="Person or company" />
          <TextField label="Title / file / registration number" name="titleNumber" defaultValue={check?.titleNumber} placeholder="If available" />
        </div>
        <div>
          <p className="field-label">Is there a registered survey plan?</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Choice name="surveyPlan" value="yes" checked={survey === "yes"} onChange={() => setSurvey("yes")}>Yes</Choice>
            <Choice name="surveyPlan" value="in_progress" checked={survey === "in_progress"} onChange={() => setSurvey("in_progress")}>In progress</Choice>
            <Choice name="surveyPlan" value="no" checked={survey === "no"} onChange={() => setSurvey("no")}>No</Choice>
          </div>
        </div>
      </Section>

      <Section n={2} title="Your relationship to the property">
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice name="ownership" value="owner" checked={ownership === "owner"} onChange={() => setOwnership("owner")}>I am the owner</Choice>
          <Choice name="ownership" value="authorised" checked={ownership === "authorised"} onChange={() => setOwnership("authorised")}>I&apos;m authorised by the owner</Choice>
        </div>
        <Err msg={e("ownership")} />
        {ownership === "authorised" ? <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">Please upload the owner&apos;s letter of authority in section 4.</p> : null}
      </Section>

      <Section n={3} title="Encumbrances" desc="Is there anything that could limit the sale or letting of this property?">
        <div className="grid gap-2 sm:grid-cols-3">
          <Choice name="encumbered" value="no" checked={encumbered === "no"} onChange={() => setEncumbered("no")}>No encumbrance</Choice>
          <Choice name="encumbered" value="yes" checked={encumbered === "yes"} onChange={() => setEncumbered("yes")}>Yes, there is</Choice>
          <Choice name="encumbered" value="unsure" checked={encumbered === "unsure"} onChange={() => setEncumbered("unsure")}>Not sure</Choice>
        </div>
        <Err msg={e("encumbered")} />
        {encumbered === "yes" ? (
          <div>
            <p className="field-label">What kind? (select all that apply)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ENCUMBRANCES.map((x) => (
                <label key={x.value} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50/60">
                  <input type="checkbox" name="encumbrances" value={x.value} defaultChecked={check?.encumbrances?.includes(x.value)} className="size-4 accent-brand-600" />
                  {x.label}
                </label>
              ))}
            </div>
            <Err msg={e("encumbrances")} />
          </div>
        ) : null}
        {encumbered === "yes" || encumbered === "unsure" ? (
          <div>
            <label className="field-label" htmlFor="f-encumbranceDetails">Details <span className="text-coral-500">*</span></label>
            <textarea id="f-encumbranceDetails" name="encumbranceDetails" rows={3} defaultValue={check?.encumbranceDetails} className="field leading-6" placeholder="e.g. Mortgaged to XYZ Bank, balance being cleared; or describe what you're unsure about" />
            <Err msg={e("encumbranceDetails")} />
          </div>
        ) : null}
      </Section>

      <Section n={4} title="Documents" desc="PDF or clear photos, up to 10MB each. Only you and Found's verification team can see them.">
        {check?.documents?.length ? (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {check.documents.map((d) => <DocRow key={d._id} propertyId={propertyId} doc={d} canRemove />)}
          </ul>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FilePicker name="doc_title" label="Copy of the title document *" hint="All pages, clearly readable." error={e("doc_title")} />
          <FilePicker name="doc_survey" label="Survey plan" />
          <FilePicker name="doc_authority" label={ownership === "authorised" ? "Letter of authority *" : "Letter of authority"} error={e("doc_authority")} hint="Needed if you're acting for the owner." />
          <FilePicker name="doc_other" label="Other documents" hint="e.g. receipts, consent, court papers" error={e("doc_other")} />
        </div>
      </Section>

      <Section n={5} title="Anything else we should know?">
        <textarea name="notes" rows={3} defaultValue={check?.notes} className="field leading-6" placeholder="Optional" />
        <label className="flex items-start gap-2.5 text-sm text-slate-700">
          <input type="checkbox" name="declaration" className="mt-0.5 size-4 accent-brand-600" />
          <span>I confirm that the information and documents I&apos;ve provided are true and complete to the best of my knowledge, and I understand that Found may verify them with the relevant land registry.</span>
        </label>
        <Err msg={e("declaration")} />
      </Section>

      <FormMessage state={state} />
      <button type="submit" className="btn-primary w-full py-3" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isPending ? "Uploading…" : check ? "Update checklist" : "Submit checklist"}
      </button>
    </form>
  );
}

export function DocRow({ propertyId, doc, canRemove }: { propertyId: string; doc: CheckDoc; canRemove?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <li className="flex items-center gap-3 px-4 py-3 text-sm">
      <FileText className="size-4 shrink-0 text-slate-400" />
      <a href={`/dashboard/listings/${propertyId}/verification/doc/${doc._id}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-brand-700 hover:underline">
        {doc.name}
      </a>
      <span className="chip shrink-0 bg-slate-100 text-slate-600">{labelFor(DOC_KINDS, doc.kind)}</span>
      <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{Math.max(1, Math.round(doc.size / 1024)).toLocaleString()} KB</span>
      {canRemove ? (
        <button
          type="button"
          aria-label={`Remove ${doc.name}`}
          className="btn-ghost btn-sm !px-2 text-rose-600"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`Remove ${doc.name}?`)) return;
            start(async () => {
              const r = await removePreVerificationDocument(propertyId, doc._id);
              toast(r.message, r.ok ? "success" : "error");
              router.refresh();
            });
          }}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </button>
      ) : null}
    </li>
  );
}

export function PreVerificationReview({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const run = (accept: boolean) =>
    start(async () => {
      const r = await reviewPreVerification(propertyId, accept, note);
      toast(r.message, r.ok ? "success" : "error");
      if (r.ok) setNote("");
      router.refresh();
    });
  return (
    <div className="card space-y-3 p-5">
      <p className="font-semibold text-ink">Review</p>
      <textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={3} className="field text-sm" placeholder="Note to the realtor (required when requesting changes)" />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => run(true)}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Documents check out
        </button>
        <button type="button" className="btn-outline btn-sm text-rose-700" disabled={pending} onClick={() => run(false)}>
          <X className="size-3.5" /> Request changes
        </button>
      </div>
    </div>
  );
}
