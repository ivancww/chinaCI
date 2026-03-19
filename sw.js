/* * Service Worker 腳本 (v2.6 私域 CRM 旗艦版)
 * 提供離線緩存功能，實現 PWA 原生 App 體驗
 */

const CACHE_NAME = 'tot-vault-v2.6';

// 這裡列出所有需要被緩存，以便離線時能秒開的資源
const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './manifest.json',
  
  // 如果您已經生成了這兩個 Logo 圖片，請取消下面兩行的註釋
  // './logo-192.png',
  // './logo-512.png',
  
  // 緩存外部的 QRCode 庫，確保離線也能生成二維碼
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',

  // 緩存您新加入的四大圖解圖片
  'https://i.postimg.cc/mDhxFT8W/癌症方案A.jpg',
  'https://i.postimg.cc/ydWqS7v4/癌症方案B.jpg',
  'https://i.postimg.cc/3RWMD3nH/重疾三合一.jpg',
  'https://i.postimg.cc/RFqrnvXr/重疾賠完后.jpg'
];

// 1. 安裝階段：下載並緩存核心資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // 強制立即接管控制權
  self.skipWaiting();
});

// 2. 攔截請求階段：優先使用緩存 (Cache-First 策略)
self.addEventListener('fetch', event => {
  // 針對匯率 API 等動態數據，我們不應該緩存，直接放行 (Network Only)
  if (event.request.url.includes('open.er-api.com')) {
    return; // 讓瀏覽器正常發起網絡請求
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果緩存有匹配的資源，直接返回緩存 (達到秒開效果)
        if (response) {
          return response;
        }
        // 否則發起網絡請求，並嘗試將新資源加入緩存 (可選)
        return fetch(event.request).then(
          function(response) {
            // 檢查是否收到有效的響應
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 複製響應流，因為響應流只能被使用一次
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      }).catch(() => {
        // 如果離線且找不到緩存的資源，可以在這裡返回一個預設的離線頁面或圖片
        console.log('[Service Worker] Fetch failed, offline mode.');
      })
  );
});

// 3. 激活階段：清理舊版本的緩存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 確保 Service Worker 立即控制所有的客戶端頁面
  self.clients.claim();
});