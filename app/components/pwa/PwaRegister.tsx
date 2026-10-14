"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that powers install + offline. Runs in
 * production only — a service worker in `next dev` fights Turbopack's HMR and
 * can serve stale chunks. Test the installable build with `next build && start`.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // A worker left over from a local production build keeps serving its
      // cached chunks under `next dev`, hiding new code — clear it out.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
        if (regs.length) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      });
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app still works online.
      });
    };

    // Wait for load so the SW install doesn't compete with first paint.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
