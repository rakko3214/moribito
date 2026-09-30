/* global self, caches, fetch, URL, Response */
const CACHE_NAME = "moribito-shell-v2";
const APP_SHELL = ["/", "/manifest.webmanifest", "/app-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("moribito-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never store account-specific API responses in a shared application cache.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    // Keep the installed HTML paired with this version's cached JavaScript.
    // New releases become visible only after their complete worker installs.
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
      const installed = await cache.match("/");
      return installed ?? fetch(request);
    }));
    return;
  }

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => (await cache.match(url.pathname)) ?? fetch(request)));
    return;
  }

  event.respondWith(fetch(request).then(async (response) => {
    if (!response.ok) return (await caches.match(request)) ?? response;
    try { const cache = await caches.open(CACHE_NAME); await cache.put(request, response.clone()); } catch { /* Quota failures must not prevent online play. */ }
    return response;
  }).catch(() => caches.match(request).then((cached) => cached ?? Response.error())));
});
