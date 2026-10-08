"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  ShieldCheck,
  Check, ExternalLink, Eye, Inbox, Loader2, MoreHorizontal, Pencil, Star, Trash2, XCircle, CircleDollarSign, KeyRound, EyeOff, RotateCcw, Gem,
} from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { StatusBadge } from "./ui";
import { toast } from "@/components/ui/toaster";
import { approveListing, deleteListing, rejectListing, setListingStatus, toggleFeatured } from "@/app/actions/listings";
import { setPrestige } from "@/app/actions/prestige";
import { formatPrice, locationLine, primaryImage, timeAgo, typeLabel, txLabel } from "@/lib/format";
import type { PropertyDoc, PropertyStatus } from "@/lib/types";

type Row = PropertyDoc & { leads: number; unreadLeads: number };

export function ListingsTable({ items, isAdmin }: { items: Row[]; isAdmin: boolean }) {
  return (
    <>
      {/* Desktop table */}
      <div className="card hidden overflow-visible md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Property</th>
              <th className="px-3 py-3 font-semibold">Price</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 text-right font-semibold">Views</th>
              <th className="px-3 py-3 text-right font-semibold">Enquiries</th>
              <th className="px-3 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => (
              <tr key={p._id} className="group hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <SmartImage src={primaryImage(p)} alt="" fill sizes="64px" className="object-cover" />
                      {p.featured ? <Star className="absolute left-1 top-1 size-3.5 fill-amber-400 text-amber-400" /> : null}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/dashboard/listings/${p._id}/edit`} className="line-clamp-1 font-semibold text-ink hover:text-brand-600">{p.title}</Link>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        {typeLabel(p.propertyType)} · {txLabel(p.transactionType)} · {locationLine(p.location)}
                        {isAdmin && typeof p.owner === "object" ? <> · <Link href={`/dashboard/listings?owner=${p.owner._id}`} className="hover:underline">{p.owner.name}</Link></> : null}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{formatPrice(p.price)}</td>
                <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-600">{p.views.toLocaleString()}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {p.leads ? (
                    <Link href={`/dashboard/inquiries?property=${p._id}`} className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
                      {p.leads}
                      {p.unreadLeads ? <span className="rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">{p.unreadLeads} new</span> : null}
                    </Link>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{timeAgo(p.updatedAt)}</td>
                <td className="px-5 py-3 text-right">
                  <RowActions p={p} isAdmin={isAdmin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {items.map((p) => (
          <li key={p._id} className="card p-3">
            <div className="flex gap-3">
              <Link href={`/dashboard/listings/${p._id}/edit`} className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <SmartImage src={primaryImage(p)} alt="" fill sizes="96px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/dashboard/listings/${p._id}/edit`} className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{p.title}</Link>
                  <RowActions p={p} isAdmin={isAdmin} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-ink">{formatPrice(p.price)}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <StatusBadge status={p.status} />
                  <span className="flex items-center gap-0.5"><Eye className="size-3" /> {p.views}</span>
                  <Link href={`/dashboard/inquiries?property=${p._id}`} className="flex items-center gap-0.5">
                    <Inbox className="size-3" /> {p.leads}
                    {p.unreadLeads ? <span className="text-coral-600">({p.unreadLeads} new)</span> : null}
                  </Link>
                </div>
              </div>
            </div>
            {p.status === "rejected" && p.rejectionReason ? (
              <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">{p.rejectionReason}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

function RowActions({ p, isAdmin }: { p: Row; isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setOpen(false);
    start(async () => {
      const r = await fn();
      toast(r.message, r.ok ? "success" : "error");
      router.refresh();
    });
  };

  const status = (s: PropertyStatus) => run(() => setListingStatus(p._id, s));
  const reviewed = !["pending", "rejected"].includes(p.status);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink"
        aria-label="Listing actions"
        aria-expanded={open}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lift animate-fade-in">
          <MenuLink href={`/${p.propertyType === "shortlet" ? "apartments" : "properties"}/${p.slug}`} icon={ExternalLink} external>View listing</MenuLink>
          <MenuLink href={`/dashboard/listings/${p._id}/edit`} icon={Pencil}>Edit details & photos</MenuLink>
          <MenuLink href={`/dashboard/inquiries?property=${p._id}`} icon={Inbox}>Enquiries ({p.leads})</MenuLink>
          {p.propertyType !== "shortlet" ? <MenuLink href={`/dashboard/listings/${p._id}/verification`} icon={ShieldCheck}>Pre-verification checklist</MenuLink> : null}
          {isAdmin && p.status === "pending" ? (
            <>
              <Divider />
              <MenuButton icon={Check} onClick={() => run(() => approveListing(p._id))} className="text-emerald-700">Approve</MenuButton>
              <MenuButton
                icon={XCircle}
                onClick={() => {
                  const reason = window.prompt("Reason for rejection (shown to the realtor):", "Please add clearer photos and full address details.");
                  if (reason !== null) run(() => rejectListing(p._id, reason));
                }}
                className="text-rose-700"
              >
                Reject…
              </MenuButton>
            </>
          ) : null}
          {reviewed || isAdmin ? (
            <>
              <Divider />
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Set status</p>
              {p.status !== "available" ? <MenuButton icon={RotateCcw} onClick={() => status("available")}>Live</MenuButton> : null}
              {p.status !== "sold" && p.transactionType === "sale" ? <MenuButton icon={CircleDollarSign} onClick={() => status("sold")}>Sold</MenuButton> : null}
              {p.status !== "rented" && p.transactionType !== "sale" ? <MenuButton icon={KeyRound} onClick={() => status("rented")}>Rented / let</MenuButton> : null}
              {p.status !== "unavailable" ? <MenuButton icon={EyeOff} onClick={() => status("unavailable")}>Off market</MenuButton> : null}
            </>
          ) : null}
          {isAdmin ? (
            <MenuButton icon={Star} onClick={() => run(() => toggleFeatured(p._id))}>{p.featured ? "Unfeature" : "Feature"}</MenuButton>
          ) : null}
          {isAdmin && p.propertyType !== "shortlet" ? (
            <MenuButton icon={Gem} onClick={() => run(() => setPrestige(p._id, !p.prestige))}>{p.prestige ? "Remove from Prestige" : "Add to Prestige"}</MenuButton>
          ) : null}
          <Divider />
          <MenuButton
            icon={Trash2}
            className="text-rose-600"
            onClick={() => {
              if (window.confirm(`Delete “${p.title}”? This also removes its photos and can't be undone.`)) run(() => deleteListing(p._id));
            }}
          >
            Delete
          </MenuButton>
        </div>
      ) : null}
    </div>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-slate-100" />;
}

function MenuLink({ href, icon: Icon, children, external }: { href: string; icon: typeof Eye; children: React.ReactNode; external?: boolean }) {
  return (
    <Link href={href} target={external ? "_blank" : undefined} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
      <Icon className="size-4 text-slate-400" /> {children}
    </Link>
  );
}

function MenuButton({ icon: Icon, children, onClick, className }: { icon: typeof Eye; children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={clsx("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50", className ?? "text-slate-700")}>
      <Icon className="size-4 opacity-70" /> {children}
    </button>
  );
}
