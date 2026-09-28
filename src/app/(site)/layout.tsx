import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { MobileTabBar } from "@/components/site/mobile-tab-bar";
import { getSession } from "@/lib/session";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <MobileTabBar signedIn={!!session.userId} />
    </div>
  );
}
