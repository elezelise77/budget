// 홈 화면에 추가했을 때 오프라인에서도 화면이 뜨도록 서비스워커를 등록한다.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").catch(function (e) {
      console.warn("service worker 등록 실패", e);
    });
  });
}
