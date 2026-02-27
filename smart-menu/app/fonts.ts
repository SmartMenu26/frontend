import { Inter, Great_Vibes } from "next/font/google";

export const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-great-vibes",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
  variable: "--font-inter",
  display: "swap",
});
