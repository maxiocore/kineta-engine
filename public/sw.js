// ================================================================
// ASH HOLDING — Production-Grade Service Worker v5
// Strategy: Cache-First (hashed assets), SWR (images/fonts),
//           Network-First (navigation), Skip dev files entirely.
// ================================================================

const CACHE_VERSION = 'v5-production-safe';
const ASSETS_CACHE  = `assets-${CACHE_VERSION}`;
const MEDIA_CACHE   = `media-${CACHE_VERSION}`;
const NOTIFICATION_TAG_PREFIX = 'ashholding-';

// ======================== HELPERS ========================

const isDevFile = (pathname) =>
  pathname.startsWith('/src/') ||
  pathname.includes('/@vite/') ||
  pathname.includes('/.vite/') ||
  pathname.includes('/node_modules/');

const isApiCall = (url) =>
  url.hostname.includes('supabase') ||
  url.hostname.includes('api.') ||
  url.pathname.startsWith('/functions/');

const isHashedAsset = (pathname) =>
  pathname.startsWith('/assets/') &&
  /\.[a-f0-9]{8,}\.(js|mjs|css)$/.test(pathname);

const isImageOrFont = (pathname) =>
  /\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot)$/i.test(pathname);

const isNavigation = (request) =>
  request.mode === 'navigate';

// ======================== INSTALL ========================

self.addEventListener('install', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Installing…`);
  event.waitUntil(self.skipWaiting());
});

// ======================== ACTIVATE ========================

self.addEventListener('activate', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Activating…`);

  event.waitUntil(
    caches.keys().then((keys) => {
      const validCaches = [ASSETS_CACHE, MEDIA_CACHE];
      return Promise.all(
        keys
          .filter((k) => !validCaches.includes(k))
          .map((k) => {
            console.log(`[SW ${CACHE_VERSION}] Purging old cache: ${k}`);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ======================== FETCH ========================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Skip dev files & API calls — let the browser handle them directly
  if (
    url.protocol === 'chrome-extension:' ||
    isDevFile(url.pathname) ||
    isApiCall(url)
  ) {
    return;
  }

  // 2. Navigation → Network-First (always get fresh HTML)
  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3. Hashed Vite assets → Cache-First (immutable, never changes)
  if (isHashedAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(ASSETS_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 4. Images & fonts → Stale-While-Revalidate
  if (isImageOrFont(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(MEDIA_CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // 5. Everything else (manifest.json, robots.txt, etc.) → Network only
  // No caching — avoids stale JS outside /assets/
});

// ======================== PUSH ========================

self.addEventListener('push', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Push received`);

  const defaults = {
    title: 'ASH HOLDING',
    body: 'لديك إشعار جديد',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/dashboard/notifications',
    tag: `${NOTIFICATION_TAG_PREFIX}${Date.now()}`,
  };

  let data = { ...defaults };

  if (event.data) {
    try {
      const p = event.data.json();
      data = {
        title: p.title || p.title_ar || defaults.title,
        body: p.body || p.message || p.message_ar || defaults.body,
        icon: p.icon || defaults.icon,
        badge: p.badge || defaults.badge,
        url: p.url || p.action_url || defaults.url,
        tag: p.tag || `${NOTIFICATION_TAG_PREFIX}${p.id || Date.now()}`,
        requireInteraction: p.requireInteraction === true,
        silent: p.silent === true,
        renotify: p.renotify === true,
        actions: p.actions || [
          { action: 'open', title: 'فتح' },
          { action: 'dismiss', title: 'إغلاق' },
        ],
        image: p.image || null,
        id: p.id,
        type: p.type,
      };
    } catch {
      try { data.body = event.data.text(); } catch {}
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag,
    renotify: data.renotify,
    requireInteraction: data.requireInteraction,
    silent: data.silent,
    vibrate: data.silent ? undefined : [100, 50, 100, 50, 200],
    data: { url: data.url, id: data.id, type: data.type, timestamp: Date.now() },
    actions: data.actions,
    timestamp: Date.now(),
  };

  if (data.image) options.image = data.image;

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ======================== NOTIFICATION CLICK ========================

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss' || event.action === 'close') return;

  const target = event.notification.data?.url || '/dashboard/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (new URL(client.url).origin === self.location.origin) {
          client.navigate?.(target);
          return client.focus?.();
        }
      }
      return clients.openWindow?.(new URL(target, self.location.origin).href);
    })
  );
});

self.addEventListener('notificationclose', () => {});

// ======================== MESSAGE ========================

self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports?.[0]?.postMessage({ version: CACHE_VERSION });
      break;
    case 'SHOW_NOTIFICATION': {
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
    }
    case 'CLEAR_CACHE':
      caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
      break;
  }
});

// ======================== BACKGROUND / PERIODIC SYNC ========================

self.addEventListener('sync', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Sync: ${event.tag}`);
});

self.addEventListener('periodicsync', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Periodic sync: ${event.tag}`);
});

console.log(`[SW ${CACHE_VERSION}] Loaded`);
