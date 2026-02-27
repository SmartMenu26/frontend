import type { Metadata } from "next";
import "./globals.css";
import RegisterSW from "./_components/RegisterSW";
import { Rubik, Birthstone, Inter, Great_Vibes } from "next/font/google";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-rubik",
  display: "swap",
});

export const birthstone = Birthstone({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-birthstone",
  display: "swap",
});

export const great_vibes = Great_Vibes({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-great-vibes",
  display: "swap",
});


export const inter = Inter({
  subsets: ["latin"],
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.smartmenumk.com"),
  alternates: {
    canonical: "/",
  },
  title: "Дигитално QR мени со AI асистент за ресторани | Smart Menu Македонија",
  description: "Паметна технологија за сериозни угостители. QR дигитално мени со AI асистент што ја зголемува продажбата и просечната сметка.",
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
    title: "Дигитално QR мени со AI асистент за ресторани | Smart Menu Македонија",
    description:
      "Паметна технологија за сериозни угостители. QR дигитално мени со AI асистент што ја зголемува продажбата и просечната сметка.",
    url: "https://www.smartmenumk.com/",
    siteName: "Smart Menu",
    images: [{ url: "/og.jpg?v=2", width: 1200, height: 630 }],
    locale: "mk_MK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Дигитално QR мени со AI асистент за ресторани | Smart Menu Македонија",
    description:
      "Паметна технологија за сериозни угостители. QR дигитално мени со AI асистент што ја зголемува продажбата и просечната сметка.",
    images: ["/og.jpg?v=2"],
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
      <body className={`${inter.variable} ${rubik.variable} ${birthstone.variable} ${great_vibes.variable}`}>
        <RegisterSW />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
