export const locales = ["mk", "sq", "en", "tr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "mk";
