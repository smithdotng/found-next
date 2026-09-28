import type { Metadata } from "next";
import { requireUser, isSuperAdmin } from "@/lib/session";
import { getNavCounts } from "@/lib/dashboard";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Found Dashboard" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireUser();
  const counts = await getNavCounts(session);
  return (
    <DashboardShell
      user={{ name: session.userName, email: session.userEmail, type: session.userType, superAdmin: isSuperAdmin(session) }}
      counts={counts}
    >
      {children}
    </DashboardShell>
  );
}
