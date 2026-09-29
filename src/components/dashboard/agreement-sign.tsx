"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileSignature, Printer } from "lucide-react";
import { acceptAgreement } from "@/app/actions/host";
import { FormMessage, SubmitButton } from "@/components/ui/form-bits";

type State = { ok: boolean; message: string; errors?: Record<string, string> } | null;

export function AgreementSign({ name, rate }: { name: string; rate: number }) {
  const [state, action] = useActionState<State, FormData>(acceptAgreement, null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={action} className="space-y-4 print:hidden">
      <div>
        <label className="field-label" htmlFor="sig">Type your full name to sign</label>
        <input id="sig" name="signedName" className="field font-serif text-lg italic" placeholder={name} autoComplete="name" />
        {state?.errors?.signedName ? <p className="mt-1 text-xs text-rose-600">{state.errors.signedName}</p> : <p className="field-hint">Must match your account name: {name}</p>}
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="agree" className="mt-0.5 size-4 rounded accent-brand-600" />
        I have read and agree to this listing agreement, including Found&apos;s {rate}% commission on bookings.
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Signing…" className="btn-primary w-full py-3"><FileSignature className="size-4" /> Sign agreement</SubmitButton>
    </form>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline print:hidden">
      <Printer className="size-4" /> Print / save PDF
    </button>
  );
}
