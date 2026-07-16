"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only — a SW in dev would cache
 * Turbopack's HMR assets and produce confusing stale reloads.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failure is non-fatal: the site works without offline support.
      });
    };

    // This effect runs after hydration, which is usually *after* window's load
    // event has already fired — listening for it unconditionally would never
    // register. Only wait when the document is genuinely still loading.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
