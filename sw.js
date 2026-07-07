const CACHE_NAME = "vegalta-tracker-v10";
const ASSETS = ["./", "./index.html", "./app.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // このアプリ自身の静的ファイル（同一オリジン・GET）だけをキャッシュ対象にする。
  // Firestoreのリアルタイム通信やGoogleログインなど、他ドメインへの通信は
  // 一切横取りせずそのままネットワークに流す（横取りすると接続が壊れて再接続ループになるため）。
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return; // respondWithを呼ばない＝ブラウザの通常動作に任せる
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
