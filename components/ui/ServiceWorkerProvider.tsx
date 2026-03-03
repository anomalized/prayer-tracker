"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";

export default function ServiceWorkerProvider() {
  useServiceWorker();
  return null;
}
