/* * Service Worker 腳本 (v2.8 私域 CRM 旗艦版) */

const CACHE_NAME = 'tot-vault-v2.8'; // 更新版本號以強制刷新快取

const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://i.postimg.cc/mDhxFT8W/癌症方案A.jpg',
  'https://i.postimg.cc/ydWqS7v4/癌症方案B.jpg',
  'https://i.postimg.cc/3RWMD3nH/重疾三合一.jpg',
  'https://i.postimg.cc/RFqrnvXr/重疾賠完后.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('open.er-api.com')) return;
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});