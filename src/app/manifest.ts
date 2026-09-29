import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Found Properties — Nigeria's property marketplace",
    short_name: "Found",
    description: "Find verified shortlets, land, buildings, shops and business complexes across Nigeria, and manage your listings on the go.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#1b5e85",
    lang: "en-NG",
    dir: "ltr",
    categories: ["business", "lifestyle", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book an apartment", short_name: "Stays", url: "/apartments?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Search properties", short_name: "Search", url: "/properties?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Saved properties", short_name: "Saved", url: "/saved?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My dashboard", short_name: "Dashboard", url: "/dashboard?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "List a property", short_name: "List", url: "/dashboard/listings/new?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
