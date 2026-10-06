"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { resumeNewsletter } from "@/app/actions/newsletter";
import { toast } from "@/components/ui/toaster";

const STALL_MS = 60_000;

/**
 * Shown on a campaign that's still sending. While the page is open it refreshes the counts and,
 * if no email has gone out for a minute, nudges the server to carry on where it stopped.
 */
export function CampaignWatcher({ id, lastProgressAt }: { id: string; lastProgressAt?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const nudged = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const last = lastProgressAt ? new Date(lastProgressAt).getTime() : 0;
      if (Date.now() - last > STALL_MS && Date.now() - nudged.current > STALL_MS) {
        nudged.current = Date.now();
        void resumeNewsletter(id);
      }
      router.refresh();
    }, 10_000);
    return () => clearInterval(t);
  }, [id, lastProgressAt, router]);

  return (
    <button
      type="button"
      className="btn-ghost btn-sm ml-2"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await resumeNewsletter(id);
          toast(r?.message ?? "", r?.ok ? "success" : "error");
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Resume
    </button>
  );
}
