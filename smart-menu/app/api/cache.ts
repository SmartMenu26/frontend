import { revalidatePath, revalidateTag } from "next/cache";
import { locales } from "@/i18n";

export const MENU_REVALIDATE_SECONDS = 3600;
export const RESTAURANT_REVALIDATE_SECONDS = 86400;

const STALE_WHILE_REVALIDATE_SECONDS = 86400;

export const buildPublicCacheHeaders = (
  maxAgeSeconds: number,
  staleSeconds = STALE_WHILE_REVALIDATE_SECONDS
) => ({
  "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleSeconds}`,
});

export const buildResponseHeaders = (
  shouldCache: boolean,
  maxAgeSeconds: number
) =>
  shouldCache
    ? buildPublicCacheHeaders(maxAgeSeconds)
    : { "Cache-Control": "no-store" };

export const cacheTags = {
  restaurants: "restaurants",
  restaurant: (restaurantId: string) => `restaurant:${restaurantId}`,
  restaurantSlug: (slug: string) => `restaurant-slug:${slug}`,
  categories: (restaurantId: string) => `categories:${restaurantId}`,
  menuItems: (restaurantId: string) => `menu-items:${restaurantId}`,
  menuItem: (menuItemId: string) => `menu-item:${menuItemId}`,
  weeklyCombos: (restaurantId: string) => `weekly-combos:${restaurantId}`,
};

type PublicRestaurantInvalidationOptions = {
  restaurantId?: string | null;
  restaurantSlug?: string | null;
  menuItemId?: string | null;
  includeRestaurant?: boolean;
  includeCategories?: boolean;
  includeMenuItems?: boolean;
  includeWeeklyCombos?: boolean;
};

const normalizeCacheValue = (value?: string | null) => value?.trim() || null;
const markTagStale = (tag: string) => revalidateTag(tag, "max");

export function revalidatePublicRestaurantCache({
  restaurantId,
  restaurantSlug,
  menuItemId,
  includeRestaurant = true,
  includeCategories = true,
  includeMenuItems = true,
  includeWeeklyCombos = false,
}: PublicRestaurantInvalidationOptions) {
  const normalizedRestaurantId = normalizeCacheValue(restaurantId);
  const normalizedSlug = normalizeCacheValue(restaurantSlug);
  const normalizedMenuItemId = normalizeCacheValue(menuItemId);

  if (includeRestaurant) {
    markTagStale(cacheTags.restaurants);
  }

  if (normalizedRestaurantId) {
    if (includeRestaurant) {
      markTagStale(cacheTags.restaurant(normalizedRestaurantId));
      revalidatePath(`/api/restaurants/${normalizedRestaurantId}`);
    }
    if (includeCategories) {
      markTagStale(cacheTags.categories(normalizedRestaurantId));
      revalidatePath(`/api/restaurants/${normalizedRestaurantId}/categories`);
    }
    if (includeMenuItems) {
      markTagStale(cacheTags.menuItems(normalizedRestaurantId));
      revalidatePath(`/api/menuItems/${normalizedRestaurantId}/menu-items`);
    }
    if (includeWeeklyCombos) {
      markTagStale(cacheTags.weeklyCombos(normalizedRestaurantId));
      revalidatePath(`/api/restaurants/${normalizedRestaurantId}/weekly-combos`);
    }
  }

  if (normalizedMenuItemId) {
    markTagStale(cacheTags.menuItem(normalizedMenuItemId));
  }

  if (normalizedSlug) {
    markTagStale(cacheTags.restaurantSlug(normalizedSlug));
    revalidatePath(`/api/restaurants/slug/${normalizedSlug}`);

    for (const locale of locales) {
      revalidatePath(`/${locale}/restaurant/${normalizedSlug}`);
      if (normalizedMenuItemId) {
        revalidatePath(
          `/${locale}/restaurant/${normalizedSlug}/menuItem/${normalizedMenuItemId}`
        );
      }
    }
  }
}
