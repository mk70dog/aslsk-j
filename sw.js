// ── Judge Console Hub / ASL SK Judge : Service Worker ──
// network-first方式：オンライン時は常に最新を取得しキャッシュを更新、
// オフライン時のみキャッシュから返す。

const CACHE_NAME = 'judge-console-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './ASLSK.html',
  './GunJudge.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 同一オリジンのGETリクエストのみ対象（外部フォントCDN等はブラウザの通常キャッシュに任せる）
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
