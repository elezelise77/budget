// 화면이 하얗게 뜨는 대신 원인을 보여주기 위한 최소한의 오류 표시기.
(function () {
  function showFatalError(title, detail) {
    var el = document.getElementById("root");
    if (!el) return;
    var box = document.createElement("div");
    box.style.cssText = "max-width:640px;margin:40px auto;padding:20px 24px;border:1px solid #f3c9c0;background:#fdf3f1;border-radius:12px;font-family:sans-serif;";
    var h = document.createElement("div");
    h.style.cssText = "font-weight:700;color:#ac4636;margin-bottom:8px;";
    h.textContent = "⚠️ " + title;
    var pre = document.createElement("pre");
    pre.style.cssText = "white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.6;color:#585b66;margin:0;font-family:ui-monospace,monospace;";
    pre.textContent = String(detail);
    box.appendChild(h);
    box.appendChild(pre);
    el.innerHTML = "";
    el.appendChild(box);
  }
  window.addEventListener("error", function (e) {
    showFatalError("실행 중 오류가 발생했어요", (e.error && (e.error.stack || e.error.message)) || e.message || e);
  });
  window.addEventListener("unhandledrejection", function (e) {
    console.error("unhandled rejection", e.reason);
  });
})();
