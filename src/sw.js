import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Supabase: sempre NetworkFirst
registerRoute(
  ({ url }) => url.hostname.includes("supabase.co"),
  new NetworkFirst({ cacheName: "supabase-cache", networkTimeoutSeconds: 5 })
);

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: "Stickframe", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || "Stickframe", {
      body: data.body || "",
      icon: data.icon || "/logo-transparente-122x122.png",
      badge: data.badge || "/logo-transparente-122x122.png",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const match = wins.find((w) => w.url.includes(url));
      if (match) return match.focus();
      return clients.openWindow(url);
    })
  );
});
