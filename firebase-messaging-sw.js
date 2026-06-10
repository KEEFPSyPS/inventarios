// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// --- Cache Logic ---
const CACHE_NAME = 'gestor-tareas-hepa-v5'; // Forzado absoluto v5
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@phosphor-icons/web',
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js',
  'https://unpkg.com/html5-qrcode',
  'https://cdn.quilljs.com/1.3.6/quill.snow.css',
  'https://cdn.quilljs.com/1.3.6/quill.min.js',
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
  
  let fetchRequest = event.request;
  // Evitar agresivamente que el navegador devuelva el HTML viejo de su memoria interna
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    fetchRequest = new Request(event.request.url, { cache: 'no-store' });
  }

  event.respondWith(
    fetch(fetchRequest).then(response => {
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