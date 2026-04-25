/**
 * Listens for the v-a-u-l-t key sequence anywhere in the app and fires
 * a window-level "vault-easter-egg" event. A modal in App.tsx subscribes.
 */

import { useEffect } from "react";

export function useVaultSequence(onTrigger: () => void) {
  useEffect(() => {
    const target = "vault";
    let buffer = "";
    function onKey(e: KeyboardEvent) {
      // Ignore typing in inputs
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      buffer = (buffer + e.key.toLowerCase()).slice(-target.length);
      if (buffer === target) {
        onTrigger();
        buffer = "";
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTrigger]);
}
