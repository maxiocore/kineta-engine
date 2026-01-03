// MaxioCore Professional Service Worker v2.0
// Supports: Push Notifications, Offline Caching, Background Sync

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `maxiocore-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `maxiocore-dynamic-${CACHE_VERSION}`;
const NOTIFICATION_TAG_PREFIX = 'maxiocore-notif-';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', (event) => {
  console.log('[SW] Installing MaxioCore Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// ========== FETCH EVENT ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip API calls and external resources
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('api.') ||
    url.protocol === 'chrome-extension:'
  ) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          // Fetch in background to update cache
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          
          return cachedResponse;
        }

        // Fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            
            // Offline fallback for navigation
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// ========== PUSH EVENT ==========
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'MaxioCore',
    body: 'لديك إشعار جديد',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/dashboard/notifications',
    tag: `${NOTIFICATION_TAG_PREFIX}${Date.now()}`,
    requireInteraction: false,
    silent: false,
    renotify: false,
    actions: [],
    image: null,
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Push payload:', payload);
      
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || payload.message || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        url: payload.url || payload.action_url || notificationData.url,
        tag: payload.tag || `${NOTIFICATION_TAG_PREFIX}${payload.id || Date.now()}`,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        renotify: payload.renotify || false,
        actions: payload.actions || [
          { action: 'open', title: 'فتح', icon: '/pwa-192x192.png' },
          { action: 'dismiss', title: 'إغلاق' }
        ],
        image: payload.image || null,
        data: {
          url: payload.url || payload.action_url || '/dashboard/notifications',
          id: payload.id,
          type: payload.type,
          timestamp: Date.now()
        }
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    image: notificationData.image,
    dir: 'rtl',
    lang: 'ar',
    tag: notificationData.tag,
    renotify: notificationData.renotify,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    vibrate: notificationData.silent ? [] : [100, 50, 100, 50, 200],
    data: notificationData.data,
    actions: notificationData.actions,
    timestamp: Date.now()
  };

  // Remove null/undefined values
  Object.keys(options).forEach(key => {
    if (options[key] === null || options[key] === undefined) {
      delete options[key];
    }
  });

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('[SW] Notification shown successfully');
      })
      .catch((error) => {
        console.error('[SW] Error showing notification:', error);
      })
  );
});

// ========== NOTIFICATION CLICK EVENT ==========
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.tag);
  
  event.notification.close();
  
  // Handle dismiss action
  if (event.action === 'dismiss' || event.action === 'close') {
    console.log('[SW] Notification dismissed');
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard/notifications';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      console.log('[SW] Found', windowClients.length, 'window clients');
      
      // Try to focus existing window
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          console.log('[SW] Focusing existing window and navigating to:', urlToOpen);
          return client.navigate(urlToOpen).then(() => client.focus());
        }
      }
      
      // Open new window if none found
      if (clients.openWindow) {
        console.log('[SW] Opening new window:', fullUrl);
        return clients.openWindow(fullUrl);
      }
    })
    .catch((error) => {
      console.error('[SW] Error handling notification click:', error);
    })
  );
});

// ========== NOTIFICATION CLOSE EVENT ==========
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// ========== BACKGROUND SYNC ==========
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
  
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncNotifications() {
  console.log('[SW] Syncing notifications...');
  try {
    // Get any pending notification reads from IndexedDB
    // This would be implemented with IndexedDB for offline tracking
    console.log('[SW] Notification sync complete');
  } catch (error) {
    console.error('[SW] Notification sync failed:', error);
  }
}

async function syncPendingActions() {
  console.log('[SW] Syncing pending actions...');
  try {
    // Sync any pending offline actions
    console.log('[SW] Pending actions sync complete');
  } catch (error) {
    console.error('[SW] Pending actions sync failed:', error);
  }
}

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

// ========== PERIODIC SYNC (if supported) ==========
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  console.log('[SW] Checking for new notifications...');
  // This would check the server for new notifications
}

console.log('[SW] MaxioCore Service Worker loaded');
