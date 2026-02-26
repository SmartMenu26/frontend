import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./next-intl.config.ts");

const IMAGE_DEVICE_SIZES = [360, 480, 640, 768, 1024];
const IMAGE_FIXED_SIZES = [14, 20, 24, 32, 40, 48, 56, 64, 72, 96, 100, 128, 160, 200, 320, 400];
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "smartmenu-media-prod.s3.eu-north-1.amazonaws.com",
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
};

export default withNextIntl(nextConfig);
