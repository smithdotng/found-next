"use client";

import { Check, X, Banknote } from "lucide-react";
import { ActionButton } from "./action-button";
import { updateWithdrawal } from "@/app/actions/admin";

export function WithdrawalActions({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex gap-1">
      {status === "pending" ? (
        <ActionButton action={() => updateWithdrawal(id, "approved")} className="btn-outline btn-sm">
          <Check className="size-3.5" /> Approve
        </ActionButton>
      ) : null}
      <ActionButton
        action={() => {
          const ref = window.prompt("Bank transfer reference (optional):") ?? undefined;
          return updateWithdrawal(id, "processed", ref);
        }}
        className="btn-outline btn-sm"
      >
        <Banknote className="size-3.5" /> Mark paid
      </ActionButton>
      <ActionButton action={() => updateWithdrawal(id, "rejected")} confirm="Reject and return the funds to the agent's balance?" className="btn-ghost btn-sm text-rose-600">
        <X className="size-3.5" />
      </ActionButton>
    </div>
  );
}
