import { MetadataRoute } from "next";
import { locales } from "@/i18n";

const baseUrl = "https://www.smartmenumk.com";
const localeRoutes = ["", "/kako-raboti", "/cenovnik", "/za-nas"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  locales.forEach((locale) => {
    localeRoutes.forEach((route) => {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: route === "" ? 0.9 : 0.7,
      });
    });
  });

  return entries;
}
