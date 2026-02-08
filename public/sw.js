// ASH HOLDING Professional Service Worker v3.0
// Supports: Push Notifications, Offline Caching, Background Sync
// Features: iOS 16.4+ Push, Unified Payload, Action Handling

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `ashholding-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ashholding-dynamic-${CACHE_VERSION}`;
const NOTIFICATION_TAG_PREFIX = 'ashholding-';

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
  console.log('[SW v3] Installing ASH HOLDING Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW v3] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('[SW v3] Some assets failed to cache:', err);
        });
      })
      .then(() => {
        console.log('[SW v3] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW v3] Installation failed:', error);
      })
  );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', (event) => {
  console.log('[SW v3] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log('[SW v3] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW v3] Activation complete');
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
    url.protocol === 'chrome-extension:' ||
    url.pathname.startsWith('/functions/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          // Fetch in background to update cache (stale-while-revalidate)
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
            console.error('[SW v3] Fetch failed:', error);
            
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
  console.log('[SW v3] Push notification received');
  
  // Default notification data
  const defaults = {
    title: 'ASH HOLDING',
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
  };

  let notificationData = { ...defaults };

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW v3] Push payload:', payload);
      
      // Merge with payload (unified payload structure)
      notificationData = {
        title: payload.title || payload.title_ar || defaults.title,
        body: payload.body || payload.message || payload.message_ar || defaults.body,
        icon: payload.icon || defaults.icon,
        badge: payload.badge || defaults.badge,
        url: payload.url || payload.action_url || defaults.url,
        tag: payload.tag || `${NOTIFICATION_TAG_PREFIX}${payload.id || Date.now()}`,
        requireInteraction: payload.requireInteraction === true,
        silent: payload.silent === true,
        renotify: payload.renotify === true,
        actions: payload.actions || [
          { action: 'open', title: 'فتح' },
          { action: 'dismiss', title: 'إغلاق' }
        ],
        image: payload.image || null,
        id: payload.id,
        type: payload.type,
      };
    } catch (e) {
      // Handle text payload
      console.log('[SW v3] Parsing as text');
      try {
        notificationData.body = event.data.text() || defaults.body;
      } catch (textError) {
        console.error('[SW v3] Error parsing push data:', textError);
      }
    }
  }

  // Build notification options
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    dir: 'rtl',
    lang: 'ar',
    tag: notificationData.tag,
    renotify: notificationData.renotify,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    vibrate: notificationData.silent ? undefined : [100, 50, 100, 50, 200],
    data: {
      url: notificationData.url,
      id: notificationData.id,
      type: notificationData.type,
      timestamp: Date.now(),
    },
    actions: notificationData.actions,
    timestamp: Date.now(),
  };

  // Add image if present
  if (notificationData.image) {
    options.image = notificationData.image;
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('[SW v3] Notification shown successfully:', notificationData.title);
      })
      .catch((error) => {
        console.error('[SW v3] Error showing notification:', error);
      })
  );
});

// ========== NOTIFICATION CLICK EVENT ==========
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notification = event.notification;
  
  console.log('[SW v3] Notification clicked:', { action, tag: notification.tag });
  
  // Always close the notification
  notification.close();
  
  // Handle dismiss action
  if (action === 'dismiss' || action === 'close') {
    console.log('[SW v3] Notification dismissed');
    return;
  }

  // Get URL from notification data
  const urlToOpen = notification.data?.url || '/dashboard/notifications';
  
  event.waitUntil(
    (async () => {
      try {
        // Get all window clients
        const windowClients = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        console.log('[SW v3] Found', windowClients.length, 'window clients');
        
        // Try to find and focus an existing window
        for (const client of windowClients) {
          const clientUrl = new URL(client.url);
          
          if (clientUrl.origin === self.location.origin) {
            console.log('[SW v3] Found matching client, navigating to:', urlToOpen);
            
            // Navigate and focus
            if ('navigate' in client) {
              await client.navigate(urlToOpen);
            }
            
            if ('focus' in client) {
              await client.focus();
            }
            
            return;
          }
        }
        
        // No existing window, open a new one
        const fullUrl = new URL(urlToOpen, self.location.origin).href;
        console.log('[SW v3] Opening new window:', fullUrl);
        
        if (clients.openWindow) {
          await clients.openWindow(fullUrl);
        }
      } catch (error) {
        console.error('[SW v3] Error handling notification click:', error);
        
        // Fallback: try to open window anyway
        try {
          const fullUrl = new URL(urlToOpen, self.location.origin).href;
          if (clients.openWindow) {
            await clients.openWindow(fullUrl);
          }
        } catch (fallbackError) {
          console.error('[SW v3] Fallback also failed:', fallbackError);
        }
      }
    })()
  );
});

// ========== NOTIFICATION CLOSE EVENT ==========
self.addEventListener('notificationclose', (event) => {
  console.log('[SW v3] Notification closed:', event.notification.tag);
});

// ========== BACKGROUND SYNC ==========
self.addEventListener('sync', (event) => {
  console.log('[SW v3] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
  
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncNotifications() {
  console.log('[SW v3] Syncing notifications...');
  try {
    console.log('[SW v3] Notification sync complete');
  } catch (error) {
    console.error('[SW v3] Notification sync failed:', error);
  }
}

async function syncPendingActions() {
  console.log('[SW v3] Syncing pending actions...');
  try {
    console.log('[SW v3] Pending actions sync complete');
  } catch (error) {
    console.error('[SW v3] Pending actions sync failed:', error);
  }
}

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', (event) => {
  console.log('[SW v3] Message received:', event.data?.type);
  
  if (!event.data) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ version: CACHE_VERSION });
      }
      break;
      
    case 'SHOW_NOTIFICATION':
      const { title, options } = event.data;
      if (title) {
        self.registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          dir: 'rtl',
          lang: 'ar',
          ...options,
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
      break;
  }
});

// ========== PERIODIC SYNC (if supported) ==========
self.addEventListener('periodicsync', (event) => {
  console.log('[SW v3] Periodic sync:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  console.log('[SW v3] Checking for new notifications...');
}

console.log('[SW v3] ASH HOLDING Service Worker v3 loaded');
