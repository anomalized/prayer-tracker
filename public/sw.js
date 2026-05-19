const CACHE_NAME      = "salah-tracker-v2";   // bump version to force re-install
const PRECACHE_ASSETS = [
  "/",
  "/dashboard/today",
  "/dashboard/stats",
  "/dashboard/rewards",
  "/dashboard/friends",
  "/manifest.json",
];

// ── Install: pre-cache the app shell ────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())   // activate immediately
  );
});

// ── Activate: delete old caches ──────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip: non-HTTP (chrome-extension, data:, etc.)
  if (!request.url.startsWith("http")) return;

  // Skip: POST requests (Next.js server actions, Supabase writes).
  // These are handled by the offline queue in IndexedDB — the SW
  // must not intercept them or they'll fail with an opaque response.
  if (request.method !== "GET") return;

  // Skip: Supabase API calls — always need fresh data
  if (request.url.includes("supabase.co")) return;

  // Skip: Next.js internal HMR and RSC payloads (development)
  if (request.url.includes("/_next/webpack-hmr")) return;
  if (request.url.includes("?_rsc=")) return;

  // ── Strategy: network-first with offline fallback ─────────────────────────
  // 1. Try the network.
  // 2. On success: cache the response and return it.
  // 3. On failure: return cached version if available.
  // 4. If neither: for navigation requests, return the cached homepage shell.
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Only cache successful, non-opaque responses
        if (
          networkResponse.ok &&
          networkResponse.type !== "opaque" &&
          !request.url.includes("api.")
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(request, responseClone); } catch { /* quota exceeded */ }
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed — try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        // For navigation requests (page loads), return the cached app shell
        // so the user sees the app rather than a browser error page.
        if (request.mode === "navigate") {
          const shell = await caches.match("/dashboard/today");
          if (shell) return shell;
          return caches.match("/");
        }

        // For everything else, let it fail naturally
        return new Response("Offline", {
          status:  503,
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});

// ── Message handler ───────────────────────────────────────────────────────────
// Allows the app to communicate with the SW.
// Currently handles "SKIP_WAITING" for immediate activation on update.

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
