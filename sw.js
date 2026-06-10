const CACHE_NAME = 'gestor-tareas-hepa-v5';
const urlsToCache = [
  '/',
  'index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@phosphor-icons/web',
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth-compat.js',
  'https://unpkg.com/html5-qrcode',
  'https://cdn.quilljs.com/1.3.6/quill.snow.css',
  'https://cdn.quilljs.com/1.3.6/quill.min.js',
  'img/hapa_192.png',
  'img/hapa_512.png'
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

  event.respondWith(
    fetch(event.request).then(response => {
      const resClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});