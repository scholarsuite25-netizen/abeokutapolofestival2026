/**
 * Abeokuta Polo Festival 2026 — Official Service Worker
 * Provides offline pass card caching, tournament schedule availability,
 * and push notification handlers for tournament alerts.
 */

const CACHE_NAME = "abeokuta-polo-v2026.1";

const PRECACHE_URLS = [
  "/",
  "/register",
  "/programme",
  "/sponsorship",
  "/royal-cup",
  "/icons/icon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.json",
];

// Install: Cache offline essentials
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn("Service worker precache partial warning:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for assets, Network-first with cache fallback for pages
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Skip non-GET or cross-origin requests
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle HTML navigation requests (offline fallback for passes and schedules)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          // If offline and accessing pass or register, return cached register
          if (request.url.includes("/pass/") || request.url.includes("/register")) {
            const cachedRegister = await caches.match("/register");
            if (cachedRegister) return cachedRegister;
          }

          // Fallback to cached home
          const cachedHome = await caches.match("/");
          if (cachedHome) return cachedHome;

          return new Response(
            "<!DOCTYPE html><html><head><title>Offline - Abeokuta Polo Festival</title></head><body style='font-family:sans-serif;text-align:center;padding:40px;background:#062D1D;color:#FFFFFF;'><h1>Abeokuta Polo Festival 2026</h1><p>You are currently offline. Your downloaded pass HTML card is saved to your phone device downloads.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // Handle static assets (images, css, js, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and refresh in background
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      });
    })
  );
});

// Push Notifications: Tournament & Gate Alerts
self.addEventListener("push", (event) => {
  let data = {
    title: "Abeokuta Polo Festival 2026",
    body: "Tournament countdown alert! Day 1 is 100% Free Public Admission.",
    url: "/programme",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: [
      { action: "open_pass", title: "View My Pass" },
      { action: "open_schedule", title: "View Schedule" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let targetUrl = "/";
  if (event.action === "open_pass") {
    targetUrl = "/register";
  } else if (event.action === "open_schedule") {
    targetUrl = "/programme";
  } else if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
