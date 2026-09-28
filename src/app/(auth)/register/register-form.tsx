"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAgent, registerRealtor } from "@/app/actions/auth";
import { FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/form-bits";

export function RegisterForm({ kind }: { kind: "realtor" | "agent" }) {
  const [state, action] = useActionState(kind === "realtor" ? registerRealtor : registerAgent, null);
  const e = (k: string) => state?.errors?.[k];
  return (
    <form action={action} className="space-y-4" noValidate>
      {state && !state.ok && !state.errors ? <FormMessage state={state} /> : null}
      <TextField label="Full name" name="name" autoComplete="name" required error={e("name")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Email" name="email" type="email" autoComplete="email" required error={e("email")} />
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="08031234567" required error={e("phone")} />
      </div>
      {kind === "realtor" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Company (optional)" name="company" autoComplete="organization" />
          <TextField label="RC number (optional)" name="rcNumber" hint="Speeds up verification" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Social handle (optional)" name="socialHandle" placeholder="@yourhandle" hint="Where you'll share listings" />
          <div>
            <label className="field-label" htmlFor="f-experience">Experience</label>
            <select id="f-experience" name="experience" className="field" defaultValue="">
              <option value="">Select…</option>
              <option value="none">New to real estate</option>
              <option value="0-1">Less than 1 year</option>
              <option value="1-3">1–3 years</option>
              <option value="3-5">3–5 years</option>
              <option value="5+">5+ years</option>
            </select>
          </div>
        </div>
      )}
      <PasswordField autoComplete="new-password" hint="At least 8 characters" error={e("password")} />
      <div className="space-y-2 pt-1 text-sm text-slate-600">
        {kind === "realtor" ? (
          <label className="flex items-start gap-2">
            <input type="checkbox" name="newsletter" className="mt-0.5 size-4 rounded accent-brand-600" /> Send me market updates and the Found newsletter
          </label>
        ) : null}
        <label className="flex items-start gap-2">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 rounded accent-brand-600" /> I agree to the{" "}
          <Link href="/terms" className="font-medium text-brand-600 hover:underline" target="_blank">Terms of use</Link> and{" "}
          <Link href="/privacy-policy" className="font-medium text-brand-600 hover:underline" target="_blank">Privacy policy</Link>
        </label>
        {e("terms") ? <p className="text-xs text-rose-600">{e("terms")}</p> : null}
      </div>
      {state?.errors ? <FormMessage state={state} /> : null}
      <SubmitButton pendingText="Creating your account…">{kind === "realtor" ? "Create realtor account" : "Create agent account"}</SubmitButton>
      <p className="text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
