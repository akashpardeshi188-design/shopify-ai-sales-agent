(function () {
  var currentScript = document.currentScript;
  var widgetKey = currentScript.getAttribute("data-key");
  if (!widgetKey) return;

  var appOrigin = new URL(currentScript.src).origin;
  var isOpen = false;

  var button = document.createElement("button");
  button.setAttribute("aria-label", "Open chat");
  button.textContent = "Chat";
  button.style.cssText = [
    "position:fixed",
    "bottom:20px",
    "right:20px",
    "z-index:2147483000",
    "width:56px",
    "height:56px",
    "border-radius:50%",
    "background:#18181b",
    "color:#fff",
    "border:none",
    "cursor:pointer",
    "font-size:12px",
    "font-family:sans-serif",
    "box-shadow:0 4px 14px rgba(0,0,0,.25)",
  ].join(";");

  var iframe = document.createElement("iframe");
  iframe.src = appOrigin + "/widget/" + widgetKey;
  iframe.title = "Chat with us";
  iframe.style.cssText = [
    "position:fixed",
    "bottom:88px",
    "right:20px",
    "width:360px",
    "height:520px",
    "max-height:70vh",
    "border:none",
    "border-radius:12px",
    "box-shadow:0 8px 30px rgba(0,0,0,.25)",
    "z-index:2147483000",
    "display:none",
    "background:#fff",
  ].join(";");

  button.addEventListener("click", function () {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? "block" : "none";
  });

  document.body.appendChild(iframe);
  document.body.appendChild(button);
})();
