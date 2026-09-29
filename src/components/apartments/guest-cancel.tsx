"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guestCancelBooking } from "@/app/actions/bookings";
import { toast } from "@/components/ui/toaster";

export function GuestCancel({ reference, token, confirmed }: { reference: string; token: string; confirmed: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost text-rose-600">
        {confirmed ? "Cancel booking" : "Withdraw request"}
      </button>
    );
  return (
    <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
      <p className="text-sm font-medium text-ink">{confirmed ? "Cancel this confirmed stay? The host's cancellation policy applies to any payment you've made." : "Withdraw your booking request?"}</p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="field mt-3" placeholder="Reason (optional)" />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={pending}
          className="btn-danger"
          onClick={() =>
            start(async () => {
              const r = await guestCancelBooking(reference, token, reason);
              toast(r.message, r.ok ? "success" : "error");
              if (r.ok) {
                setOpen(false);
                router.refresh();
              }
            })
          }
        >
          {pending ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Keep it</button>
      </div>
    </div>
  );
}
