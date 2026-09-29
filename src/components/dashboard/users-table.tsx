"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { Ban, BadgeCheck, Building2, Loader2, Mail, Phone, Send, Trash2, UserCheck, X } from "lucide-react";
import { deleteUser, messageUser, setAgentApproved, setUserSuspended, setUserVerified } from "@/app/actions/admin";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/format";

export type UserRow = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: "realtor" | "agent" | "admin" | "host";
  isSuspended?: boolean;
  createdAt: string;
  listings: number;
  realtorProfile?: { company?: string; verified?: boolean; rcNumber?: string };
  agentProfile?: { isApproved?: boolean; socialHandle?: string; totalEarnings?: number };
  referralStats?: { totalClicks?: number };
};

const ROLE = {
  realtor: "bg-brand-50 text-brand-700 ring-brand-600/20",
  agent: "bg-coral-50 text-coral-700 ring-coral-600/20",
  admin: "bg-slate-100 text-slate-700 ring-slate-500/20",
  host: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function UsersTable({ rows, superAdmin, selfId }: { rows: UserRow[]; superAdmin: boolean; selfId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [msgFor, setMsgFor] = useState<UserRow | null>(null);

  const run = (id: string, fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(id);
    start(async () => {
      const r = await fn();
      toast(r.message, r.ok ? "success" : "error");
      setBusy(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="card divide-y divide-slate-100">
        {rows.map((u) => (
          <div key={u._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">{u.name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-ink">{u.name}</span>
                  <span className={clsx("chip capitalize", ROLE[u.userType])}>{u.userType}</span>
                  {u.userType === "realtor" && u.realtorProfile?.verified ? <BadgeCheck className="size-4 text-emerald-600" aria-label="Verified" /> : null}
                  {u.userType === "agent" && !u.agentProfile?.isApproved ? <span className="chip bg-amber-50 text-amber-800 ring-amber-600/20">Not approved</span> : null}
                  {u.isSuspended ? <span className="chip bg-rose-50 text-rose-700 ring-rose-600/20">Suspended</span> : null}
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
                  <a href={`mailto:${u.email}`} className="flex items-center gap-1 hover:text-brand-600"><Mail className="size-3" /> {u.email}</a>
                  <a href={`tel:${u.phone}`} className="flex items-center gap-1 hover:text-brand-600"><Phone className="size-3" /> {u.phone}</a>
                  {u.realtorProfile?.company ? <span className="flex items-center gap-1"><Building2 className="size-3" /> {u.realtorProfile.company}{u.realtorProfile.rcNumber ? ` (RC ${u.realtorProfile.rcNumber})` : ""}</span> : null}
                  <span>Joined {formatDate(u.createdAt)}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {u.userType === "realtor" ? (
                <Link href={`/dashboard/listings?owner=${u._id}`} className="btn-ghost btn-sm">{u.listings} listing{u.listings === 1 ? "" : "s"}</Link>
              ) : null}
              {u.userType === "agent" ? <span className="px-2 text-xs text-slate-500">{u.referralStats?.totalClicks ?? 0} clicks</span> : null}
              {busy === u._id && pending ? <Loader2 className="size-4 animate-spin text-brand-600" /> : null}
              {u.userType === "realtor" ? (
                <button onClick={() => run(u._id, () => setUserVerified(u._id, !u.realtorProfile?.verified))} className="btn-outline btn-sm">
                  <BadgeCheck className="size-3.5" /> {u.realtorProfile?.verified ? "Unverify" : "Verify"}
                </button>
              ) : null}
              {u.userType === "agent" ? (
                <button onClick={() => run(u._id, () => setAgentApproved(u._id, !u.agentProfile?.isApproved))} className="btn-outline btn-sm">
                  <UserCheck className="size-3.5" /> {u.agentProfile?.isApproved ? "Revoke" : "Approve"}
                </button>
              ) : null}
              {u.userType !== "admin" && u._id !== selfId ? (
                <button
                  onClick={() => {
                    if (u.isSuspended || window.confirm(`Suspend ${u.name}? Their live listings will be hidden.`)) run(u._id, () => setUserSuspended(u._id, !u.isSuspended));
                  }}
                  className={clsx("btn-outline btn-sm", !u.isSuspended && "text-rose-700")}
                >
                  <Ban className="size-3.5" /> {u.isSuspended ? "Reinstate" : "Suspend"}
                </button>
              ) : null}
              {superAdmin && u.userType !== "admin" ? (
                <>
                  <button onClick={() => setMsgFor(u)} className="btn-ghost btn-sm" aria-label={`Email ${u.name}`}><Send className="size-3.5" /></button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Permanently delete ${u.name}'s account?`)) run(u._id, () => deleteUser(u._id));
                    }}
                    className="btn-ghost btn-sm text-rose-600"
                    aria-label={`Delete ${u.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {msgFor ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 animate-fade-in" role="dialog" aria-modal="true">
          <form
            className="card w-full max-w-lg p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const target = msgFor;
              run(target._id, async () => {
                const r = await messageUser(target._id, String(fd.get("subject")), String(fd.get("message")));
                if (r.ok) setMsgFor(null);
                return r;
              });
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Email {msgFor.name}</h2>
              <button type="button" onClick={() => setMsgFor(null)} className="btn-ghost !px-2" aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <input name="subject" className="field" placeholder="Subject" required />
              <textarea name="message" rows={6} className="field" placeholder="Message" required />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setMsgFor(null)} className="btn-ghost">Cancel</button>
              <button className="btn-primary" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
