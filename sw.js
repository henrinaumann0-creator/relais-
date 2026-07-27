// Relais -- Service Worker
// Cached die App-Huelle (HTML/CSS/JS/Icons) NUR als Offline-Rueckfall.
// Strategie: Netzwerk zuerst -- wer online ist, sieht immer die aktuelle
// Version. Nur wenn das Netzwerk fehlschlaegt (z.B. offline), wird auf die
// zuletzt zwischengespeicherte Version zurueckgegriffen.
// API-Aufrufe an die KI-Anbieter gehen immer direkt ins Netz -- die werden
// hier nie zwischengespeichert.

const CACHE = "relais-shell-v2";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Fremde Domains (die KI-Anbieter) unangetastet lassen.
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if(res.ok){
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
