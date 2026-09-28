"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Heart, LayoutDashboard, Menu, Plus, X, LogOut, Download } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/format";
import { useSaved } from "@/components/property/saved-store";
import { usePwa } from "@/components/pwa/pwa-provider";

type User = { name: string; type: string } | null;

const links = [
  { href: "/projects", label: "Projects" },
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

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white shadow-lift animate-slide-up">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <span className="text-sm font-semibold text-slate-500">Menu</span>
              <button className="btn-ghost !px-2" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Browse</p>
              <MobileLink href="/properties">All properties</MobileLink>
              {PROPERTY_TYPES.map((t) => (
                <MobileLink key={t.value} href={`/properties?type=${t.value}`}>
                  {t.plural}
                </MobileLink>
              ))}
              <p className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Found</p>
              {links.map((l) => (
                <MobileLink key={l.href} href={l.href}>
                  {l.label}
                </MobileLink>
              ))}
              <MobileLink href="/agent/register">Become an agent</MobileLink>
              <MobileLink href="/about">About us</MobileLink>
              <MobileLink href="/contact">Contact</MobileLink>
            </div>
            <div className="space-y-2 border-t border-slate-100 p-4 safe-bottom">
              {canInstall ? (
                <button onClick={install} className="btn-outline w-full">
                  <Download className="size-4" /> Install the Found app
                </button>
              ) : null}
              {user ? (
                <>
                  <Link href="/dashboard" className="btn-primary w-full">
                    <LayoutDashboard className="size-4" /> Go to dashboard
                  </Link>
                  <a href="/logout" className="btn-ghost w-full">
                    <LogOut className="size-4" /> Sign out
                  </a>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-primary w-full">
                    <Plus className="size-4" /> List a property
                  </Link>
                  <Link href="/login" className="btn-outline w-full">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-slate-50">
      {children}
    </Link>
  );
}
