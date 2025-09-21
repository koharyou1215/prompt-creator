const CACHE_NAME = 'prompt-creator-v1.0.0';
const urlsToCache = [
  '/',
  '/workspace',
  '/templates',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prompts') {
    event.waitUntil(syncPrompts());
  }
});

async function syncPrompts() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();

    // Filter for pending prompt saves
    const pendingPrompts = requests.filter(req =>
      req.url.includes('/api/prompts') && req.method === 'POST'
    );

    // Retry sending each pending prompt
    for (const request of pendingPrompts) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Failed to sync prompt:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '新しい通知があります',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '開く',
        icon: '/icon-72x72.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Prompt Creator', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-prompts') {
    event.waitUntil(updatePrompts());
  }
});

async function updatePrompts() {
  try {
    const response = await fetch('/api/prompts/sync');
    const data = await response.json();

    // Update cache with new data
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/api/prompts', new Response(JSON.stringify(data)));

    console.log('Prompts updated successfully');
  } catch (error) {
    console.error('Failed to update prompts:', error);
  }
}