"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";

/** Small button that runs a server action, shows a toast and refreshes the page. */
export function ActionButton({
  action,
  confirm,
  className = "btn-ghost btn-sm",
  children,
  label,
}: {
  action: () => Promise<{ ok: boolean; message: string }>;
  confirm?: string;
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const r = await action();
          toast(r.message, r.ok ? "success" : "error");
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}
