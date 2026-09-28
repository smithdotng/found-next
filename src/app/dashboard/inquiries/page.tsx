import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { requireUser, isSuperAdmin } from "@/lib/session";
import { getManagedInquiries } from "@/lib/dashboard";
import { connectDB, toPlain } from "@/lib/db";
import { ProjectInquiry } from "@/lib/models";
import { PageHeader, Tabs, EmptyState } from "@/components/dashboard/ui";
import { InquiryInbox } from "@/components/dashboard/inquiry-inbox";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Enquiries" };

export default async function InquiriesPage({ searchParams }: PageProps<"/dashboard/inquiries">) {
  const session = await requireUser(["realtor", "admin"]);
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const view = pick("view") ?? "property";
  const f = { filter: pick("filter") ?? "all", q: pick("q"), property: pick("property"), page: pick("page") };
  const isAdmin = session.userType === "admin";

  // Old app limited platform-wide property enquiries to the super admin; other admins see project enquiries.
  const canSeeAll = !isAdmin || isSuperAdmin(session);
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...f, view: view === "property" ? undefined : view, page: undefined, ...patch }))
      if (v && !(k === "filter" && v === "all")) q.set(k, v);
    return `/dashboard/inquiries${q.toString() ? `?${q}` : ""}`;
  };

  if (isAdmin && view === "project") {
    await connectDB();
    const items = toPlain<{ _id: string; projectName: string; name: string; email: string; phone?: string; message: string; status: string; createdAt: string }[]>(
      await ProjectInquiry.find().sort("-createdAt").limit(100).lean(),
    );
    return (
      <>
        <PageHeader title="Enquiries" description="Leads from project and estate pages." />
        <Tabs active="project" tabs={[{ key: "property", label: "Property enquiries", href: href({ view: undefined }) }, { key: "project", label: "Project enquiries", href: href({ view: "project" }) }]} />
        <div className="card mt-5 divide-y divide-slate-100">
          {items.length ? (
            items.map((q) => (
              <div key={q._id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{q.name} <span className="font-normal text-slate-500">· {q.projectName}</span></p>
                  <span className="text-xs text-slate-400">{formatDate(q.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{q.message}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <a href={`mailto:${q.email}`} className="text-brand-600 hover:underline">{q.email}</a>
                  {q.phone ? <a href={`tel:${q.phone}`} className="text-brand-600 hover:underline">{q.phone}</a> : null}
                </div>
              </div>
            ))
          ) : (
            <p className="p-6 text-sm text-slate-500">No project enquiries yet.</p>
          )}
        </div>
      </>
    );
  }

  const data = canSeeAll ? await getManagedInquiries(session, f) : { items: [], total: 0, page: 1, totalPages: 1 };
  const tabs = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "open", label: "Awaiting reply" },
    { key: "replied", label: "Replied" },
  ].map((t) => ({ ...t, href: href({ filter: t.key }) }));

  return (
    <>
      <PageHeader
        title="Enquiries"
        description={isAdmin ? "Every enquiry sent from property pages." : "Messages from people interested in your listings. Reply fast — speed wins deals."}
      />
      {isAdmin ? (
        <div className="mb-4">
          <Tabs active="property" tabs={[{ key: "property", label: "Property enquiries", href: href({ view: undefined }) }, { key: "project", label: "Project enquiries", href: href({ view: "project" }) }]} />
        </div>
      ) : null}
      {!canSeeAll ? (
        <EmptyState icon={Inbox} title="Super admin only" text="Platform-wide property enquiries are restricted to the super admin account." />
      ) : (
        <>
          <Tabs tabs={tabs} active={f.filter} />
          <form className="mt-4 flex gap-2" action="/dashboard/inquiries">
            {f.filter !== "all" ? <input type="hidden" name="filter" value={f.filter} /> : null}
            {f.property ? <input type="hidden" name="property" value={f.property} /> : null}
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <span className="sr-only">Search enquiries</span>
              <input name="q" defaultValue={f.q} placeholder="Search name, email, phone or property" className="field pl-9" />
            </label>
            <button className="btn-outline">Search</button>
          </form>
          {f.property ? (
            <p className="mt-3 text-sm text-slate-500">
              Showing enquiries for one listing. <Link href={href({ property: undefined })} className="font-medium text-brand-600 hover:underline">Show all</Link>
            </p>
          ) : null}
          <div className="mt-5">
            {data.items.length ? (
              <InquiryInbox items={data.items} canDelete={isAdmin} initialOpen={pick("open")} />
            ) : (
              <EmptyState icon={Inbox} title="No enquiries here" text="When someone enquires about a listing, it lands here and in your email." />
            )}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} basePath="/dashboard/inquiries" params={{ ...f, filter: f.filter === "all" ? undefined : f.filter }} />
        </>
      )}
    </>
  );
}
