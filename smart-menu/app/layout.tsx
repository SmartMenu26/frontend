import type { Metadata } from "next";
import "./globals.css";
import RegisterSW from "./_components/RegisterSW";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { inter, greatVibes } from "./fonts";
import { getSiteUrl } from "@/lib/siteMeta";

const siteUrl = getSiteUrl();
const homeUrl = `${siteUrl}/`;
const ogImageUrl = `${siteUrl}/og.jpg?v=2`;

const baseTitle = "AI дигитално QR мени со асистент | Smart Menu";
const baseDescription =
  "Паметна технологија за сериозни угостители: AI асистент, QR мени и аналитика што ја зголемува продажбата и го подобрува гостинското искуство.";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: baseTitle,
  description: baseDescription,
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: baseTitle,
    description: baseDescription,
    url: homeUrl,
    siteName: "Smart Menu",
    images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    locale: "mk_MK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: baseTitle,
    description: baseDescription,
    images: [ogImageUrl],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mk">
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-SX57E0RGSR"
        strategy="afterInteractive"
      />
      <Script id="ga-gtag" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SX57E0RGSR');
          `}
      </Script>
      <body className={`${inter.variable} ${greatVibes.variable}`}>
        <RegisterSW />
        <main>
          {children}
        </main>
        <SpeedInsights />
      </body>
    </html>
  );
}
