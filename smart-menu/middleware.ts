import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "./i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // ✅ important
  localeDetection: false,
});

const PWA_QUERY_PARAM = "pwa";
const PWA_START_COOKIE_KEY = "pwa-start-path";

const decodeCookieValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const sanitizePath = (value: string) => {
  let next = value.trim();
  if (!next.startsWith("/")) {
    next = `/${next.replace(/^\/+/, "")}`;
  }
  return next || "/";
};

export default function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const hasPwaParam = nextUrl.searchParams.has(PWA_QUERY_PARAM);

  if (hasPwaParam && nextUrl.pathname === "/") {
    const rawCookie = request.cookies.get(PWA_START_COOKIE_KEY)?.value;
    if (rawCookie) {
      const targetPath = sanitizePath(decodeCookieValue(rawCookie));
      const redirectUrl = new URL(targetPath, nextUrl.origin);
      if (redirectUrl.href !== nextUrl.href) {
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      const cleanUrl = new URL(nextUrl.href);
      cleanUrl.searchParams.delete(PWA_QUERY_PARAM);
      if (cleanUrl.href !== nextUrl.href) {
        return NextResponse.redirect(cleanUrl);
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
