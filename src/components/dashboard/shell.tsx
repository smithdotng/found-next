"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  LayoutDashboard, Building2, PlusCircle, Inbox, UserCircle, LogOut, Menu, X, ClipboardCheck, Users, Newspaper, Star, Landmark,
  Megaphone, Search, Wallet, ExternalLink, Download, Receipt, Mail, CalendarCheck, CalendarDays, FileSignature, KeyRound, BadgeCheck, Gem } from "lucide-react";
import { usePwa } from "@/components/pwa/pwa-provider";

type NavItem = { href: string; label: string; icon: typeof Inbox; badge?: number; exact?: boolean };
type User = { name: string; email: string; type: "realtor" | "agent" | "admin" | "host"; superAdmin: boolean };
type Counts = { approvals: number; inquiries: number; bookings: number; hosts: number; verifications: number; privateClients?: number };

function navFor(user: User, counts: Counts): { title?: string; items: NavItem[] }[] {
  if (user.type === "host") {
    return [
      {
        items: [
          { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
          { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck, badge: counts.bookings },
          { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
          { href: "/dashboard/listings", label: "My apartments", icon: Building2 },
          { href: "/dashboard/listings/new", label: "Add apartment", icon: PlusCircle, exact: true },
          { href: "/dashboard/inquiries", label: "Enquiries", icon: Inbox, badge: counts.inquiries },
        ],
      },
      {
        title: "Account",
        items: [
          { href: "/dashboard/agreement", label: "Listing agreement", icon: FileSignature },
          { href: "/dashboard/profile", label: "Profile & settings", icon: UserCircle },
        ],
      },
    ];
  }
  if (user.type === "agent") {
    return [
      {
        items: [
          { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
          { href: "/dashboard/promote", label: "Find properties", icon: Search },
          { href: "/dashboard/promotions", label: "My promotions", icon: Megaphone },
          { href: "/dashboard/earnings", label: "Earnings", icon: Wallet },
        ],
      },
      { title: "Account", items: [{ href: "/dashboard/profile", label: "Profile & settings", icon: UserCircle }] },
    ];
  }
  if (user.type === "admin") {
    return [
      {
        items: [
          { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
          { href: "/dashboard/approvals", label: "Approvals", icon: ClipboardCheck, badge: counts.approvals },
          { href: "/dashboard/listings", label: "All listings", icon: Building2 },
          { href: "/dashboard/listings/new", label: "Add listing", icon: PlusCircle, exact: true },
          { href: "/dashboard/inquiries", label: "Enquiries", icon: Inbox, badge: counts.inquiries },
          { href: "/dashboard/users", label: "Users", icon: Users },
          { href: "/dashboard/verification", label: "Verifications", icon: BadgeCheck, badge: counts.verifications },
          { href: "/dashboard/private-clients", label: "Prestige clients", icon: Gem, badge: counts.privateClients },
        ],
      },
      {
        title: "Found Apartments",
        items: [
          { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck, badge: counts.bookings },
          { href: "/dashboard/hosts", label: "Hosts", icon: KeyRound, badge: counts.hosts },
          { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
        ],
      },
      {
        title: "Content",
        items: [
          { href: "/dashboard/projects", label: "Projects", icon: Landmark },
          { href: "/dashboard/blog", label: "Blog", icon: Newspaper },
          { href: "/dashboard/featured", label: "Featured deals", icon: Star },
          { href: "/dashboard/finance", label: "Transactions", icon: Receipt },
          ...(user.superAdmin ? [{ href: "/dashboard/newsletters", label: "Newsletters", icon: Mail }] : []),
        ],
      },
      { title: "Account", items: [{ href: "/dashboard/profile", label: "Profile & settings", icon: UserCircle }] },
    ];
  }
  return [
    {
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/listings", label: "My listings", icon: Building2 },
        { href: "/dashboard/listings/new", label: "Add listing", icon: PlusCircle, exact: true },
        { href: "/dashboard/inquiries", label: "Enquiries", icon: Inbox, badge: counts.inquiries },
        { href: "/dashboard/bookings", label: "Shortlet bookings", icon: CalendarCheck, badge: counts.bookings },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/dashboard/verification", label: "Get verified", icon: BadgeCheck },
        { href: "/dashboard/profile", label: "Profile & settings", icon: UserCircle },
      ],
    },
  ];
}

const ROLE_LABEL = { realtor: "Realtor", agent: "Agent", admin: "Administrator", host: "Host · Found Apartments" };

export function DashboardShell({ user, counts, children }: { user: User; counts: Counts; children: React.ReactNode }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);
  const { canInstall, install } = usePwa();
  const groups = navFor(user, counts);

  const isActive = (i: NavItem) =>
    i.exact ? pathname === i.href : pathname === i.href || (pathname.startsWith(i.href + "/") && !pathname.startsWith("/dashboard/listings/new"));

  const signOut = () => navigator.serviceWorker?.controller?.postMessage("clear-private");

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/" aria-label="Found — public site">
          <Image src="/assets/images/logo2.png" alt="Found" width={1000} height={355} priority className="-ml-2 h-10 w-auto" />
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.title ? <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.title}</p> : null}
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const on = isActive(i);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={on ? "page" : undefined}
                      className={clsx(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                        on ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-ink",
                      )}
                    >
                      <i.icon className={clsx("size-[18px]", on ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                      <span className="flex-1">{i.label}</span>
                      {i.badge ? (
                        <span className={clsx("rounded-full px-1.5 py-0.5 text-[10px] font-bold", on ? "bg-white/20 text-white" : "bg-coral-500 text-white")}>
                          {i.badge > 99 ? "99+" : i.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-slate-100 p-3">
        {canInstall ? (
          <button onClick={install} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            <Download className="size-[18px]" /> Install app
          </button>
        ) : null}
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <ExternalLink className="size-[18px] text-slate-400" /> View website
        </Link>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.superAdmin ? "Super admin" : ROLE_LABEL[user.type]}</p>
          </div>
          <a href="/logout" onClick={signOut} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block print:!hidden">{sidebar}</aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden print:hidden">
        <button onClick={() => setOpen(true)} className="btn-ghost !px-2" aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        <Link href="/dashboard">
          <Image src="/assets/images/logo2.png" alt="Found" width={1000} height={355} className="h-9 w-auto" />
        </Link>
        {user.type !== "agent" ? (
          <Link href="/dashboard/listings/new" className="btn-ghost !px-2 text-brand-600" aria-label="Add listing">
            <PlusCircle className="size-5" />
          </Link>
        ) : (
          <span className="w-9" />
        )}
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-lift animate-slide-up">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 btn-ghost !px-2" aria-label="Close navigation">
              <X className="size-5" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <main className="lg:pl-64 print:!pl-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
