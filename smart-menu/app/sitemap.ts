import { MetadataRoute } from "next";
import { locales } from "@/i18n";
import { getSiteUrl } from "@/lib/siteMeta";

const baseUrl = getSiteUrl();
const localeRoutes = ["", "/kako-raboti", "/cenovnik", "/za-nas"] as const;
const restaurantSubRoutes = ["", "/menu", "/contact", "/ai-assistant"] as const;

type RestaurantRecord = {
  id: string;
  slug: string;
  updatedAt?: string;
};

type MenuItemRecord = {
  id: string;
  updatedAt?: string;
};

type RestaurantPayload = {
  id?: unknown;
  _id?: unknown;
  restaurantId?: unknown;
  slug?: unknown;
  updatedAt?: unknown;
};

type MenuItemPayload = {
  id?: unknown;
  _id?: unknown;
  updatedAt?: unknown;
};

const normalizeBackendBase = () =>
  process.env.BACKEND_URL?.trim().replace(/\/$/, "") ?? null;

async function fetchRestaurants(): Promise<RestaurantRecord[]> {
  const backendBase = normalizeBackendBase();
  if (!backendBase) {
    console.warn("[sitemap] BACKEND_URL missing; skipping restaurant list.");
    return [];
  }

  try {
    const endpoint = `${backendBase}/api/restaurants`;
    const res = await fetch(endpoint, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.warn("[sitemap] Restaurant fetch failed:", res.status);
      return [];
    }

    const payload = await res.json().catch(() => null);
    const data: RestaurantPayload[] = Array.isArray(payload?.data)
      ? (payload.data as RestaurantPayload[])
      : Array.isArray(payload)
      ? (payload as RestaurantPayload[])
      : [];

    const normalized: Array<RestaurantRecord | null> = data.map((entry) => {
      const slug =
        typeof entry.slug === "string" && entry.slug.trim().length > 0
          ? entry.slug.trim()
          : undefined;
        const candidateId =
          (typeof entry.id === "string" && entry.id) ||
          (typeof entry._id === "string" && entry._id) ||
          (typeof entry.restaurantId === "string" && entry.restaurantId) ||
          undefined;
      if (!slug || !candidateId) {
        return null;
      }

      return {
        id: candidateId,
        slug,
        updatedAt:
          typeof entry.updatedAt === "string" ? entry.updatedAt : undefined,
      };
    });

    return normalized.filter(
      (entry): entry is RestaurantRecord => entry !== null
    );
  } catch (error) {
    console.error("[sitemap] Restaurant fetch error:", error);
    return [];
  }
}

async function fetchMenuItems(restaurantId: string): Promise<MenuItemRecord[]> {
  const backendBase = normalizeBackendBase();
  if (!backendBase) {
    return [];
  }

  try {
    const endpoint = `${backendBase}/api/menuItems/${restaurantId}/menu-items`;
    const res = await fetch(endpoint, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.warn(
        "[sitemap] Menu item fetch failed:",
        restaurantId,
        res.status
      );
      return [];
    }

    const payload = await res.json().catch(() => null);
    const data: MenuItemPayload[] = Array.isArray(payload?.data)
      ? (payload.data as MenuItemPayload[])
      : Array.isArray(payload)
      ? (payload as MenuItemPayload[])
      : [];

    const normalized: Array<MenuItemRecord | null> = data.map((entry) => {
      const id =
        (typeof entry.id === "string" && entry.id) ||
        (typeof entry._id === "string" && entry._id) ||
        undefined;

      if (!id) {
        return null;
      }

      return {
        id,
        updatedAt:
          typeof entry.updatedAt === "string" ? entry.updatedAt : undefined,
      };
    });

    return normalized.filter(
      (entry): entry is MenuItemRecord => entry !== null
    );
  } catch (error) {
    console.error("[sitemap] Menu item fetch error:", restaurantId, error);
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

  for (const restaurant of restaurants) {
    const restaurantLastModified = restaurant.updatedAt
      ? new Date(restaurant.updatedAt)
      : now;

    locales.forEach((locale) => {
      restaurantSubRoutes.forEach((subRoute) => {
        entries.push({
          url: `${baseUrl}/${locale}/restaurant/${restaurant.slug}${subRoute}`,
          lastModified: restaurantLastModified,
          changeFrequency: "daily",
          priority: subRoute === "" ? 0.85 : 0.7,
        });
      });
    });

    const menuItems = await fetchMenuItems(restaurant.id);
    menuItems.forEach((item) => {
      const itemLastModified = item.updatedAt
        ? new Date(item.updatedAt)
        : restaurantLastModified;
      locales.forEach((locale) => {
        entries.push({
          url: `${baseUrl}/${locale}/restaurant/${restaurant.slug}/menuItem/${item.id}`,
          lastModified: itemLastModified,
          changeFrequency: "daily",
          priority: 0.6,
        });
      });
    });
  }

  return entries;
}
