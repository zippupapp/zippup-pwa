// ZippUp PWA Service Worker (install prompt friendly + mobile checkout-safe)
const CACHE_NAME = 'zippup-pwa-v2025-08-11-01';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
      '/',
      '/index.html',
      '/manifest.json'
    ]);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k === CACHE_NAME ? null : caches.delete(k)));
  })());
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Always go to network for non-GET (e.g., Stripe sessions) and for Stripe/checkout endpoints
  if (req.method !== 'GET' ||
      url.pathname.startsWith('/api/payments/checkout-session') ||
      url.pathname.startsWith('/api/marketplace/orders')) {
    return; // let it hit the network
  }

  // Navigation requests: network-first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(req); }
      catch {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('/index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  // Same-origin static assets: cache-first, fallback to network
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        // Cache GET-only, successful responses
        if (res && res.status === 200 && req.method === 'GET') {
          cache.put(req, res.clone());
        }
        return res;
      } catch { return cached || Response.error(); }
    })());
  }
});
