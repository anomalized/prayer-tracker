const CACHE_NAME = "salah-tracker-v1";
const STATIC_ASSETS = ["/", "/dashboard/today", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Skip non-http requests (chrome-extension, etc.)
  if (!event.request.url.startsWith("http")) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(event.request, clone); } catch(e) {}
        });
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
