const APP_VERSION = '1.0';
const CACHE_NAME = 'entrenamiento-v' + APP_VERSION;
const urlsToCache = ['./', './inicio.html', './index.html', './Portada.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                }),
            ),
        ),
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
