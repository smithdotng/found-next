"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { FormState } from "@/app/actions/public";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function InquiryForm({
  action,
  hidden,
  defaultMessage,
  submitLabel = "Send enquiry",
  showPhone = true,
}: {
  action: Action;
  hidden: Record<string, string>;
  defaultMessage: string;
  submitLabel?: string;
  showPhone?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 text-center">
        <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
        <p className="mt-2 font-semibold text-emerald-900">Enquiry sent</p>
        <p className="mt-1 text-sm text-emerald-800">{state.message}</p>
      </div>
    );
  }

  const err = (k: string) => state?.errors?.[k];

  return (
    <form action={formAction} className="space-y-3" noValidate>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Field label="Full name" name="name" error={err("name")} autoComplete="name" required />
      <Field label="Email" name="email" type="email" error={err("email")} autoComplete="email" required />
      {showPhone ? <Field label="Phone" name="phone" type="tel" error={err("phone")} autoComplete="tel" placeholder="0803 123 4567" /> : null}
      <div>
        <label className="field-label" htmlFor="inq-message">
          Message
        </label>
        <textarea id="inq-message" name="message" rows={4} className="field" defaultValue={defaultMessage} aria-invalid={!!err("message")} />
        {err("message") ? <p className="mt-1 text-xs text-rose-600">{err("message")}</p> : null}
      </div>
      {state && !state.ok ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.message}</p> : null}
      <button type="submit" className="btn-primary w-full py-3" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {pending ? "Sending…" : submitLabel}
      </button>
      <p className="text-center text-[11px] leading-4 text-slate-500">
        Your details go to the listing team and Found. We never share them with third parties.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  type = "text",
  ...rest
}: { label: string; name: string; error?: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `inq-${name}`;
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} name={name} type={type} className="field" aria-invalid={!!error} {...rest} />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
