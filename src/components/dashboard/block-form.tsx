"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addBlock } from "@/app/actions/bookings";
import { FormMessage, SubmitButton } from "@/components/ui/form-bits";

type State = { ok: boolean; message: string } | null;

export function BlockForm({ propertyId, today }: { propertyId: string; today: string }) {
  const [state, action] = useActionState<State, FormData>(addBlock, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state, router]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="propertyId" value={propertyId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="blk-start">First night</label>
          <input id="blk-start" name="start" type="date" min={today} required className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="blk-end">Last night</label>
          <input id="blk-end" name="end" type="date" min={today} required className="field" />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="blk-reason">Reason</label>
        <select id="blk-reason" name="reason" className="field" defaultValue="owner_use">
          <option value="owner_use">Personal use</option>
          <option value="external_booking">Booked elsewhere</option>
          <option value="maintenance">Maintenance</option>
          <option value="holiday">Holiday</option>
          <option value="other">Other</option>
        </select>
      </div>
      <input name="notes" className="field" placeholder="Note (only you see this)" />
      <FormMessage state={state} />
      <SubmitButton pendingText="Blocking…" className="btn-primary w-full">Block these dates</SubmitButton>
    </form>
  );
}
