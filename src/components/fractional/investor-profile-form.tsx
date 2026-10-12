"use client";

import { useActionState, useState } from "react";
import { saveInvestorProfile } from "@/app/actions/fractional";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form-bits";
import { NIGERIAN_STATES, stateLabel } from "@/lib/format";
import { INVESTOR_CATEGORY } from "@/lib/fractional";

type Defaults = {
  category: "retail" | "sophisticated" | "hnw";
  annualIncome?: number;
  occupation?: string;
  address?: string;
  city?: string;
  state?: string;
  idType?: string;
  idDocumentName?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  riskAcknowledged: boolean;
};

export function InvestorProfileForm({ defaults: d, next }: { defaults: Defaults; next?: string }) {
  const [state, action] = useActionState(saveInvestorProfile, null);
  const [category, setCategory] = useState(d.category);
  const e = (k: string) => state?.errors?.[k];
  return (
    <form action={action} className="space-y-6" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Which describes you?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(Object.keys(INVESTOR_CATEGORY) as (keyof typeof INVESTOR_CATEGORY)[]).map((k) => (
            <label key={k} className={`cursor-pointer rounded-xl border p-3 text-sm transition ${category === k ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="radio" name="category" value={k} checked={category === k} onChange={() => setCategory(k)} className="sr-only" />
              <span className="block font-semibold text-ink">{INVESTOR_CATEGORY[k].label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">{INVESTOR_CATEGORY[k].text}</span>
            </label>
          ))}
        </div>
        {e("category") ? <p className="mt-1 text-xs text-rose-600">{e("category")}</p> : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={`Net annual income (₦)${category === "retail" ? "" : " — optional"}`}
          name="annualIncome"
          inputMode="numeric"
          defaultValue={d.annualIncome ? String(d.annualIncome) : ""}
          required={category === "retail"}
          error={e("annualIncome")}
          hint="Your approximate net income for the year. Kept private."
        />
        <TextField label="Occupation" name="occupation" defaultValue={d.occupation} required error={e("occupation")} />
      </div>

      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-semibold text-ink">Address and ID</legend>
        <TextField label="Residential address" name="address" defaultValue={d.address} autoComplete="street-address" required error={e("address")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="City" name="city" defaultValue={d.city} />
          <div>
            <label className="field-label" htmlFor="f-state">State <span className="text-coral-500">*</span></label>
            <select id="f-state" name="state" className="field" defaultValue={d.state ?? ""}>
              <option value="">Select state…</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{stateLabel(s)}</option>)}
              <option value="Outside Nigeria">Outside Nigeria</option>
            </select>
            {e("state") ? <p className="mt-1 text-xs text-rose-600">{e("state")}</p> : null}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="f-idType">ID type <span className="text-coral-500">*</span></label>
            <select id="f-idType" name="idType" className="field" defaultValue={d.idType ?? ""}>
              <option value="">Select…</option>
              <option value="nin">NIN slip</option>
              <option value="drivers_licence">Driver&apos;s licence</option>
              <option value="passport">International passport</option>
              <option value="voters_card">Voter&apos;s card</option>
            </select>
            {e("idType") ? <p className="mt-1 text-xs text-rose-600">{e("idType")}</p> : null}
          </div>
          <div>
            <label className="field-label" htmlFor="f-id">Photo or scan of your ID {d.idDocumentName ? "" : <span className="text-coral-500">*</span>}</label>
            <input id="f-id" name="idDocument" type="file" accept="image/*,application/pdf" className="field file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-brand-700" />
            {e("idDocument") ? <p className="mt-1 text-xs text-rose-600">{e("idDocument")}</p> : d.idDocumentName ? <p className="field-hint">On file: {d.idDocumentName}. Upload a new one to replace it.</p> : <p className="field-hint">PDF or image, up to 10MB</p>}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-semibold text-ink">Payout account</legend>
        <p className="text-sm text-slate-500">Rent, sale proceeds and refunds are paid here. It must be in your name.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Bank" name="bankName" defaultValue={d.bankName} placeholder="e.g. Zenith Bank" error={e("bankName")} />
          <TextField label="Account number" name="accountNumber" defaultValue={d.accountNumber} inputMode="numeric" maxLength={10} error={e("accountNumber")} />
          <TextField label="Account name" name="accountName" defaultValue={d.accountName} error={e("accountName")} />
        </div>
      </fieldset>

      <label className="flex items-start gap-2 rounded-xl bg-amber-50/70 p-3 text-sm text-slate-700">
        <input type="checkbox" name="risk" defaultChecked={d.riskAcknowledged} className="mt-0.5 size-4 shrink-0 rounded accent-brand-600" />
        <span>
          I understand that investments on Found Fractional are not bank deposits, are not insured or guaranteed, can fall in value, and may be impossible to sell. I could lose some or all of the
          money I invest, and I&apos;ll only invest money I can afford to lose.
        </span>
      </label>
      {e("risk") ? <p className="-mt-4 text-xs text-rose-600">{e("risk")}</p> : null}

      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3 sm:w-auto" pendingText="Saving…">Save investor profile</SubmitButton>
    </form>
  );
}
