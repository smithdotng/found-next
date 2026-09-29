import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { DEFAULT_TITLE, DEFAULT_DESCRIPTION, siteUrl, pageMetadata, COMPANY } from "@/lib/seo";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { Toaster } from "@/components/ui/toaster";

const jakarta = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-italic.woff2", style: "italic" },
  ],
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
});

const base = pageMetadata({ title: DEFAULT_TITLE, path: "/", absoluteTitle: true });

export const metadata: Metadata = {
  ...base,
  metadataBase: new URL(siteUrl()),
  title: { default: DEFAULT_TITLE, template: "%s | Found Properties" },
  description: DEFAULT_DESCRIPTION,
  applicationName: "Found Properties",
  authors: [{ name: COMPANY }],
  creator: COMPANY,
  publisher: COMPANY,
  formatDetection: { telephone: true, email: true, address: false },
  appleWebApp: { capable: true, title: "Found", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/assets/images/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/images/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "msapplication-TileColor": "#1b5e85",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#12334a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-H8R24Q91C0";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full">
        <PwaProvider>
          {children}
          <Toaster />
        </PwaProvider>
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
