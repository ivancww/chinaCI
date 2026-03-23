/* * Service Worker 脚本 (v2.11 强制更新版)
 * 提供离线缓存功能，实现 PWA 原生 App 体验
 */

// ⚠️ 重点：每次您更新了 HTML 或 JS 代码，都必须修改这里的版本号！
// 这样浏览器才会知道有新版本，从而触发 index.html 中的强制刷新机制。
const CACHE_NAME = 'tot-vault-v2.11';

const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './manifest.json',
  
  // 如果加入了 Logo 请解开下方注释
  // './logo-192.png',
  // './logo-512.png',
  
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://i.postimg.cc/mDhxFT8W/癌症方案A.jpg',
  'https://i.postimg.cc/ydWqS7v4/癌症方案B.jpg',
  'https://i.postimg.cc/3RWMD3nH/重疾三合一.jpg',
  'https://i.postimg.cc/RFqrnvXr/重疾賠完后.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // 强制安装完成后立刻接管，这是触发无感强制更新的关键！
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // 忽略 API 请求的缓存（如实时汇率）
  if (event.request.url.includes('open.er-api.com')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          function(response) {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      }).catch(() => {
        console.log('[Service Worker] Fetch failed, offline mode.');
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除所有旧版本的缓存
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 接管所有的受控客户端页面
  self.clients.claim();
});