/* LEI Pós-laboral — service worker
   - página: vai sempre primeiro à rede (atualizações chegam logo); sem rede, usa a cópia guardada
   - ícones e letras: guardados na primeira visita
   - Biblioteca (Google Apps Script) e Moodle: nunca passam por aqui */
const CACHE = "lei-v1";
const BASE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const local = url.origin === location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!local && !fonts) return;                       // Apps Script, Moodle, etc.: direto à rede
  if (req.mode === "navigate" || (local && /\/($|index\.html$)/.test(url.pathname))) {
    e.respondWith(
      fetch(req, { cache: "no-cache" })
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
