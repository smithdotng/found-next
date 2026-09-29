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

## Found Apartments (shortlets)

A shortlet booking section at **`/apartments`**, sharing the same database, logins and uploads.

**Guests:** search by area, dates and guests, filter by budget, bedrooms and amenities, then open an apartment
(`/apartments/<slug>`) to see a live availability calendar, a price breakdown (weekend rate, weekly/monthly
discounts, cleaning fee, refundable caution fee) and **request to book**. No payment happens online: the host
confirms, then arranges payment directly. Guests track the request at a private link
(`/apartments/booking/<ref>?t=…`) that's emailed to them, and can withdraw or cancel there.

**Hosts** are a new account type (`userType: "host"`):
1. Apply at `/host/register`. `/host` explains how hosting works.
2. An admin vets them on **Dashboard → Hosts**, sets the commission (default **25%**) and approves. This sends the agreement.
3. The host reads and signs the **listing agreement** at `/dashboard/agreement`. The typed name, time, IP and user agent are
   stored in `hostProfile.agreement`, and a printable copy is available. Changing a host's rate requires a fresh signature.
4. Host apartments are shortlet listings (`propertyType: "shortlet"`, `ownerType: "host"`). They go through the normal
   approval queue, but **can't be approved until the host is vetted and has signed**.

Host dashboard: overview and onboarding checklist, **Bookings** (accept or decline with a note, record payment, check in and out,
no-show, cancel), **Calendar** (confirmed stays, requests and blocked dates; block nights for personal use), apartments,
enquiries, agreement and profile. Realtors who list shortlets get the same Bookings and Calendar pages.

Admin: **Hosts** (vetting, commission, agreements), **Bookings** across all hosts with commission tracking
(not due → due at check-in → record as received / waive), and a Found Apartments summary on the overview.

Rules worth knowing:
- Only confirmed or checked-in stays and host blocks hold dates. Requests don't, so accepting re-checks for clashes.
- A request not answered within 48 hours, or whose check-in date has passed, expires automatically.
- Commission = rate × (nightly charges after discounts + cleaning fee). The caution fee is excluded.
- `/properties/<slug>` for a shortlet permanently redirects to `/apartments/<slug>`. The sitemap lists shortlets under `/apartments`.
- Booking emails use `src/lib/mailer.ts` with the same SMTP settings. Without SMTP they're skipped and logged.

New collections: `bookings` (the Express Booking schema, extended) and `blockeddates`. The Express app's User schema
doesn't know the `host` type, so hosts should use the Next.js app.

## Photo storage (Cloudflare R2)

Photo URLs are stored in MongoDB as `/uploads/<file>` by both apps. With R2 configured:

- **New uploads** from this app go straight to the bucket under the same path (`uploads/<file>`), not to disk.
- **Pages** load photos from `NEXT_PUBLIC_MEDIA_BASE_URL` (see `src/lib/media.ts`), optimised by `next/image`.
  OG tags and JSON-LD use the same URLs.
- **`/uploads/...` requests** are served from local disk if the file exists, otherwise 308-redirected to the bucket,
  so old links and emails keep working.
- **The Express app** mirrors every new file in `public/uploads` to the bucket (`utils/r2-sync.js`, started from `app.js`).

Setup:
1. Cloudflare → R2 → **Create bucket** (e.g. `found-media`). Under **Settings → Public access**, connect a custom domain
   (`media.found.ng`) or enable the `r2.dev` URL.
2. R2 → **Manage API tokens** → create a token with **Object Read & Write** on that bucket.
3. Put `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `NEXT_PUBLIC_MEDIA_BASE_URL`
   in `.env.local` / your host's environment, and the four `S3_*` values in the Express app's `.env`.
4. Copy existing photos once, from the machine that has the uploads folder (the EC2 server):
   `node --env-file=.env.local scripts/migrate-uploads.mjs --dry-run`, then without `--dry-run`.
   It's safe to re-run; files already in the bucket are skipped.
5. `npm install` in the Express app (adds `@aws-sdk/client-s3`) and restart it; it logs `[r2-sync] Mirroring …`.

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
