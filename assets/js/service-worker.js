/**
 * ============================================================
 * APNABITE V1 — SERVICE WORKER
 * File: service-worker.js
 * ============================================================
 */

const CACHE_PREFIX = 'apnabite-';
const STATIC_CACHE = CACHE_PREFIX + 'static-v1';
const PAGE_CACHE = CACHE_PREFIX + 'pages-v1';

const APP_SHELL_FILES = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/css/core.css',
  './assets/css/components.css',
  './assets/js/core.js',
  './assets/js/api.js',
  './assets/js/ui.js',
  './assets/js/auth.js',
  './assets/images/logo.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(function(cache) {
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches
      .keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            const isApnaBiteCache =
              cacheName.indexOf(CACHE_PREFIX) === 0;

            const isCurrentCache =
              cacheName === STATIC_CACHE ||
              cacheName === PAGE_CACHE;

            if (
              isApnaBiteCache &&
              !isCurrentCache
            ) {
              return caches.delete(cacheName);
            }

            return Promise.resolve(false);
          })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function(event) {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  if (
    requestUrl.origin !==
    self.location.origin
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstPage(request)
    );

    return;
  }

  if (
    isStaticAsset(requestUrl.pathname)
  ) {
    event.respondWith(
      staleWhileRevalidate(request)
    );
  }
});

function networkFirstPage(request) {
  return fetch(request)
    .then(function(networkResponse) {
      if (
        networkResponse &&
        networkResponse.ok
      ) {
        const responseCopy =
          networkResponse.clone();

        caches
          .open(PAGE_CACHE)
          .then(function(cache) {
            cache.put(
              request,
              responseCopy
            );
          });
      }

      return networkResponse;
    })
    .catch(function() {
      return caches
        .match(request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }

          return caches.match(
            './offline.html'
          );
        });
    });
}

function staleWhileRevalidate(request) {
  return caches
    .match(request)
    .then(function(cachedResponse) {
      const networkRequest = fetch(request)
        .then(function(networkResponse) {
          if (
            networkResponse &&
            networkResponse.ok
          ) {
            const responseCopy =
              networkResponse.clone();

            caches
              .open(STATIC_CACHE)
              .then(function(cache) {
                cache.put(
                  request,
                  responseCopy
                );
              });
          }

          return networkResponse;
        })
        .catch(function() {
          return cachedResponse;
        });

      return cachedResponse ||
        networkRequest;
    });
}

function isStaticAsset(pathname) {
  return (
    pathname.indexOf('/assets/') !== -1 ||
    pathname.endsWith(
      '/manifest.webmanifest'
    )
  );
}

self.addEventListener('message', function(event) {
  const data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'CLEAR_APP_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then(function(cacheNames) {
          return Promise.all(
            cacheNames
              .filter(function(cacheName) {
                return (
                  cacheName.indexOf(
                    CACHE_PREFIX
                  ) === 0
                );
              })
              .map(function(cacheName) {
                return caches.delete(
                  cacheName
                );
              })
          );
        })
    );
  }
});
