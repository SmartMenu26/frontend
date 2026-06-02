import type { Metadata } from "next";
import MenuItemDetailsPageClient from "@/app/components/menuItemDetails/MenuItemDetailsPageClient";
import {
  buildLocalePriority,
  pickLocalizedValue,
  type LocalizedValue,
  type MenuItemPayload,
} from "@/app/components/menuItemDetails/menuItemDetailsUtils";
import { cacheTags, MENU_REVALIDATE_SECONDS } from "@/app/api/cache";
import { fetchRestaurantRecord, pickRestaurantName } from "@/app/lib/restaurants";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

type Params = {
  locale: Locale;
  restaurantSlug: string;
  menuItemId: string;
};

type SearchParams = {
  kind?: string;
};

type PageProps = {
  params: Promise<Params>;
  searchParams?: Promise<SearchParams>;
};

export const revalidate = 3600;

const getBackendBase = () =>
  process.env.BACKEND_URL?.trim().replace(/\/$/, "") ?? null;

const titleCaseWords = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));

const getPayloadId = (record: Record<string, unknown>): string | undefined =>
  typeof record._id === "string"
    ? record._id
    : typeof record.id === "string"
      ? record.id
      : undefined;

const getMenuItemPayload = (
  payload: unknown,
  menuItemId: string,
  depth = 0
): MenuItemPayload | null => {
  if (!payload || typeof payload !== "object" || depth > 8) {
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const match = getMenuItemPayload(item, menuItemId, depth + 1);
      if (match) return match;
    }
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidateId = getPayloadId(record);
  if (candidateId === menuItemId) {
    return record as MenuItemPayload;
  }

  const nestedKeys = [
    "data",
    "item",
    "menuItem",
    "menuItems",
    "items",
    "results",
    "docs",
    "attributes",
  ];

  for (const key of nestedKeys) {
    const nested = record[key];
    if (!nested || nested === payload) continue;
    const match = getMenuItemPayload(nested, menuItemId, depth + 1);
    if (match) return match;
  }

  if (Array.isArray(record.nutritionBreakdown) || record.name || record.image) {
    return record as MenuItemPayload;
  }

  return null;
};

const fetchMenuItemPayload = async (
  restaurantId: string,
  menuItemId: string,
  kind?: string
): Promise<MenuItemPayload | null> => {
  const backendBase = getBackendBase();
  if (!backendBase || !restaurantId || !menuItemId) return null;

  const qs = new URLSearchParams();
  if (kind) {
    qs.set("kind", kind);
  }

  const url = `${backendBase}/api/menuItems/${encodeURIComponent(
    restaurantId
  )}/menu-items/${encodeURIComponent(menuItemId)}${
    qs.size > 0 ? `?${qs.toString()}` : ""
  }`;

  try {
    const res = await fetch(url, {
      next: {
        revalidate: MENU_REVALIDATE_SECONDS,
        tags: [cacheTags.menuItems(restaurantId), cacheTags.menuItem(menuItemId)],
      },
    });

    if (!res.ok) return null;
    const rawPayload = await res.json().catch(() => null);
    return getMenuItemPayload(rawPayload, menuItemId);
  } catch (error) {
    console.error("[menuItemMetadata] Fetch failed", url, error);
    return null;
  }
};

const getMenuItemName = (
  payload: MenuItemPayload | null,
  localePriority: Locale[]
) => {
  if (!payload) return undefined;

  return (
    pickLocalizedValue(payload.name, localePriority, "") ||
    pickLocalizedValue(
      (payload.title ?? payload.label) as LocalizedValue | string | undefined,
      localePriority,
      ""
    ) ||
    undefined
  );
};

const getMenuItemDescription = (
  payload: MenuItemPayload | null,
  localePriority: Locale[]
) => {
  if (!payload) return undefined;
  return (
    pickLocalizedValue(payload.description, localePriority, "") ||
    pickLocalizedValue(
      (payload.subtitle ?? payload.summary) as LocalizedValue | string | undefined,
      localePriority,
      ""
    ) ||
    undefined
  );
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale: routeLocale, restaurantSlug, menuItemId } = await params;
  const resolvedLocale: Locale =
    locales.find((candidate) => candidate === routeLocale) ?? defaultLocale;
  const resolvedSearchParams = (searchParams ? await searchParams : {}) ?? {};
  const localePriority = buildLocalePriority(resolvedLocale);
  const readableSlug = titleCaseWords(restaurantSlug);
  const record = await fetchRestaurantRecord(restaurantSlug);
  const restaurantName = titleCaseWords(
    (record ? pickRestaurantName(record, localePriority) : undefined) ??
      readableSlug ??
      "Smart Menu"
  );
  const menuItemPayload = record?.id
    ? await fetchMenuItemPayload(record.id, menuItemId, resolvedSearchParams.kind)
    : null;
  const menuItemName = getMenuItemName(menuItemPayload, localePriority);
  const itemTitle = menuItemName ?? "Menu item";
  const title = `${itemTitle} | ${restaurantName} | Smart Menu`;
  const description =
    getMenuItemDescription(menuItemPayload, localePriority) ??
    `Discover ${itemTitle} in ${restaurantName}'s digital Smart Menu.`;
  const canonicalPath = buildLocalizedPath(
    `/restaurant/${record?.slug ?? restaurantSlug}/menuItem/${menuItemId}`,
    resolvedLocale
  );

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function MenuItemPage({ params }: PageProps) {
  const { locale: routeLocale, restaurantSlug, menuItemId } = await params;
  const resolvedLocale: Locale =
    locales.find((candidate) => candidate === routeLocale) ?? defaultLocale;

  return (
    <MenuItemDetailsPageClient
      locale={resolvedLocale}
      restaurantSlug={restaurantSlug}
      menuItemId={menuItemId}
    />
  );
}
