"use client";

import { useActionState } from "react";
import { requestWithdrawal, saveBankDetails } from "@/app/actions/agent";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form-bits";
import { formatPrice } from "@/lib/format";

const BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank", "FCMB", "Globus Bank", "GTBank", "Heritage Bank", "Jaiz Bank", "Keystone Bank",
  "Kuda", "Moniepoint", "OPay", "PalmPay", "Polaris Bank", "Providus Bank", "Stanbic IBTC", "Standard Chartered", "Sterling Bank", "SunTrust Bank",
  "Titan Trust Bank", "Union Bank", "UBA", "Unity Bank", "Wema Bank", "Zenith Bank",
];

export function EarningsForms({ balance, bank }: { balance: number; bank?: { bankName?: string; accountNumber?: string; accountName?: string } }) {
  const [wState, wAction] = useActionState(requestWithdrawal, null);
  const [bState, bAction] = useActionState(saveBankDetails, null);
  return (
    <>
      <form action={wAction} className="card space-y-4 p-5">
        <h2 className="font-semibold text-ink">Request a withdrawal</h2>
        <p className="text-sm text-slate-500">Available: <strong className="text-ink">{formatPrice(balance)}</strong> · minimum ₦1,000</p>
        <FormMessage state={wState} />
        <TextField label="Amount (₦)" name="amount" inputMode="numeric" placeholder="e.g. 50000" disabled={!bank?.accountNumber || balance < 1000} />
        {!bank?.accountNumber ? <p className="text-xs text-amber-700">Add your bank details first.</p> : null}
        <SubmitButton className="btn-primary" pendingText="Requesting…">Withdraw to {bank?.bankName ?? "bank"}</SubmitButton>
      </form>
      <form action={bAction} className="card space-y-4 p-5">
        <h2 className="font-semibold text-ink">Payout bank account</h2>
        <FormMessage state={bState} />
        <div>
          <label className="field-label" htmlFor="bankName">Bank</label>
          <select id="bankName" name="bankName" className="field" defaultValue={bank?.bankName ?? ""}>
            <option value="">Select bank…</option>
            {BANKS.map((b) => <option key={b}>{b}</option>)}
            {bank?.bankName && !BANKS.includes(bank.bankName) ? <option>{bank.bankName}</option> : null}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Account number" name="accountNumber" inputMode="numeric" maxLength={10} defaultValue={bank?.accountNumber} />
          <TextField label="Account name" name="accountName" defaultValue={bank?.accountName} />
        </div>
        <SubmitButton className="btn-outline" pendingText="Saving…">Save bank details</SubmitButton>
      </form>
    </>
  );
}
