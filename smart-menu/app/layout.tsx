import type { Metadata } from "next";
import "./globals.css";
import RegisterSW from "./_components/RegisterSW";
import { Rubik, Birthstone,Inter, Great_Vibes } from "next/font/google";

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
  title: "Smart Menu",
  description: "AI powered digital menu for restaurants",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${rubik.variable} ${birthstone.variable} ${great_vibes.variable}`}>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}