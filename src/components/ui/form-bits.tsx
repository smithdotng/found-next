"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import clsx from "clsx";

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  ...rest
}: { label: string; name: string; error?: string; hint?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = rest.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}
        {rest.required ? <span className="text-coral-500"> *</span> : null}
      </label>
      <input id={id} name={name} className={clsx("field", error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10")} aria-invalid={!!error} {...rest} />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function PasswordField({ label = "Password", name = "password", error, hint, ...rest }: { label?: string; name?: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const id = `f-${name}`;
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input id={id} name={name} type={show ? "text" : "password"} className={clsx("field pr-11", error && "border-rose-400")} aria-invalid={!!error} {...rest} />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-600" aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function SubmitButton({ children, className = "btn-primary w-full py-3", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <p className={clsx("rounded-xl px-3.5 py-2.5 text-sm", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700")} role="alert">
      {state.message}
    </p>
  );
}
