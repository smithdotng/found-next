import Link from "next/link";
import clsx from "clsx";
import { STATUS_META } from "@/lib/format";
import type { PropertyStatus } from "@/lib/types";

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "brand" | "coral" | "emerald" | "amber" | "slate";
  href?: string;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    coral: "bg-coral-50 text-coral-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  const body = (
    <div className={clsx("card h-full p-5", href && "transition hover:border-brand-200 hover:shadow-lift")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon ? (
          <span className={clsx("grid size-9 place-items-center rounded-xl", tones[tone])}>
            <Icon className="size-[18px]" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function StatusBadge({ status }: { status: PropertyStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.unavailable;
  return <span className={clsx("chip", m.tone)}>{m.label}</span>;
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 font-semibold text-ink">{title}</p>
      {text ? <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{text}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Tabs({ tabs, active }: { tabs: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
      <div className="inline-flex min-w-full gap-1 border-b border-slate-200 sm:min-w-0">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <Link
              key={t.key}
              href={t.href}
              scroll={false}
              className={clsx(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition",
                on ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-ink",
              )}
            >
              {t.label}
              {t.count !== undefined ? (
                <span className={clsx("rounded-full px-1.5 text-[11px] font-semibold", on ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500")}>{t.count}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
