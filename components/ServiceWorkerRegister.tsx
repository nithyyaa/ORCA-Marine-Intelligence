"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.log(
        "ORCA: Service Workers are not supported."
      );
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

        console.log(
          "ORCA Service Worker registered:",
          registration.scope
        );
      } catch (error) {
        console.error(
          "ORCA Service Worker registration failed:",
          error
        );
      }
    };

    if (document.readyState === "loading") {
      window.addEventListener(
        "load",
        registerServiceWorker,
        { once: true }
      );

      return () => {
        window.removeEventListener(
          "load",
          registerServiceWorker
        );
      };
    }

    // Page has already loaded
    registerServiceWorker();
  }, []);

  return null;
}