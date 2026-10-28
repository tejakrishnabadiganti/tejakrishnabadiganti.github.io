const CACHE_NAME = "teja-portfolio-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/data/content.json",
  "/packages/css/fonts.css",
  "/packages/css/styles.css",
  "/packages/css/classic.css",
  "/packages/css/modern.css",
  "/packages/css/chat.css",
  "/packages/fonts/inter-latin.woff2",
  "/packages/fonts/playfair-display-latin.woff2",
  "/packages/fonts/playfair-display-italic-latin.woff2",
  "/packages/images/favicon.svg",
];

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
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
