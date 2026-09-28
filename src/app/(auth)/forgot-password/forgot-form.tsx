"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword, resetPassword } from "@/app/actions/auth";
import { FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/form-bits";

export function ForgotForm() {
  const [state, action] = useActionState(forgotPassword, null);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      {!state?.ok ? (
        <>
          <TextField label="Email" name="email" type="email" autoComplete="email" required autoFocus />
          <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
        </>
      ) : null}
      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters" required />
      <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" required />
      <SubmitButton pendingText="Saving…">Update password</SubmitButton>
    </form>
  );
}
