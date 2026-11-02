"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { acceptAgentAgreement } from "@/app/actions/agent";
import { FormMessage, SubmitButton } from "@/components/ui/form-bits";

type State = { ok: boolean; message: string; errors?: Record<string, string> } | null;

export function AgentAgreementSign({ name }: { name: string }) {
  const [state, action] = useActionState<State, FormData>(acceptAgentAgreement, null);
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
        I have read and agree to this Agent Referral Agreement, including the commission split, the 10% administrative fee and withholding tax deducted from my payouts, and that I will not collect any deposit or property funds from buyers or tenants.
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Signing…" className="btn-primary w-full py-3"><FileSignature className="size-4" /> Sign agreement</SubmitButton>
    </form>
  );
}
