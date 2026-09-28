"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { sendContactMessage } from "@/app/actions/public";

const SUBJECTS = ["General Inquiry", "Technical Support", "Partnership Opportunities", "Agent Registration", "Realtor Registration", "Complaint"];

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, null);
  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
        <p className="mt-2 font-semibold text-emerald-900">{state.message}</p>
      </div>
    );
  }
  const err = (k: string) => state?.errors?.[k];
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div>
        <label className="field-label" htmlFor="c-name">Name</label>
        <input id="c-name" name="name" className="field" autoComplete="name" />
        {err("name") ? <p className="mt-1 text-xs text-rose-600">{err("name")}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor="c-email">Email</label>
        <input id="c-email" name="email" type="email" className="field" autoComplete="email" />
        {err("email") ? <p className="mt-1 text-xs text-rose-600">{err("email")}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor="c-phone">Phone (optional)</label>
        <input id="c-phone" name="phone" type="tel" className="field" autoComplete="tel" />
      </div>
      <div>
        <label className="field-label" htmlFor="c-subject">Subject</label>
        <select id="c-subject" name="subject" className="field">
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" rows={5} className="field" />
        {err("message") ? <p className="mt-1 text-xs text-rose-600">{err("message")}</p> : null}
      </div>
      {state && !state.ok ? <p className="text-sm text-rose-600 sm:col-span-2">{state.message}</p> : null}
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send message
        </button>
      </div>
    </form>
  );
}
