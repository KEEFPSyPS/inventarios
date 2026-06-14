// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// --- Cache Logic ---
const CACHE_NAME = 'gestor-tareas-hepa-v8'; // v8 - PWA completa con iconos
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
  self.skipWaiting(); // Obliga al nuevo Service Worker a instalarse de inmediato
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
  self.clients.claim(); // Toma el control de las páginas abiertas inmediatamente
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Omitir peticiones que no sean http/https (como extensiones del navegador)
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

// --- Firebase Messaging Logic ---
const firebaseConfig = {
  apiKey: "AIzaSyBvZepD2QxQIYD9whn6QcLu00hbHbIAXjA",
  authDomain: "rifahepa-c1a75.firebaseapp.com",
  projectId: "rifahepa-c1a75",
  storageBucket: "rifahepa-c1a75.firebasestorage.app",
  messagingSenderId: "319515414583",
  appId: "1:319515414583:web:21d5ce147da4afb981afb2"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || './img/hapa_192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});