// Service Worker for Offline Support
// Caches the app bundle so it can load offline

const CACHE_NAME = 'delivery-executive-v1';

// Log that service worker is loading
console.log('[SW] Service Worker script loaded');

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache opened:', CACHE_NAME);
        // Cache the main page and app shell
        return cache.addAll([
          '/',
          '/jkhm/delivery-executive',
          '/index.html'
        ]).catch((err) => {
          console.log('[SW] Some files failed to cache during install:', err);
          // Continue even if some files fail
          return Promise.resolve();
        });
      })
      .catch((err) => {
        console.error('[SW] Install error:', err);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Existing caches:', cacheNames);
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API requests (let them fail, we handle that in the app)
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('/delivery-executives/') || 
      url.pathname.includes('/ai-routes/')) {
    return;
  }

  // Handle page navigation requests
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the page
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
              console.log('[SW] Cached page:', event.request.url);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline - try to serve from cache
          console.log('[SW] Offline, trying cache for:', event.request.url);
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[SW] Serving from cache:', event.request.url);
                return cachedResponse;
              }
              // Try to return any cached page
              return caches.match('/')
                .then((homePage) => {
                  if (homePage) {
                    console.log('[SW] Serving home page from cache');
                    return homePage;
                  }
                  return caches.match('/jkhm/delivery-executive');
                });
            });
        })
    );
    return;
  }

  // Handle other resources (JS, CSS, images, etc.)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            console.log('[SW] Cached resource:', event.request.url);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline - serve from cache
        console.log('[SW] Offline, serving from cache:', event.request.url);
        return caches.match(event.request);
      })
  );
});
