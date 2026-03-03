const FALLBACK_SITE_URL = "https://smartmenumk.com";

function normalizeSiteUrl(value?: string | null) {
  if (!value) return FALLBACK_SITE_URL;
  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return normalizeSiteUrl(raw);
}
