// 앱 껍데기(HTML/JS/CSS/폰트)만 캐시한다. 가계부 데이터는 캐시하지 않는다.
var CACHE = "hh-shell-1.0.0-mtm7s27g";
var SHELL = ["./", "./index.html", "./app.js", "./styles.css", "./boot.js", "./sw-register.js", "./manifest.json", "./vendor/fonts.css", "./vendor/react.production.min.js", "./vendor/react-dom.production.min.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;  // 구글 통신은 건드리지 않는다
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) { return hit || caches.match("./index.html"); });
    })
  );
});
