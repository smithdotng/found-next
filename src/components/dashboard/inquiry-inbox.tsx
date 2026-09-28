"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { ArrowLeft, CheckCheck, ExternalLink, Loader2, Mail, MailOpen, MessageCircle, Phone, Send, Trash2, UserCheck } from "lucide-react";
import { deleteInquiry, markInquiry, replyInquiry } from "@/app/actions/listings";
import { toast } from "@/components/ui/toaster";
import { formatDate, timeAgo } from "@/lib/format";
import type { InquiryDoc } from "@/lib/types";

function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("234")) return d;
  if (d.startsWith("0")) return "234" + d.slice(1);
  return d;
}

export function InquiryInbox({ items, canDelete, initialOpen }: { items: InquiryDoc[]; canDelete: boolean; initialOpen?: string }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(initialOpen ?? null);
  const [localRead, setLocalRead] = useState<Record<string, boolean>>({});
  const [pending, start] = useTransition();
  const active = items.find((i) => i._id === activeId) ?? null;

  const isRead = (q: InquiryDoc) => localRead[q._id] ?? q.read;

  const openItem = (q: InquiryDoc) => {
    setActiveId(q._id);
    if (!isRead(q)) {
      setLocalRead((m) => ({ ...m, [q._id]: true }));
      markInquiry(q._id, true).then(() => router.refresh());
    }
  };

  // Deep link (?open=<id>) from the overview: mark it read once on arrival.
  useEffect(() => {
    const q = items.find((i) => i._id === initialOpen);
    if (q && !q.read) markInquiry(q._id, true).then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpen]);

  const act = (fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      toast(r.message, r.ok ? "success" : "error");
      after?.();
      router.refresh();
    });

  return (
    <div className="card grid min-h-[520px] overflow-hidden lg:grid-cols-[380px_1fr]">
      <ul className={clsx("divide-y divide-slate-100 overflow-y-auto border-slate-100 lg:max-h-[72vh] lg:border-r", active && "hidden lg:block")}>
        {items.map((q) => {
          const prop = typeof q.property === "object" ? q.property : null;
          return (
            <li key={q._id}>
              <button
                onClick={() => openItem(q)}
                className={clsx("flex w-full gap-3 px-4 py-3.5 text-left transition", activeId === q._id ? "bg-brand-50/70" : "hover:bg-slate-50")}
              >
                <span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", isRead(q) ? "bg-transparent" : "bg-coral-500")} aria-label={isRead(q) ? undefined : "Unread"} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline justify-between gap-2">
                    <span className={clsx("truncate text-sm", isRead(q) ? "font-medium text-slate-700" : "font-bold text-ink")}>{q.name}</span>
                    <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(q.createdAt)}</span>
                  </p>
                  <p className="truncate text-xs font-medium text-brand-700">{prop?.title ?? q.propertyTitle}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{q.message}</p>
                  <div className="mt-1 flex gap-2">
                    {q.replied ? <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600"><CheckCheck className="size-3" /> Replied</span> : null}
                    {q.agent?.name ? <span className="flex items-center gap-1 text-[11px] text-slate-500"><UserCheck className="size-3" /> via {q.agent.name}</span> : null}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={clsx("min-w-0", !active && "hidden lg:grid lg:place-items-center")}>
        {active ? (
          <Detail
            key={active._id}
            q={active}
            read={isRead(active)}
            pending={pending}
            canDelete={canDelete}
            onBack={() => setActiveId(null)}
            onToggleRead={() => {
              const next = !isRead(active);
              setLocalRead((m) => ({ ...m, [active._id]: next }));
              act(() => markInquiry(active._id, next));
            }}
            onReply={(msg, done) => act(() => replyInquiry(active._id, msg), done)}
            onDelete={() => {
              if (window.confirm("Delete this enquiry permanently?")) act(() => deleteInquiry(active._id), () => setActiveId(null));
            }}
          />
        ) : (
          <div className="p-10 text-center text-sm text-slate-400">
            <MailOpen className="mx-auto mb-3 size-8" />
            Select an enquiry to read and reply
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  q, read, pending, canDelete, onBack, onToggleRead, onReply, onDelete,
}: {
  q: InquiryDoc;
  read: boolean;
  pending: boolean;
  canDelete: boolean;
  onBack: () => void;
  onToggleRead: () => void;
  onReply: (msg: string, done: () => void) => void;
  onDelete: () => void;
}) {
  const prop = typeof q.property === "object" ? q.property : null;
  const first = q.name.split(" ")[0];
  const [reply, setReply] = useState(
    q.replyMessage ? "" : `Hi ${first},\n\nThanks for your interest in "${prop?.title ?? q.propertyTitle}". It's still available. When would you like to come for an inspection?\n\n`,
  );
  const wa = `https://wa.me/${waNumber(q.phone)}?text=${encodeURIComponent(`Hi ${first}, this is regarding your enquiry on Found about "${prop?.title ?? q.propertyTitle}".`)}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <button onClick={onBack} className="btn-ghost btn-sm lg:hidden"><ArrowLeft className="size-4" /> Back</button>
        <p className="hidden text-xs text-slate-500 lg:block">Received {formatDate(q.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
        <div className="flex gap-1">
          <button onClick={onToggleRead} className="btn-ghost btn-sm" disabled={pending}>
            {read ? <Mail className="size-4" /> : <MailOpen className="size-4" />} {read ? "Mark unread" : "Mark read"}
          </button>
          {canDelete ? (
            <button onClick={onDelete} className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50" disabled={pending} aria-label="Delete enquiry">
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <h2 className="text-xl font-bold text-ink">{q.name}</h2>
          {prop ? (
            <Link href={`/properties/${prop.slug}`} target="_blank" className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
              {prop.title} <ExternalLink className="size-3.5" />
            </Link>
          ) : (
            <p className="text-sm text-slate-500">{q.propertyTitle}</p>
          )}
          {q.agent?.name ? <p className="mt-1 text-xs text-slate-500">Referred by agent {q.agent.name}</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {q.phone ? (
            <a href={`tel:${q.phone}`} className="btn-outline"><Phone className="size-4" /> Call</a>
          ) : null}
          {q.phone ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn border border-[#25D366]/40 bg-[#25D366]/10 text-[#128C4B] hover:bg-[#25D366]/20">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          ) : null}
          <a href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${prop?.title ?? q.propertyTitle}`)}`} className="btn-outline"><Mail className="size-4" /> Email</a>
        </div>
        <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-slate-500">Email</dt><dd className="break-all font-medium text-ink">{q.email}</dd></div>
          <div><dt className="text-xs text-slate-500">Phone</dt><dd className="font-medium text-ink">{q.phone || "—"}</dd></div>
        </dl>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</p>
          <p className="mt-2 whitespace-pre-line rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-sm leading-6 text-slate-800">{q.message}</p>
        </div>

        {q.replyMessage ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your reply · {timeAgo(q.repliedAt)}</p>
            <p className="ml-auto mt-2 max-w-[90%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-brand-600 p-4 text-sm leading-6 text-white">{q.replyMessage}</p>
          </div>
        ) : null}
      </div>

      <form
        className="border-t border-slate-100 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onReply(reply, () => setReply(""));
        }}
      >
        <label htmlFor="reply" className="sr-only">Reply by email</label>
        <textarea id="reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} className="field resize-none" placeholder={`Reply to ${first} by email…`} />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500">Sent from Found to {q.email}</p>
          <button className="btn-primary btn-sm" disabled={pending || reply.trim().length < 2}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Send reply
          </button>
        </div>
      </form>
    </div>
  );
}
