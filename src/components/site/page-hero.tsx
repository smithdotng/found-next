import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  crumbs?: { href?: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white">
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-coral-100/60 blur-3xl" aria-hidden />
      <div className="container-page relative py-12 sm:py-16">
        {crumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-slate-500">
            <Link href="/" className="hover:text-ink">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <ChevronRight className="size-3" />
                {c.href ? <Link href={c.href} className="hover:text-ink">{c.label}</Link> : <span className="text-slate-700">{c.label}</span>}
              </span>
            ))}
          </nav>
        ) : null}
        {eyebrow ? <p className="text-sm font-semibold text-coral-500">{eyebrow}</p> : null}
        <h1 className="mt-1 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
