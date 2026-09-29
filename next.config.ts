import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // This app sits inside the Express project folder; keep Turbopack rooted here.
  turbopack: { root: path.resolve(__dirname) },
  // Mongoose and nodemailer run on the server only; keep them out of bundling.
  serverExternalPackages: ["mongoose", "nodemailer", "qrcode"],
  experimental: {
    serverActions: {
      // Listing forms upload up to 10 photos (5MB each).
      bodySizeLimit: "55mb",
    },
  },
  images: {
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/assets/**" },
      { pathname: "/images/**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  // Old Express URLs → new dashboard/app routes, so bookmarks and emailed links keep working.
  async redirects() {
    return [
      { source: "/admin", destination: "/dashboard", permanent: false },
      { source: "/admin/dashboard", destination: "/dashboard", permanent: false },
      { source: "/realtor/dashboard", destination: "/dashboard", permanent: false },
      { source: "/agent/dashboard", destination: "/dashboard", permanent: false },
      { source: "/agent/pending", destination: "/dashboard", permanent: false },
      { source: "/properties/add/new", destination: "/dashboard/listings/new", permanent: false },
      { source: "/realtor/properties", destination: "/dashboard/listings", permanent: false },
      { source: "/realtor/properties/create", destination: "/dashboard/listings/new", permanent: false },
      { source: "/realtor/properties/:id/edit", destination: "/dashboard/listings/:id/edit", permanent: false },
      { source: "/properties/:id/edit", destination: "/dashboard/listings/:id/edit", permanent: false },
      { source: "/realtor/inquiries", destination: "/dashboard/inquiries", permanent: false },
      { source: "/realtor/profile", destination: "/dashboard/profile", permanent: false },
      { source: "/admin/properties/pending", destination: "/dashboard/approvals", permanent: false },
      { source: "/admin/properties", destination: "/dashboard/listings", permanent: false },
      { source: "/admin/users", destination: "/dashboard/users", permanent: false },
      { source: "/admin/realtors", destination: "/dashboard/users?type=realtor", permanent: false },
      { source: "/admin/agents", destination: "/dashboard/users?type=agent", permanent: false },
      { source: "/admin/inquiries/property", destination: "/dashboard/inquiries", permanent: false },
      { source: "/admin/blogs", destination: "/dashboard/blog", permanent: false },
      { source: "/admin/featured", destination: "/dashboard/featured", permanent: false },
      { source: "/agent/promotions", destination: "/dashboard/promotions", permanent: false },
      { source: "/agent/available-properties", destination: "/dashboard/promote", permanent: false },
      { source: "/agent/earnings", destination: "/dashboard/earnings", permanent: false },
      { source: "/agent/settings", destination: "/dashboard/profile", permanent: false },
      { source: "/projects/admin/projects", destination: "/dashboard/projects", permanent: false },
      { source: "/admin/projects", destination: "/dashboard/projects", permanent: false },
      { source: "/admin/newsletters/:path*", destination: "/dashboard/newsletters", permanent: false },
      { source: "/admin/transactions/:path*", destination: "/dashboard/finance", permanent: false },
      { source: "/admin/withdrawals", destination: "/dashboard/finance", permanent: false },
      { source: "/admin/profile", destination: "/dashboard/profile", permanent: false },
      { source: "/admin/inquiries/:path*", destination: "/dashboard/inquiries", permanent: false },
      { source: "/admin/blogs/create", destination: "/dashboard/blog/new", permanent: false },
      { source: "/admin/featured/add", destination: "/dashboard/featured/new", permanent: false },
    ];
  },
};

export default nextConfig;
