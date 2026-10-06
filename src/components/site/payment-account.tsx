import { Landmark } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { PAYMENT_ACCOUNT } from "@/lib/verification";

/** Bank details for verification payments, with copy buttons. */
export function PaymentAccount({ compact = false }: { compact?: boolean }) {
  const rows = [
    { label: "Account name", value: PAYMENT_ACCOUNT.accountName },
    { label: "Account number", value: PAYMENT_ACCOUNT.accountNumber, mono: true },
    { label: "Bank", value: PAYMENT_ACCOUNT.bank },
  ];
  return (
    <div className={compact ? "rounded-2xl border border-brand-100 bg-brand-50/60 p-4" : "card p-6 sm:p-7"}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
          <Landmark className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-ink">Pay by bank transfer</p>
          <p className="text-xs text-slate-500">Use your name or company name as the narration.</p>
        </div>
      </div>
      <dl className="mt-4 divide-y divide-slate-200/80">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">{r.label}</dt>
              <dd className={r.mono ? "font-mono text-lg font-bold tracking-wider text-ink" : "font-semibold text-ink"}>{r.value}</dd>
            </div>
            <CopyButton value={r.value} />
          </div>
        ))}
      </dl>
    </div>
  );
}
