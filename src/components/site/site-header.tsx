import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const session = await getSession();
  const user = session.userId ? { name: session.userName ?? "", type: session.userType ?? "realtor" } : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div className="container-page flex h-16 items-center gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Found Projects & Realty — home">
          <Image src="/assets/images/logo2.png" alt="Found Projects & Realty" width={1000} height={355} priority className="h-11 w-auto -ml-2" />
        </Link>
        <HeaderNav user={user} />
      </div>
    </header>
  );
}
