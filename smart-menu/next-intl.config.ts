import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./i18n";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: Locale =
    locales.find((candidate) => candidate === locale) ?? defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
