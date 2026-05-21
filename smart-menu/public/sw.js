// public/sw.js

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/smart-logo-192x192.png",
      badge: "/icons/smart-logo-192x192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/?pwa=1"));
});

// Minimal fetch handler so Chrome sees this SW as controlling network requests
self.addEventListener("fetch", (event) => {
  // pass-through response keeps the SW installable without custom caching yet
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === "navigate") {
        return caches.match(event.request).then((cachedResponse) => {
          return (
            cachedResponse ||
            new Response("Network unavailable.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        });
      }

      return Response.error();
    })
  );
});
