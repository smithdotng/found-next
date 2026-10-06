import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/format";
import { InstallCard } from "@/components/pwa/install-card";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50/70 pb-24 lg:pb-0">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Image src="/assets/images/logo2.png" alt="Found Projects & Realty" width={1000} height={355} className="h-14 w-auto -ml-3" />
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            Nigeria&apos;s property marketplace for verified shortlets, land, buildings, shops and business complexes, with fair
            commissions capped at 10%.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-brand-600" /> Free support:{" "}
              <a href="tel:+2348063006890" className="font-medium text-ink hover:text-brand-600">
                +234 806 300 6890
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-brand-600" />
              <a href="mailto:hello@found.ng" className="font-medium text-ink hover:text-brand-600">
                hello@found.ng
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-brand-600" /> Suite 5 Gwandal Centre, 1015 Frai Close, Wuse 2, Abuja
            </li>
          </ul>
        </div>
        <FooterCol title="Properties" className="lg:col-span-2">
          <FooterLink href="/properties">All properties</FooterLink>
          {PROPERTY_TYPES.map((t) => (
            <FooterLink key={t.value} href={`/properties?type=${t.value}`}>
              {t.plural}
            </FooterLink>
          ))}
        </FooterCol>
        <FooterCol title="Company" className="lg:col-span-2">
          <FooterLink href="/about">About us</FooterLink>
          <FooterLink href="/projects">Projects</FooterLink>
          <FooterLink href="/blog">Blog</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/faq">FAQ</FooterLink>
        </FooterCol>
        <FooterCol title="Partners" className="lg:col-span-2">
          <FooterLink href="/for-realtors">For realtors</FooterLink>
          <FooterLink href="/get-verified">Get verified</FooterLink>
          <FooterLink href="/agent/register">Become an agent</FooterLink>
          <FooterLink href="/how-it-works">How it works</FooterLink>
          <FooterLink href="/login">Sign in</FooterLink>
        </FooterCol>
        <div className="lg:col-span-2">
          <InstallCard />
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Found Projects &amp; Realty Limited. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/terms" className="hover:text-ink">Terms of use</Link>
            <Link href="/privacy-policy" className="hover:text-ink">Privacy policy</Link>
            <Link href="/sitemap" className="hover:text-ink">Sitemap</Link>
            <a href="https://facebook.com/founddotng" target="_blank" rel="noopener noreferrer" className="hover:text-ink">Facebook</a>
            <a href="https://instagram.com/founddotng" target="_blank" rel="noopener noreferrer" className="hover:text-ink">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-slate-600 transition hover:text-brand-600">
        {children}
      </Link>
    </li>
  );
}
