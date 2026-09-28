# Found Properties — Next.js app

The Next.js (App Router) rebuild of the Found Projects & Realty platform. It lives next to the
Express app and uses **the same MongoDB database and the same `public/uploads` folder**, so every
existing account, password, listing, enquiry, blog post and photo works unchanged.

## Run it

```bash
cd found-next
cp .env.example .env.local     # then copy MONGODB_URI, SESSION_SECRET, EMAIL_* from ../.env
npm install
npm run dev                    # http://localhost:3000
```

Production:

```bash
npm run build
npm start -- -p 3000           # behind Nginx / your process manager, like the Express app
```

Node 20.9+ is required. Run it on the same server as the Express app (or set `UPLOAD_DIR`) so photos are shared.

## What's in it

**Public site:** home, property search (filters for type, sale/rent/lease, state, budget, bedrooms, keyword and sort), property detail
(gallery, key facts, enquiry form, share buttons, similar listings), saved properties, projects, blog, about, how it works,
for realtors, contact, FAQ, terms, privacy, HTML and XML sitemaps, robots.txt, `/r/:code` agent referral links, and newsletter unsubscribe.

**One dashboard at `/dashboard`** that adapts to the role:

- **Realtor:** overview (live, pending, views, unread enquiries, items needing attention), a listings table with status tabs,
  search and quick actions (mark sold/rented, take off market, edit, delete), a single-page listing editor with
  drag-to-reorder photos and shortlet settings, an enquiries inbox with reply/WhatsApp/call, and profile settings.
- **Agent:** find properties to promote, referral links and QR codes, click/enquiry stats, earnings, bank details and withdrawal requests.
- **Admin:** approval queue (approve or reject with a reason), all listings, users (verify realtors, approve agents, suspend),
  all enquiries including projects, projects, blog, featured deals, transactions and withdrawals, and **newsletters** (super admin only).

Old Express URLs (`/admin/...`, `/realtor/...`, `/agent/dashboard`, `/properties/add/new` …) redirect to the new pages.

## OG / SEO tags

Every page builds its tags through `src/lib/seo.ts`, which keeps the Express header's set:
`og:type`, `og:url`, `og:title`, `og:description`, `og:image` (absolute, 1200×630), `og:site_name`,
`og:locale=en_NG`, `twitter:card=summary_large_image`, plus description, keywords and canonical.
Property pages use the listing's first photo, blog posts use `ogImage`/`featuredImage` and the post's meta fields,
and projects use their SEO fields and featured image. All other pages fall back to `/assets/images/og-1200x630.jpg`.
Dashboard and auth pages are `noindex`. Google Analytics `G-H8R24Q91C0` is kept.

## PWA

- `src/app/manifest.ts` — installable app (name, icons incl. maskable, shortcuts, theme colour).
- `public/sw.js` — service worker: network-first pages with offline fallback (`/offline`), recently viewed listings
  open offline, cached images and build assets. Dashboard, login and API requests are never cached.
- Install prompt in the header/footer/dashboard on supported browsers; iOS users get "Add to Home Screen" guidance.

The service worker only registers in production (`npm run build && npm start`) and needs HTTPS (or localhost).

## Not ported

- Paystack listing-tier payments (`/properties/pay-listing-fee`) — the Express route rendered a view that doesn't exist, so it was never live.
- The shortlet booking form (`shortlet-booking-form.ejs`) — it wasn't linked from any page. Shortlet enquiries go through the normal enquiry form.
- The demo `/api/agent-analytics`, `/api/inquiries` and `/test-*` routes, which returned hard-coded sample data.
