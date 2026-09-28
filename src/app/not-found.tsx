import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <Link href="/">
          <Image src="/assets/images/logo2.png" alt="Found" width={1000} height={355} className="mx-auto h-14 w-auto" />
        </Link>
        <p className="mt-8 text-6xl font-black text-brand-100">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-slate-600">The page you are looking for does not exist, or the listing is no longer available.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/properties" className="btn-primary">
            <Search className="size-4" /> Browse properties
          </Link>
          <Link href="/" className="btn-outline">Go home</Link>
        </div>
      </div>
    </div>
  );
}
