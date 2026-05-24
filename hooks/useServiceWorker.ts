"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          if (process.env.NODE_ENV === "development") console.error("SW registration failed:", err);
        });
    }
  }, []);
}
