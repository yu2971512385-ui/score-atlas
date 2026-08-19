const CACHE = "score-atlas-v5-1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=5.1",
  "./kirby-theme.css?v=5.1",
  "./kirby-theme.js?v=5.1",
  "./app.js?v=5.1",
  "./arranger.js?v=5.1",
  "./audio-transcriber.js?v=5.1",
  "./tunes.js?v=5.1",
  "./data.js?v=5.1",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/lucide.min.js",
  "./assets/abcjs-basic-min.js?v=5.1",
  "./assets/kirby-wallpaper-drive.jpg",
  "./assets/kirby-wallpaper-squish.jpg",
  "./assets/kirby-wallpaper-space.jpg",
  "./assets/kirby-loader-01.jpg",
  "./assets/kirby-loader-02.jpg",
  "./assets/kirby-loader-03.jpg",
  "./assets/kirby-loader-04.jpg",
  "./assets/kirby-loader-05.jpg",
  "./assets/kirby-loader-06.jpg",
  "./assets/kirby-loader-07.jpg",
  "./assets/kirby-loader-08.jpg"
];

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
