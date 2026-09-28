"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/form-bits";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required autoFocus />
      <PasswordField autoComplete="current-password" required />
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input type="checkbox" name="remember" defaultChecked className="size-4 rounded border-slate-300 accent-brand-600" /> Keep me signed in
        </label>
        <Link href="/forgot-password" className="font-medium text-brand-600 hover:underline">Forgot password?</Link>
      </div>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      <div className="relative py-2 text-center text-xs text-slate-400">
        <span className="relative z-10 bg-white px-2">New to Found?</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/register" className="btn-outline">List as a realtor</Link>
        <Link href="/agent/register" className="btn-outline">Join as an agent</Link>
      </div>
    </form>
  );
}
