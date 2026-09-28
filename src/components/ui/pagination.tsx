import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={clsx("btn-ghost !px-2.5", page === 1 && "pointer-events-none opacity-40")}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Link>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={clsx(
              "grid size-9 place-items-center rounded-xl text-sm font-semibold transition",
              p === page ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {p}
          </Link>
        ),
      )}
      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={clsx("btn-ghost !px-2.5", page === totalPages && "pointer-events-none opacity-40")}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
