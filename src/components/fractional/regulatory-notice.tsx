import { Info } from "lucide-react";
import { FRACTIONAL_OPEN, PRELAUNCH_NOTICE, RISK_STATEMENT } from "@/lib/fractional";

/** Pre-launch banner (until SEC registration) and the standard risk statement. */
export function PrelaunchBanner() {
  if (FRACTIONAL_OPEN) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <p className="container-page flex items-start gap-2 py-2.5 text-sm text-amber-900">
        <Info className="mt-0.5 size-4 shrink-0" /> {PRELAUNCH_NOTICE}
      </p>
    </div>
  );
}

export function RiskStatement({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-5 text-slate-500 ${className}`}>
      <strong className="text-slate-600">Risk warning:</strong> {RISK_STATEMENT}
      {FRACTIONAL_OPEN ? null : <> {PRELAUNCH_NOTICE}</>}
    </p>
  );
}
