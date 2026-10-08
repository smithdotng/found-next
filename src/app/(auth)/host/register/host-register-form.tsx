"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerHost } from "@/app/actions/host";
import { FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/form-bits";
import { NIGERIAN_STATES, stateLabel } from "@/lib/format";

export function HostRegisterForm() {
  const [state, action] = useActionState(registerHost, null);
  const e = (k: string) => state?.errors?.[k];
  return (
    <form action={action} className="space-y-5" noValidate>
      {state && !state.ok && !state.errors ? <FormMessage state={state} /> : null}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink">About you</legend>
        <TextField label="Full name" name="name" autoComplete="name" required error={e("name")} hint="As it appears on your ID — you'll sign the agreement with it" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Email" name="email" type="email" autoComplete="email" required error={e("email")} />
          <TextField label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="08031234567" required error={e("phone")} />
        </div>
        <PasswordField autoComplete="new-password" hint="At least 8 characters" error={e("password")} />
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-5">
        <legend className="text-sm font-semibold text-ink">Your apartments</legend>
        <TextField label="Business or brand name (optional)" name="businessName" placeholder="e.g. Palm Suites Abuja" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="f-state">State <span className="text-coral-500">*</span></label>
            <select id="f-state" name="state" className="field" defaultValue="">
              <option value="">Select state…</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{stateLabel(s)}</option>)}
            </select>
            {e("state") ? <p className="mt-1 text-xs text-rose-600">{e("state")}</p> : null}
          </div>
          <TextField label="City / area" name="city" placeholder="e.g. Wuse 2" required error={e("city")} />
        </div>
        <TextField label="Address of main property (optional)" name="address" autoComplete="street-address" hint="Only shared with the Found team for vetting" />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Apartments to list" name="units" type="number" min={1} defaultValue={1} required error={e("units")} />
          <div>
            <label className="field-label" htmlFor="f-experience">Hosting experience</label>
            <select id="f-experience" name="experience" className="field" defaultValue="">
              <option value="">Select…</option>
              <option value="new">New to hosting</option>
              <option value="0-1">Under 1 year</option>
              <option value="1-3">1–3 years</option>
              <option value="3+">3+ years</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="f-idType">ID you&apos;ll provide</label>
            <select id="f-idType" name="idType" className="field" defaultValue="">
              <option value="">Select…</option>
              <option value="nin">NIN slip</option>
              <option value="drivers_licence">Driver&apos;s licence</option>
              <option value="passport">International passport</option>
              <option value="voters_card">Voter&apos;s card</option>
              <option value="cac">CAC certificate (business)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="f-about">Anything else we should know? (optional)</label>
          <textarea id="f-about" name="about" rows={3} className="field" placeholder="Where your apartments are listed today, whether you own or manage them…" />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink">Payout account <span className="font-normal text-slate-500">(optional now, needed before your first payout)</span></legend>
        <p className="text-sm text-slate-500">Guests pay Found. After each check-in, Found sends your earnings to this account.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Bank" name="bankName" placeholder="e.g. Zenith Bank" error={e("bankName")} />
          <TextField label="Account number" name="accountNumber" inputMode="numeric" maxLength={10} placeholder="10 digits" error={e("accountNumber")} />
          <TextField label="Account name" name="accountName" error={e("accountName")} />
        </div>
      </fieldset>

      <div className="space-y-2 text-sm text-slate-600">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 rounded accent-brand-600" />
          <span>
            I agree to the <Link href="/terms" target="_blank" className="font-medium text-brand-600 hover:underline">Terms of use</Link> and{" "}
            <Link href="/privacy-policy" target="_blank" className="font-medium text-brand-600 hover:underline">Privacy policy</Link>, and understand that guests pay Found, and Found
            pays me my earnings less its commission and VAT, as set out in the host agreement I&apos;ll sign after vetting.
          </span>
        </label>
        {e("terms") ? <p className="text-xs text-rose-600">{e("terms")}</p> : null}
      </div>
      {state?.errors ? <FormMessage state={state} /> : null}
      <SubmitButton pendingText="Submitting…">Submit host application</SubmitButton>
      <p className="text-center text-sm text-slate-600">
        Already a host? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
