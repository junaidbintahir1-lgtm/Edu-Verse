/* EduVerse service worker — app-shell cache so the site installs and loads fast,
   with offline access to the pages you have already opened. PDFs are NOT cached
   (they are large and always fetched fresh). */
const CACHE = "eduverse-v29";
const SHELL = ["./", "index.html", "signin.html", "manifest.webmanifest", "xp-leaderboard.js", "leaderboard-database-setup.txt",
               "icons/icon-192.png", "icons/icon-512.png",
               "icons/favicon-32.png", "icons/icon-maskable-512.png",
               "assets/eduverse_logo.png", "assets/knovo-logo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (/\.pdf(\?|$)/i.test(url.pathname)) return;              // never cache PDFs
  if (e.request.mode === "navigate") {
    /* pages: try network first, fall back to cache (offline) */
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match("index.html")))
    );
    return;
  }
  /* assets: cache first, then network */
  e.respondWith(
    caches.match(e.request).then((m) => m || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }))
  );
});
