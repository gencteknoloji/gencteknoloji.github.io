"use client";

import { useEffect } from "react";

export function PwaProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) console.log("Service worker unregistered successfully");
          });
        }
      });
    }

    if (window.caches) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
  }, []);

  return null;
}
