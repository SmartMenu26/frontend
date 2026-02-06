import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "smartmenu-media-prod.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
    ],
    // Align quality list with the values used by Card.tsx image requests.
    qualities: [60, 70, 75, 100],
  },
};

export default nextConfig;
