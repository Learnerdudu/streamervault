import { useEffect, useRef } from "react";

/**
 * Adsterra Native Banner.
 * Loads the invoke.js script once and renders into the fixed container ID.
 */
export function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Avoid double-injecting on hot reloads / re-mounts
    if (containerRef.current.querySelector("script[data-adsterra-native]")) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-adsterra-native", "true");
    script.src =
      "https://pl29201412.profitablecpmratenetwork.com/e0ad279a7ae6c39a5045610de834d246/invoke.js";
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div ref={containerRef} className="w-full my-8 min-h-[100px]">
      <div id="container-e0ad279a7ae6c39a5045610de834d246" />
    </div>
  );
}
