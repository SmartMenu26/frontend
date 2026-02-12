"use client";

import { useEffect } from "react";

export default function AnchorHashCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearHash = () => {
      if (!window.location.hash) return;
      window.history.replaceState(
        {},
        "",
        window.location.pathname + window.location.search
      );
    };

    const scheduleClear = () => {
      if (!window.location.hash) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        clearHash();
        timer = null;
      }, 600);
    };

    if (window.location.hash) {
      scheduleClear();
    }

    const handleHashChange = () => {
      scheduleClear();
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return null;
}
