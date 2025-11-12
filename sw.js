const CACHE_NAME = 'story-app-v1';
const RUNTIME_CACHE = 'story-app-runtime-v1';
const API_CACHE = 'story-app-api-v1';

// Get base path from service worker scope for GitHub Pages compatibility
function getBasePath() {
  try {
    // Try to get from registration scope first (available after activation)
    if (self.registration && self.registration.scope) {
      const url = new URL(self.registration.scope);
      return url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
    }
    // Fallback to location (available during install)
    if (self.location && self.location.pathname) {
      const path = self.location.pathname;
      // Remove sw.js from path to get base directory
      const basePath = path.substring(0, path.lastIndexOf('/') + 1);
      return basePath || '/';
    }
  } catch (e) {
    console.error('Error getting base path:', e);
  }
  return '/';
}

// Assets to cache on install (app shell) - use relative paths
const getStaticAssets = () => {
  const basePath = getBasePath();
  const assets = [
    basePath,
    `${basePath}index.html`,
    `${basePath}app.bundle.js`,
    `${basePath}app.css`,
    `${basePath}favicon.png`,
    `${basePath}icon-192x192.png`,
    `${basePath}icon-512x512.png`,
    `${basePath}icon-96x96.png`,
    `${basePath}images/logo.png`,
    `${basePath}manifest.json`,
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  ];
  // Clean up double slashes
  return assets.map(url => url.replace(/([^:]\/)\/+/g, '$1'));
};

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  console.log('Service Worker location:', self.location?.href);
  const staticAssets = getStaticAssets();
  console.log('Base path:', getBasePath());
  console.log('Assets to cache:', staticAssets);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache assets, but don't fail if some are missing
      return Promise.allSettled(
        staticAssets.map(url => 
          cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err.message);
            return null;
          })
        )
      ).then(() => {
        console.log('Service Worker cache installation completed');
      });
    }).catch((err) => {
      console.error('Cache installation failed:', err);
      // Still allow service worker to activate
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
  const showNotification = async () => {
    let payload = {};
    
    // Parse payload
    try {
      if (event.data) {
        if (typeof event.data.json === 'function') {
          payload = event.data.json();
        } else if (typeof event.data.text === 'function') {
          const text = event.data.text();
          payload = JSON.parse(text || '{}');
        } else {
          // Try to get as array buffer and convert
          try {
            const buffer = await event.data.arrayBuffer();
            const text = new TextDecoder().decode(buffer);
            payload = JSON.parse(text || '{}');
          } catch {
            payload = {};
          }
        }
      }
    } catch (e) {
      console.error('Push payload parse error:', e);
      payload = {};
    }

    // Try to extract storyId from body or data
    let storyId = payload?.data?.storyId || payload?.storyId;
    if (!storyId && payload?.options?.body) {
      // Try to extract from body text if contains story ID pattern
      const bodyMatch = payload.options.body.match(/story[_-]?id[:\s]+([a-zA-Z0-9_-]+)/i);
      if (bodyMatch) storyId = bodyMatch[1];
    }

    const title = payload?.title || 'Notifikasi Story';
    const body = payload?.options?.body || payload?.body || 'Ada pembaruan cerita baru.';
    
    // Get base path from service worker scope for GitHub Pages compatibility
    const getBasePath = () => {
      // Service worker scope ends with /, so we can use it directly
      const scope = self.registration.scope;
      // Remove protocol and domain, keep only path
      try {
        const url = new URL(scope);
        return url.pathname;
      } catch {
        return '/';
      }
    };
    const basePath = getBasePath();
    
    const options = {
      body: body,
      icon: `${basePath}favicon.png`.replace('//', '/'),
      badge: `${basePath}favicon.png`.replace('//', '/'),
      tag: 'story-notification',
      data: {
        ...payload?.data,
        storyId: storyId || payload?.data?.storyId,
        url: storyId ? `${basePath}#/detail/${storyId}` : `${basePath}#/`,
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

    try {
      await self.registration.showNotification(title, options);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };
  
  event.waitUntil(showNotification());
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action button click
  if (event.action === 'view' || !event.action) {
    const storyId = event.notification.data?.storyId;
    // Get base path from service worker scope
    const getBasePath = () => {
      try {
        const url = new URL(self.registration.scope);
        return url.pathname;
      } catch {
        return '/';
      }
    };
    const basePath = getBasePath();
    const urlToOpen = event.notification.data?.url || (storyId ? `${basePath}#/detail/${storyId}` : `${basePath}#/`);

    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If window is already open, focus it and post message to navigate
          for (const client of clientList) {
            if (client.url && 'focus' in client) {
              client.focus();
              // Post message to navigate - use hash path only
              if (client.postMessage) {
                const hashPath = urlToOpen.includes('#') ? urlToOpen.split('#')[1] : '/';
                client.postMessage({ type: 'NAVIGATE', url: `#${hashPath}` });
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
        .catch((error) => {
          console.error('Error handling notification click:', error);
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
