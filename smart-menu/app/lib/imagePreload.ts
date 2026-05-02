"use client";

const warmedImageUrls = new Set<string>();

export function preloadImage(url?: string | null) {
  const normalizedUrl = typeof url === "string" ? url.trim() : "";
  if (!normalizedUrl || typeof window === "undefined") {
    return;
  }

  if (warmedImageUrls.has(normalizedUrl)) {
    return;
  }

  warmedImageUrls.add(normalizedUrl);

  const image = new window.Image();
  image.decoding = "async";
  image.src = normalizedUrl;
}
