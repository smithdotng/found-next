"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { FormState } from "@/app/actions/public";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

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
  const formRef = useRef<HTMLFormElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const passThroughRef = useRef(false);

  // Load the reCAPTCHA v3 script once, and only when a site key is configured.
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || document.getElementById("recaptcha-v3")) return;
    const sc = document.createElement("script");
    sc.id = "recaptcha-v3";
    sc.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    sc.async = true;
    document.head.appendChild(sc);
  }, []);

  // On submit, fetch a fresh token, drop it into the hidden field, then let the
  // server action run. No-op when reCAPTCHA isn't configured.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!RECAPTCHA_SITE_KEY) return;
    if (passThroughRef.current) {
      passThroughRef.current = false;
      return;
    }
    e.preventDefault();
    const g = window.grecaptcha;
    if (g) {
      try {
        await new Promise<void>((resolve) => g.ready(() => resolve()));
        const token = await g.execute(RECAPTCHA_SITE_KEY, { action: "inquiry" });
        if (tokenRef.current) tokenRef.current.value = token;
      } catch {
        /* if token generation fails, submit anyway — the server decides */
      }
    }
    passThroughRef.current = true;
    formRef.current?.requestSubmit();
  }

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
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-3" noValidate>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input ref={tokenRef} type="hidden" name="recaptchaToken" />
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
      {RECAPTCHA_SITE_KEY ? (
        <p className="text-center text-[10px] leading-4 text-slate-400">
          Protected by reCAPTCHA — Google&apos;s{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a> and{" "}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</a> apply.
        </p>
      ) : null}
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
