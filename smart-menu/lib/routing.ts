import { locales, type Locale } from "@/i18n";

const localeSet = new Set(locales);

/**
 * Ensures that a pathname always starts with the provided locale segment.
 * Preserves existing query strings and hash fragments.
 */
export function buildLocalizedPath(path: string, locale: Locale) {
  if (!locale) return path;

  const safePath = path && path.length > 0 ? path : "/";
  const [withoutHash, hashFragment = ""] = safePath.split("#", 2);
  const [pathnamePart, queryFragment = ""] = withoutHash.split("?", 2);

  const normalizedPath = pathnamePart.startsWith("/")
    ? pathnamePart
    : `/${pathnamePart}`;

  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length > 0 && localeSet.has(segments[0] as Locale)) {
    segments[0] = locale;
  } else {
    segments.unshift(locale);
  }

  let result = `/${segments.join("/")}`;

  if (queryFragment) {
    result += `?${queryFragment}`;
  }

  if (hashFragment) {
    result += `#${hashFragment}`;
  }

  return result;
}
