"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronDown, ChevronRight, Heart, KeyRound, LayoutDashboard, Menu, Plus, X, LogOut, Download } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/format";
import { useSaved } from "@/components/property/saved-store";
import { usePwa } from "@/components/pwa/pwa-provider";

type User = { name: string; type: string } | null;

const links = [
  { href: "/apartments", label: "Apartments" },
  { href: "/projects", label: "Projects" },
  { href: "/prestige", label: "Prestige" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-realtors", label: "For realtors" },
  { href: "/blog", label: "Blog" },
];

export function HeaderNav({ user }: { user: User }) {
  const pathname = usePathname();
  // Menu remembers the path it was opened on, so navigating closes it automatically.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);
  const saved = useSaved();
  const { canInstall, install } = usePwa();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Main">
        <div className="group relative">
          <Link
            href="/properties"
            className={clsx(
              "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition hover:text-brand-600",
              active("/properties") ? "text-brand-600" : "text-slate-600",
            )}
          >
            Properties <ChevronDown className="size-3.5 transition group-hover:rotate-180" />
          </Link>
          <div className="invisible absolute left-0 top-full w-56 translate-y-1 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
            <div className="card p-1.5">
              <Link href="/properties" className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50">
                All properties
              </Link>
              {PROPERTY_TYPES.map((t) => (
                <Link
                  key={t.value}
                  href={`/properties?type=${t.value}`}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-ink"
                >
                  {t.plural}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium transition hover:text-brand-600",
              active(l.href) ? "text-brand-600" : "text-slate-600",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/saved" className="btn-ghost relative !px-2.5" aria-label={`Saved properties (${saved.ids.length})`}>
          <Heart className="size-5" />
          {saved.ids.length > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid size-4.5 place-items-center rounded-full bg-coral-500 text-[10px] font-bold text-white">
              {saved.ids.length}
            </span>
          ) : null}
        </Link>
        {user ? (
          <Link href="/dashboard" className="btn-outline hidden sm:inline-flex">
            <LayoutDashboard className="size-4" /> Dashboard
          </Link>
        ) : (
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
        )}
        <Link href={user ? "/dashboard/listings/new" : "/register"} className="btn-primary hidden md:inline-flex">
          <Plus className="size-4" /> List a property
        </Link>
        <button className="btn-ghost !px-2.5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Menu className="size-5" />
        </button>
      </div>

      {open ? createPortal(<MobileMenu user={user} active={active} canInstall={canInstall} install={install} onClose={() => setOpen(false)} />, document.body) : null}
    </>
  );
}

// Rendered in a portal on <body>: the sticky header uses backdrop-blur, which makes it the
// containing block for position:fixed children and would squash the drawer into the header.
function MobileMenu({
  user,
  active,
  canInstall,
  install,
  onClose,
}: {
  user: User;
  active: (href: string) => boolean;
  canInstall: boolean;
  install: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white shadow-lift animate-slide-in-right">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/" onClick={onClose} aria-label="Found home">
            <Image src="/assets/images/logo2.png" alt="Found" width={1000} height={355} className="h-8 w-auto" />
          </Link>
          <button className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200" onClick={onClose} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <Link
            href="/apartments"
            onClick={onClose}
            className="mb-5 flex items-center gap-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 transition hover:bg-brand-100/70"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
              <KeyRound className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                Found Apartments <span className="rounded-full bg-coral-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">New</span>
              </span>
              <span className="block text-xs text-slate-500">Book or list verified shortlets</span>
            </span>
            <ChevronRight className="size-4 text-slate-400" />
          </Link>

          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Browse properties</p>
          <div className="grid grid-cols-2 gap-2">
            <MenuChip href="/properties" onClose={onClose} strong>
              All properties
            </MenuChip>
            {PROPERTY_TYPES.map((t) => (
              <MenuChip key={t.value} href={`/properties?type=${t.value}`} onClose={onClose}>
                {t.plural}
              </MenuChip>
            ))}
          </div>

          <p className="px-1 pb-1 pt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Found</p>
          <nav className="divide-y divide-slate-100" aria-label="Mobile">
            {[...links.filter((l) => l.href !== "/apartments"), { href: "/host", label: "Become a host" }, { href: "/agent/register", label: "Become an agent" }, { href: "/about", label: "About us" }, { href: "/contact", label: "Contact" }].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center justify-between px-1 py-3 text-[15px] font-medium transition",
                  active(l.href) ? "text-brand-600" : "text-ink hover:text-brand-600",
                )}
              >
                {l.label}
                <ChevronRight className="size-4 text-slate-300" />
              </Link>
            ))}
          </nav>
        </div>

        <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white p-4 safe-bottom">
          {canInstall ? (
            <button onClick={install} className="btn-outline w-full">
              <Download className="size-4" /> Install the Found app
            </button>
          ) : null}
          {user ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Link href="/dashboard" onClick={onClose} className="btn-primary w-full">
                <LayoutDashboard className="size-4" /> Dashboard
              </Link>
              <a href="/logout" className="btn-ghost" aria-label="Sign out">
                <LogOut className="size-4" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" onClick={onClose} className="btn-outline w-full">
                Sign in
              </Link>
              <Link href="/register" onClick={onClose} className="btn-primary w-full">
                <Plus className="size-4" /> List property
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuChip({ href, children, onClose, strong }: { href: string; children: React.ReactNode; onClose: () => void; strong?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={clsx(
        "rounded-xl border px-3 py-2.5 text-sm leading-snug transition",
        strong ? "border-ink bg-ink font-semibold text-white" : "border-slate-200 font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50/50",
      )}
    >
      {children}
    </Link>
  );
}
