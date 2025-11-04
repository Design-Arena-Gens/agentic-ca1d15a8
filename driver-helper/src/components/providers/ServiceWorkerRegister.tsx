"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register("/service-worker.js");
        } catch (error) {
          console.error("Service worker registration failed", error);
        }
      };
      register();
    }
  }, []);

  return null;
}
