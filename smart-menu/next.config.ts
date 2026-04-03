import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import type { Redirect, RouteHas } from "next/dist/lib/load-custom-routes";

const withNextIntl = createNextIntlPlugin("./next-intl.config.ts");

const DEFAULT_SITE_URL = "https://www.smartmenumk.com";
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? DEFAULT_SITE_URL;

function computeSiteMeta(urlString: string) {
  const normalized =
    urlString.startsWith("http://") || urlString.startsWith("https://")
      ? urlString
      : `https://${urlString}`;
  try {
    const parsed = new URL(normalized);
    return { origin: parsed.origin, host: parsed.host };
  } catch {
    const fallback = new URL(DEFAULT_SITE_URL);
    return { origin: fallback.origin, host: fallback.host };
  }
}

const { origin: siteOrigin, host: canonicalHost } = computeSiteMeta(rawSiteUrl);
const isLocalhost = canonicalHost.includes("localhost");
const alternateHost = canonicalHost.startsWith("www.")
  ? canonicalHost.replace(/^www\./, "")
  : `www.${canonicalHost}`;

const IMAGE_DEVICE_SIZES = [360, 480, 640, 768, 1024];
const IMAGE_FIXED_SIZES = [14, 20, 24, 32, 40, 48, 56, 64, 72, 96, 100, 128, 160, 200, 320, 400];
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "smartmenu-media-prod.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "smartmenu-media-prod.s3.eu-central-1.amazonaws.com",
        pathname: "/**",
      },
    ],
    deviceSizes: IMAGE_DEVICE_SIZES,
    imageSizes: IMAGE_FIXED_SIZES,
    minimumCacheTTL: THIRTY_DAYS_IN_SECONDS,
    formats: ["image/avif", "image/webp"],
    // Keep the quality buckets small so fewer unique transformations are produced.
    qualities: [60, 75, 85],
  },
  async redirects() {
    return [
      {
        source: "/restaurant/6957e610dfe0f2ca815211f8",
        destination: "/restaurant/bakal",
        permanent: true,
      },
      {
        source: "/mk/restaurant/:path*",
        destination: "/restaurant/:path*",
        permanent: true,
      },
      {
        source: "/(.*)",
        has: [
          { type: "host", value: "smartmenumk.com" },
        ],
        destination: "https://www.smartmenumk.com/:path*",
        permanent: true,
      },
      {
        source: "/(.*)",
        has: [
          { type: "header", key: "x-forwarded-proto", value: "http" },
        ],
        destination: "https://www.smartmenumk.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
