"use client";

import { useOneSignal } from "@/hooks/useOneSignal";

export default function OneSignalProvider() {
  useOneSignal();
  return null;
}