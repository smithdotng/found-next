/* Found Properties service worker — offline support for the installable app.
 * Strategy:
 *  - App shell (offline page, icons, logo) precached on install.
 *  - Page navigations: network first; successful public pages are cached so
 *    recently viewed listings open offline; falls back to /offline.
 *  - Build assets (/_next/static): cache first (file names are content-hashed).
 *  - Images (/uploads, /_next/image, /assets): stale-while-revalidate, capped.
 *  - Dashboard, auth, API and non-GET requests are never cached.
 */
const VERSION = "found-v1";
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const IMAGES = `${VERSION}-images`;

const PRECACHE = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/assets/images/logo2.png",
  "/assets/images/og-1200x630.jpg",
];

const NEVER_CACHE = [/^\/dashboard/, /^\/admin/, /^\/api\//, /^\/login/, /^\/register/, /^\/logout/, /^\/agent\/register/, /^\/reset-password/, /^\/forgot-password/, /^\/r\//];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "clear-private") {
    // Sent on sign-out so no personal pages linger in the cache.
    event.waitUntil(caches.delete(PAGES));
  }
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((rx) => rx.test(url.pathname))) return;
  // React Server Component payloads used for client-side navigation — leave to the network.
  if (req.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.destination === "image" || url.pathname.startsWith("/uploads/") || url.pathname.startsWith("/_next/image") || url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) {
              cache.put(req, res.clone());
              trim(IMAGES, 250);
            }
            return res;
          })
          .catch(() => hit);
        return hit || network;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok && res.headers.get("content-type")?.includes("text/html")) {
            const cache = await caches.open(PAGES);
            cache.put(req, res.clone());
            trim(PAGES, 60);
          }
          return res;
        } catch {
          const cached = (await caches.match(req)) || (await caches.match(url.pathname));
          return cached || (await caches.match("/offline")) || Response.error();
        }
      })(),
    );
  }
});
