const CACHE_NAME = "lge42-cache-v1";
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/style.css',
    '/script-extension-final-clean.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/data/heatmap.json',
    '/data/pastResults.json',
    '/data/purchaseHistory.json',
    '/data/rawHistoryList.json',
    '/data/generateNumber.json',
    '/data/getHistoryPattern.json'
];


self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});