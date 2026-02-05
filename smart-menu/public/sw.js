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
      icon: data.icon || "/icons/logo-192x192.png",
      badge: "/icons/logo-192x192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

// Minimal fetch handler so Chrome sees this SW as controlling network requests
self.addEventListener("fetch", (event) => {
  // pass-through response keeps the SW installable without custom caching yet
  event.respondWith(fetch(event.request));
});
