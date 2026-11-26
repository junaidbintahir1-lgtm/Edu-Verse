/* EduVerse service worker: offline support and "install app".
   Strategy: ALWAYS try the network first, so students see updates at once; the saved copy is only
   used when they are offline. Pictures and fonts are served from the saved copy and refreshed in the
   background. PDFs and anything on another website (Supabase, fonts, Knovo) are never touched. */
const CACHE = "eduverse-v47";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/favicon-32.png",
               "assets/eduverse-logo.png", "assets/knovo-logo-sm.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function save(request, response) {
  if (response && response.ok && response.type === "basic") {
    const copy = response.clone();
    caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (/\.pdf$/i.test(url.pathname)) return;                       // PDFs: always straight from the network
  if (/\.(png|jpe?g|webp|svg|gif|ico|woff2?)$/i.test(url.pathname)) {
    /* pictures and fonts: saved copy first, refreshed in the background */
    e.respondWith(caches.match(e.request).then((hit) => {
      const fresh = fetch(e.request).then((res) => save(e.request, res)).catch(() => hit);
      return hit || fresh;
    }));
    return;
  }
  /* pages, scripts, styles and data: network first, saved copy when offline */
  e.respondWith(
    fetch(e.request).then((res) => save(e.request, res))
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || (e.request.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
