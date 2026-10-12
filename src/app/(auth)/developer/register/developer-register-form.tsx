"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerDeveloper } from "@/app/actions/fractional";
import { FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/form-bits";
import { NIGERIAN_STATES, stateLabel } from "@/lib/format";

export function DeveloperRegisterForm() {
  const [state, action] = useActionState(registerDeveloper, null);
  const e = (k: string) => state?.errors?.[k];
  return (
    <form action={action} className="space-y-5" noValidate>
      {state && !state.ok && !state.errors ? <FormMessage state={state} /> : null}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink">About you</legend>
        <TextField label="Full name" name="name" autoComplete="name" required error={e("name")} hint="A director or authorised officer of the company" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Email" name="email" type="email" autoComplete="email" required error={e("email")} />
          <TextField label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="08031234567" required error={e("phone")} />
        </div>
        <PasswordField autoComplete="new-password" hint="At least 8 characters" error={e("password")} />
      </fieldset>
      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-semibold text-ink">Your company</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Company name" name="company" required error={e("company")} />
          <TextField label="CAC RC number" name="rcNumber" placeholder="RC 1234567" required error={e("rcNumber")} />
        </div>
        <TextField label="Office address" name="address" autoComplete="street-address" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="f-state">State <span className="text-coral-500">*</span></label>
            <select id="f-state" name="state" className="field" defaultValue="">
              <option value="">Select state…</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{stateLabel(s)}</option>)}
            </select>
            {e("state") ? <p className="mt-1 text-xs text-rose-600">{e("state")}</p> : null}
          </div>
          <TextField label="City" name="city" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Website (optional)" name="website" type="url" placeholder="https://" />
          <TextField label="Projects completed" name="projectsCompleted" type="number" min={0} defaultValue={0} />
        </div>
        <div>
          <label className="field-label" htmlFor="f-about">Your track record and the project you want to raise for</label>
          <textarea id="f-about" name="about" rows={4} className="field" placeholder="Past projects, how much you'd like to raise, location, timeline…" />
        </div>
      </fieldset>
      <div className="space-y-2 text-sm text-slate-600">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 rounded accent-brand-600" />
          <span>
            I agree to the <Link href="/terms" target="_blank" className="font-medium text-brand-600 hover:underline">Terms of use</Link>, confirm I&apos;m authorised to act for this company, and
            understand Found will verify the company and its directors before any offering goes live.
          </span>
        </label>
        {e("terms") ? <p className="text-xs text-rose-600">{e("terms")}</p> : null}
      </div>
      {state?.errors ? <FormMessage state={state} /> : null}
      <SubmitButton pendingText="Submitting…">Submit application</SubmitButton>
    </form>
  );
}
