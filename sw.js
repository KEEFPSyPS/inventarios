const CACHE_NAME = 'gestor-tareas-hepa-v8';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './img/hapa_48.png',
  './img/hapa_72.png',
  './img/hapa_96.png',
  './img/hapa_144.png',
  './img/hapa_192.png',
  './img/hapa_512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto y listo.');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Omitir peticiones que no sean http/https
  if (!event.request.url.startsWith('http')) return;

  // Estrategia Network-First ESTRICTA para la navegación (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      const resClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});

// Escuchar mensajes desde la página para mostrar notificaciones
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: './img/hapa_192.png',
      badge: './img/hapa_96.png',
      vibrate: [200, 100, 200],
      requireInteraction: true
    });
  }
});
