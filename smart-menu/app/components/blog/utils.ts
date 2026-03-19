import type { Locale } from "@/i18n";

export function formatPublishedDate(
  value: string | null | undefined,
  locale: Locale
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
  } catch {
    return date.toISOString().split("T")[0] ?? null;
  }
}
