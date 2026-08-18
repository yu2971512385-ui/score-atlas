const CACHE = "score-atlas-v4-2";
const APP_SHELL = ["./", "./index.html", "./styles.css?v=4.2", "./app.js?v=4.2", "./arranger.js?v=4.2", "./tunes.js?v=4.2", "./data.js?v=4.2", "./manifest.webmanifest", "./assets/icon.svg", "./assets/lucide.min.js", "./assets/abcjs-basic-min.js?v=4.2"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(response => response || caches.match("./index.html")))
  );
});
