"use client";

import { useEffect } from "react";
import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

const LAST_PATH_STORAGE_KEY = "pwa-last-path";
const START_PATH_COOKIE_KEY = "pwa-start-path";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const buildCurrentPath = (
  pathname: string,
  searchParams: ReadonlyURLSearchParams | null
) => {
  if (!pathname) return "/";
  const search = searchParams?.toString();
  return search ? `${pathname}?${search}` : pathname;
};

export default function PwaInstallPathTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const path = buildCurrentPath(pathname, searchParams);

    try {
      window.localStorage.setItem(LAST_PATH_STORAGE_KEY, path);
    } catch {
      // ignore storage write errors (e.g., private browsing)
    }

    try {
      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${START_PATH_COOKIE_KEY}=${encodeURIComponent(
        path
      )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secureFlag}`;
    } catch {
      // cookie write failures can be ignored
    }
  }, [pathname, searchParams]);

  return null;
}
