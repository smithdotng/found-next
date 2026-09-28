import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Percent, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit" aria-label="Found — home">
          <Image src="/assets/images/logo2.png" alt="Found Projects & Realty" width={1000} height={355} priority className="-ml-3 h-12 w-auto" />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} Found Projects &amp; Realty Limited</p>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/assets/images/hero-bg.jpg" alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/95 via-brand-900/70 to-brand-800/40" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <h2 className="max-w-md text-3xl font-bold leading-tight">Manage every listing, lead and referral from one place.</h2>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-3"><ShieldCheck className="size-5 text-coral-200" /> Reviewed listings across all 36 states + FCT</li>
            <li className="flex items-center gap-3"><Percent className="size-5 text-coral-200" /> Agency fees capped at 10%</li>
            <li className="flex items-center gap-3"><BadgeCheck className="size-5 text-coral-200" /> Free for realtors · agents earn 70%</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
