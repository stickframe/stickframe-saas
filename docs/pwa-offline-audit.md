# PWA / Offline Audit — StickFrame™ SaaS

Date: 2026-06-27

## Current Setup

| Feature | Status | Details |
|---------|--------|---------|
| Service Worker | ✅ Active | `src/sw.js`, built via `vite-plugin-pwa` |
| Precaching | ✅ | 122 entries (7.0 MiB) — all build assets |
| Supabase API | ✅ NetworkFirst | Timeout 5s, cache name `supabase-cache` |
| JS/CSS chunks | ✅ StaleWhileRevalidate | Cache name `assets-cache` |
| Push notifications | ✅ | Handler for push + notificationclick |
| Install prompt | ✅ | `PWAInstallBanner` component |
| Offline page | ❌ Not implemented | No fallback for offline navigation |
| Background sync | ❌ Not implemented | No sync manager for pending mutations |
| Conflict resolution | ❌ Not implemented | No last-write-wins or CRDT |

## Cache Strategies

### Current (good)
- **Build assets**: StaleWhileRevalidate — serve from cache, fetch new in background
- **Supabase API**: NetworkFirst — always try network first, fallback to cache

### Missing (recommended)
- **Navigation requests**: NetworkFirst with offline fallback page
- **User uploads**: Background sync queue when offline
- **Realtime connections**: Reconnect with exponential backoff

## Offline Capabilities

### What works offline
- Previously loaded JS/CSS chunks (StaleWhileRevalidate serves from cache)
- Previously loaded Supabase data (if cached by NetworkFirst)

### What breaks offline
- **Navigation**: No offline fallback page — user sees browser error
- **Form submissions**: Lost if user submits while offline
- **File uploads**: Not queued for background sync
- **Realtime**: Subscription lost, no visible reconnect indicator

## Recommendations

### Priority 1 — Offline fallback page
- Add a catch-all route that serves a cached offline page
- `registerRoute(({ request }) => request.mode === "navigate", new NetworkFirst({ ... }))`

### Priority 2 — Background sync
- Register a sync event in service worker for form submissions
- Queue pending mutations in IndexedDB
- Replay on `sync` event

### Priority 3 — Conflict detection
- Use `updated_at` timestamps for optimistic concurrency
- Show conflict resolution UI when server version is newer

### Priority 4 — Connectivity indicator
- Add a `navigator.onLine` event listener
- Show banner when offline
- Auto-dismiss when back online

## Implementation Reference

```js
// Background sync registration (in main app)
navigator.serviceWorker.ready.then((reg) => {
  if ("sync" in reg) {
    reg.sync.register("sync-pending-mutations");
  }
});

// In service worker
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-mutations") {
    event.waitUntil(processPendingMutations());
  }
});
```
