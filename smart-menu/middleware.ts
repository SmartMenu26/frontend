import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales,
  defaultLocale,
});

export const config = {
  // exclude api, next internals, and static files
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
