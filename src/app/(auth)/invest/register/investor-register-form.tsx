"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerInvestor } from "@/app/actions/fractional";
import { FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/form-bits";

export function InvestorRegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(registerInvestor, null);
  const e = (k: string) => state?.errors?.[k];
  return (
    <form action={action} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state && !state.ok && !state.errors ? <FormMessage state={state} /> : null}
      <TextField label="Full name" name="name" autoComplete="name" required error={e("name")} hint="As it appears on your ID — units are registered in this name" />
      <TextField label="Email" name="email" type="email" autoComplete="email" required error={e("email")} />
      <TextField label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="08031234567" required error={e("phone")} />
      <PasswordField autoComplete="new-password" hint="At least 8 characters" error={e("password")} />
      <div className="space-y-2 text-sm text-slate-600">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 rounded accent-brand-600" />
          <span>
            I agree to the <Link href="/terms" target="_blank" className="font-medium text-brand-600 hover:underline">Terms of use</Link> and{" "}
            <Link href="/privacy-policy" target="_blank" className="font-medium text-brand-600 hover:underline">Privacy policy</Link>.
          </span>
        </label>
        {e("terms") ? <p className="text-xs text-rose-600">{e("terms")}</p> : null}
        <label className="flex items-start gap-2">
          <input type="checkbox" name="newsletter" className="mt-0.5 size-4 rounded accent-brand-600" />
          <span>Email me when new offerings open.</span>
        </label>
      </div>
      {state?.errors ? <FormMessage state={state} /> : null}
      <SubmitButton pendingText="Creating account…">Create investor account</SubmitButton>
      <p className="text-center text-xs text-slate-500">Next, you&apos;ll verify your ID once. It takes about two minutes.</p>
    </form>
  );
}
