/* * Service Worker 腳本 (v2.7 私域 CRM 旗艦版)
 * 提供離線緩存功能，並支持強制更新機制
 */

// 每次代碼重大更新時，請修改此版本號 (例如 v2.6 -> v2.7)
const CACHE_NAME = 'tot-vault-v2.7';

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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 正在安裝新版本快取:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // 強制讓新 Service Worker 立即進入 active 狀態
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 刪除過期快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即接管頁面控制權
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // 排除匯率 API，確保獲取最新數據
  if (event.request.url.includes('open.er-api.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            // 動態快取新資源 (如未列出的圖片)
            if(event.request.url.startsWith('http')) {
                cache.put(event.request, fetchRes.clone());
            }
            return fetchRes;
          });
        });
      }).catch(() => {
        console.log('[Service Worker] 離線模式，未找到資源');
      })
  );
});