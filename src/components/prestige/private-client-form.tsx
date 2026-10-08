"use client";

import { useActionState, useRef, useTransition } from "react";
import clsx from "clsx";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { requestPrivateClient } from "@/app/actions/prestige";
import { BUDGET_BANDS, CLIENT_INTERESTS, PAYMENT_ROUTES, PRESTIGE_LOCATIONS, TIMELINES } from "@/lib/prestige";

type State = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const input =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-[#c8a96a] focus:bg-white/[0.09]";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/55";

export function PrivateClientForm({ partner, propertyId, propertyTitle }: { partner?: string; propertyId?: string; propertyTitle?: string }) {
  const [state, dispatch] = useActionState<State, FormData>(requestPrivateClient, null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const err = (k: string) => state?.errors?.[k];

  if (state?.ok)
    return (
      <div className="rounded-3xl border border-[#c8a96a]/40 bg-white/[0.04] p-8 text-center sm:p-12">
        <CheckCircle2 className="mx-auto size-10 text-[#c8a96a]" />
        <p className="prestige-display mt-4 text-3xl text-white">Thank you.</p>
        <p className="mx-auto mt-3 max-w-md text-white/70">{state.message} We&apos;ve also sent a confirmation to your email.</p>
      </div>
    );

  return (
    <form
      ref={ref}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(() => dispatch(fd));
      }}
      className="space-y-5"
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {partner ? <input type="hidden" name="partner" value={partner} /> : null}
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      {propertyTitle ? (
        <p className="rounded-xl border border-[#c8a96a]/30 bg-[#c8a96a]/10 px-4 py-3 text-sm text-[#e9d9b6]">Enquiring about <strong>{propertyTitle}</strong></p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Full name" error={err("name")} autoComplete="name" />
        <Field name="email" label="Email" type="email" error={err("email")} autoComplete="email" />
        <Field name="phone" label="Phone / WhatsApp" type="tel" error={err("phone")} autoComplete="tel" placeholder="+234 or your country code" />
        <Field name="country" label="Where are you based?" autoComplete="country-name" placeholder="e.g. Abuja, London, Houston" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Select name="interest" label="I'm looking to" options={CLIENT_INTERESTS} error={err("interest")} />
        <Select name="budget" label="Budget" options={BUDGET_BANDS} />
        <Select name="timeline" label="Timeline" options={TIMELINES} />
        <Select name="payment" label="How you'd pay" options={PAYMENT_ROUTES} />
      </div>

      <fieldset>
        <legend className={label}>Areas of interest</legend>
        <div className="flex flex-wrap gap-2">
          {PRESTIGE_LOCATIONS.map((l) => (
            <label key={l} className="cursor-pointer">
              <input type="checkbox" name="locations" value={l} className="peer sr-only" />
              <span className="inline-block rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-white/70 transition peer-checked:border-[#c8a96a] peer-checked:bg-[#c8a96a]/15 peer-checked:text-[#f1e4c4] peer-focus-visible:ring-2 peer-focus-visible:ring-[#c8a96a]">
                {l}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={label} htmlFor="pc-message">Anything we should know? (optional)</label>
        <textarea id="pc-message" name="message" rows={3} className={input} placeholder="The kind of home or investment you have in mind, must-haves, anything you'd rather we kept private…" />
      </div>
      {!partner ? <Field name="referredBy" label="Who referred you? (optional)" placeholder="Your bank, lawyer or a friend" /> : null}

      <label className="flex items-start gap-3 text-sm text-white/70">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 rounded accent-[#c8a96a]" />
        <span>Found may contact me about this request. My details stay confidential and are never shared with a seller or realtor without my permission.</span>
      </label>
      {err("consent") ? <p className="-mt-3 text-xs text-rose-300">{err("consent")}</p> : null}
      {state && !state.ok ? <p className="rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">{state.message}</p> : null}

      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8a96a] px-6 py-4 text-[15px] font-semibold text-[#0b1622] transition hover:bg-[#d6b97d] disabled:opacity-70">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Request a private consultation
      </button>
    </form>
  );

}

function Field({ name, label: l, error, ...rest }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className={label} htmlFor={`pc-${name}`}>{l}</label>
      <input id={`pc-${name}`} name={name} className={clsx(input, error && "border-rose-400/70")} aria-invalid={!!error} {...rest} />
      {error ? <p className="mt-1 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

function Select({ name, label: l, options, error }: { name: string; label: string; options: readonly { value: string; label: string }[]; error?: string }) {
  return (
    <div>
      <label className={label} htmlFor={`pc-${name}`}>{l}</label>
      <select id={`pc-${name}`} name={name} defaultValue="" className={clsx(input, "appearance-none [&>option]:bg-[#0b1622]", error && "border-rose-400/70")}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
