import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);

// ── Lazy-load Adsterra scripts after first paint to keep TTI low ─────────────
function lazyInjectScript(src: string) {
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  document.body.appendChild(s);
}

function loadAds() {
  if ((window as unknown as { __adsLoaded?: boolean }).__adsLoaded) return;
  (window as unknown as { __adsLoaded?: boolean }).__adsLoaded = true;
  // Popunder + Anti-Adblock + Social Bar
  lazyInjectScript("https://pl29201411.profitablecpmratenetwork.com/7a/8c/53/7a8c53c6c60498272065172816436495.js");
  lazyInjectScript("https://bendspecimen.com/7a/8c/53/7a8c53c6c60498272065172816436495.js");
  lazyInjectScript("https://pl29201413.profitablecpmratenetwork.com/28/28/19/282819abe86d26fe79bf180288f8dbc4.js");
}

if (typeof window !== "undefined") {
  const trigger = () => window.setTimeout(loadAds, 1500);
  if (document.readyState === "complete") trigger();
  else window.addEventListener("load", trigger, { once: true });
  // Also load on first user interaction in case `load` fires very late.
  ["pointerdown", "keydown", "scroll"].forEach((evt) =>
    window.addEventListener(evt, loadAds, { once: true, passive: true }),
  );
}
