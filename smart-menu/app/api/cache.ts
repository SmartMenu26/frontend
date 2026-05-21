export const MENU_REVALIDATE_SECONDS = 3600;
export const RESTAURANT_REVALIDATE_SECONDS = 86400;

const STALE_WHILE_REVALIDATE_SECONDS = 86400;

export const buildPublicCacheHeaders = (
  maxAgeSeconds: number,
  staleSeconds = STALE_WHILE_REVALIDATE_SECONDS
) => ({
  "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleSeconds}`,
});

export const buildResponseHeaders = (
  shouldCache: boolean,
  maxAgeSeconds: number
) =>
  shouldCache
    ? buildPublicCacheHeaders(maxAgeSeconds)
    : { "Cache-Control": "no-store" };
