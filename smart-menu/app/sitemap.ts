import { MetadataRoute } from "next";
import { locales } from "@/i18n";
import { getSiteUrl } from "@/lib/siteMeta";

const baseUrl = getSiteUrl();
const localeRoutes = ["", "/kako-raboti", "/cenovnik", "/za-nas"] as const;
const restaurantSubRoutes = ["", "/menu", "/contact", "/ai-assistant"] as const;

type RestaurantRecord = {
  slug?: string;
  updatedAt?: string;
};

async function fetchRestaurants(): Promise<RestaurantRecord[]> {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (!backendBase || process.env.NODE_ENV !== "production") {
    return [];
  }

  try {
    const endpoint = `${backendBase}/api/restaurants`;
    const res = await fetch(endpoint, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return [];
    }

    const payload = await res.json().catch(() => null);
    const data = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    return data.filter(
      (restaurant: RestaurantRecord) =>
        typeof restaurant?.slug === "string" && restaurant.slug.length > 0
    );
  } catch (error) {
    console.error("[sitemap] Restaurant fetch error:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const restaurants = await fetchRestaurants();

  restaurants.forEach((restaurant) => {
    if (!restaurant.slug) return;
    const lastModified = restaurant.updatedAt
      ? new Date(restaurant.updatedAt)
      : now;

    locales.forEach((locale) => {
      restaurantSubRoutes.forEach((subRoute) => {
        entries.push({
          url: `${baseUrl}/${locale}/restaurant/${restaurant.slug}${subRoute}`,
          lastModified,
          changeFrequency: "daily",
          priority: subRoute === "" ? 0.85 : 0.7,
        });
      });
    });
  });

  return entries;
}
