"use client";

import { useEffect } from "react";

// Registers the service worker for offline shell support. Renders nothing.
export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return null;
}
