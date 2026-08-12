/**
 * KGP PAWS service worker.
 *
 * Strategy
 *   • Pages   → network-first. Medical/health info must never be served stale
 *               when the network is available; the cache is a fallback only.
 *   • Assets  → cache-first (immutable, content-hashed by Next).
 *   • Offline → precached /offline shell when a page fetch fails cold.
 *
 * Never cached: /admin, /dashboard, /login, /signup, /api — authenticated or
 * personalised responses must not persist on a shared/borrowed phone.
 */

const VERSION = "v2"; // v2: official society seal replaced placeholder icons
const PAGE_CACHE = `kgppaws-pages-${VERSION}`;
const ASSET_CACHE = `kgppaws-assets-${VERSION}`;
const OFFLINE_URL = "/offline";

const NEVER_CACHE = [/^\/admin/, /^\/dashboard/, /^\/login/, /^\/signup/, /^\/api\//];

const isNeverCached = (pathname) => NEVER_CACHE.some((re) => re.test(pathname));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Drop caches from previous versions so a deploy can't serve stale shells.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== PAGE_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isNeverCached(url.pathname)) return;

  // Static, content-hashed assets: cache-first.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            // Same rule as navigations, plus: never cache a 206 Partial
            // Content. The hero and story .mp4 files are served as ranged
            // requests, and Cache.put() rejects on a 206 — the unhandled
            // rejection was silent, but it also meant a partial response could
            // never be usefully stored. Skipping them is the correct outcome.
            if (res.ok && res.status !== 206 && res.type === "basic") {
              const copy = res.clone();
              caches.open(ASSET_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Navigations: network-first, fall back to cache, then the offline shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Only cache a page that actually rendered. Previously EVERY
          // navigation response was stored, so one 500 during a bad deploy —
          // or a 404 — was written into PAGE_CACHE and then served back from
          // the fallback branch below on the user's next offline visit. A
          // cached error page outlives the incident that produced it.
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match(OFFLINE_URL);
        })
    );
  }
});
