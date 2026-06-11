const CACHE = 'navaja-v6';
const URLS = [
    '/',
    '/index.html',
    '/landing.html',
    '/styles.css',
    '/app.js',
    '/home.js',
    '/tasks.js',
    '/notes.js',
    '/expenses.js',
    '/split.js',
    '/manifest.json',
    '/icon-new.svg',
    '/icon-192.png',
    '/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(URLS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'NOTIFICATION') {
    self.registration.showNotification(event.data.title, event.data.options).catch(() => {});
  }
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
