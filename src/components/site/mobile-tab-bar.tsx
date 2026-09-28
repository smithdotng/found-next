"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, Search, Heart, User, Building2 } from "lucide-react";

/** App-style bottom navigation for phones and the installed PWA. */
export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { href: "/properties", label: "Explore", icon: Search, match: (p: string) => p.startsWith("/properties") },
    { href: "/projects", label: "Projects", icon: Building2, match: (p: string) => p.startsWith("/projects") },
    { href: "/saved", label: "Saved", icon: Heart, match: (p: string) => p.startsWith("/saved") },
    {
      href: signedIn ? "/dashboard" : "/login",
      label: signedIn ? "Account" : "Sign in",
      icon: User,
      match: (p: string) => p.startsWith("/dashboard") || p.startsWith("/login"),
    },
  ];
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden safe-bottom"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const on = match(pathname);
          return (
            <li key={label}>
              <Link
                href={href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
                  on ? "text-brand-600" : "text-slate-500",
                )}
              >
                <Icon className={clsx("size-5", on && "fill-brand-100")} strokeWidth={on ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
