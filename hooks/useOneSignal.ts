"use client";

import { useEffect } from "react";
import { saveNotificationToken } from "@/lib/actions/notifications";

export function useOneSignal() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    // Dynamically load OneSignal SDK
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        await OneSignal.init({
          appId,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });

        // Request permission
        await OneSignal.Notifications.requestPermission();

        // Get and save the player/subscription ID
        const subId = await OneSignal.User.PushSubscription.id;
        if (subId) {
          await saveNotificationToken(subId);
        }
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);
}