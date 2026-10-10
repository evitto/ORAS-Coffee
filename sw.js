/* ORAS Coffee POS service worker: makes the app open and work offline.
   Sales data lives in the device's localStorage and is never touched here.
   Bump VERSION when you change icons or the manifest. index.html updates itself
   (it is re-fetched in the background on every launch). */
const VERSION = 'oras-pos-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.ico',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png', './icons/favicon-16.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    // open instantly from cache, refresh the cached copy in the background
    e.respondWith(caches.match('./index.html').then(cached => {
      const net = fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    }));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); }
    return res;
  })));
});
