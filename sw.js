const CACHE_NAME = 'story-app-v1';
const RUNTIME_CACHE = 'story-app-runtime-v1';
const API_CACHE = 'story-app-api-v1';

// Assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/app.css',
  '/favicon.png',
  '/images/logo.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Cache install error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return;

  // API requests - Network First with cache fallback
  if (url.hostname === 'story-api.dicoding.dev' || url.pathname.includes('/v1/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response for cache
          const responseToCache = response.clone();
          if (response.ok) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Return offline fallback for API
            return new Response(
              JSON.stringify({ error: true, message: 'Offline - data dari cache' }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((response) => {
        // Don't cache if not ok
        if (!response.ok) return response;
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    if (event.data) {
      payload = event.data.json ? event.data.json() : JSON.parse(event.data.text() || '{}');
    }
  } catch (e) {
    console.error('Push payload parse error:', e);
  }

  // Try to extract storyId from body or data
  let storyId = payload?.data?.storyId;
  if (!storyId && payload?.options?.body) {
    // Try to extract from body text if contains story ID pattern
    const bodyMatch = payload.options.body.match(/story[_-]?id[:\s]+([a-zA-Z0-9_-]+)/i);
    if (bodyMatch) storyId = bodyMatch[1];
  }

  const title = payload?.title || 'Notifikasi Story';
  const options = {
    body: payload?.options?.body || 'Ada pembaruan cerita baru.',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'story-notification',
    data: {
      ...payload?.data,
      storyId: storyId || payload?.data?.storyId,
      url: storyId ? `/#/detail/${storyId}` : '/#/',
    },
    requireInteraction: false,
    actions: storyId
      ? [
          {
            action: 'view',
            title: 'Lihat Detail',
          },
        ]
      : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action button click
  if (event.action === 'view' || !event.action) {
    const storyId = event.notification.data?.storyId;
    const urlToOpen = event.notification.data?.url || (storyId ? `/#/detail/${storyId}` : '/#/');

    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If window is already open, focus it and post message to navigate
          for (const client of clientList) {
            if (client.url && 'focus' in client) {
              client.focus();
              // Post message to navigate
              if (client.postMessage) {
                client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
              }
              return;
            }
          }
          // Otherwise open new window
          if (self.clients.openWindow) {
            const fullUrl = new URL(urlToOpen, self.location.origin).href;
            return self.clients.openWindow(fullUrl);
          }
        })
    );
  }
});

// Background sync (for offline data sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncStories());
  }
});

async function syncStories() {
  // This will be called from IndexedDB sync module
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_STORIES' });
  });
}

// Message handler for IndexedDB sync
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
