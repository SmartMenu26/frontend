import type { Metadata } from "next";
import "./globals.css";
import RegisterSW from "./_components/RegisterSW";
import { Rubik, Birthstone, Inter, Great_Vibes } from "next/font/google";
import Script from "next/script";

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
  title: "Smart Menu | Дигитално AI мени за ресторани",
  description: "Паметна технологија за сериозни угостители. QR дигитално мени со AI асистент што ја зголемува продажбата и просечната сметка.",
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" } // legacy fallback
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#0b3a2d" }],
  },
  openGraph: {
    title: "Smart Menu | Дигитално AI мени за ресторани",
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
    title: "Smart Menu | Дигитално AI мени за ресторани",
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
      </body>
    </html>
  );
}
