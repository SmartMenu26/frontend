import type { Metadata } from "next";
import MenuItemDetails from "@/app/components/menuItemDetails/menuItemDetails";
import { fetchRestaurantRecord, pickRestaurantName } from "@/app/lib/restaurants";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { buildLocalizedPath } from "@/lib/routing";
import { getSiteUrl } from "@/lib/siteMeta";

type Props = {
  params: Promise<{ locale: Locale; restaurantSlug: string; menuItemId: string }>;
  searchParams?: Promise<{ kind?: string }>;
};

const DEFAULT_CURRENCY = "MKD";
const FALLBACK_IMAGE = "/placeholder.jpg";
type LocalizedValue = Record<string, string | null | undefined>;

type MenuItemPayload = {
  _id?: string;
  id?: string;
  name?: LocalizedValue | string;
  description?: LocalizedValue | string;
  image?:
    | {
        url?: string;
        altMk?: string;
        altSq?: string;
        altEn?: string;
      }
    | string
    | null;
  imageUrl?: string | null;
  price?: unknown;
  [key: string]: unknown;
};

const buildLocalePriority = (locale: Locale): Locale[] =>
  Array.from(new Set<Locale>([locale, defaultLocale, "en" as Locale, "sq" as Locale]));

const pickLocalizedValue = (
  value?: LocalizedValue | string,
  localePriority: Locale[] = [],
  fallback = ""
): string => {
  if (!value) return fallback;
  if (typeof value === "string") return value.trim() || fallback;

  for (const key of localePriority) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  for (const candidate of Object.values(value)) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return fallback;
};

const parsePrice = (value: unknown): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (typeof value === "object" && value !== null) {
    const maybeValue =
      (value as { amount?: number })?.amount ??
      (value as { value?: number })?.value ??
      (value as { mk?: number })?.mk;
    if (typeof maybeValue === "number" && !Number.isNaN(maybeValue)) {
      return maybeValue;
    }
  }
  return undefined;
};

type MenuItemViewModel = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  price?: number;
};

const resolveImageUrl = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as MenuItemPayload;
  if (typeof record.image === "string" && record.image.trim()) {
    return record.image.trim();
  }
  const imageRecord = record.image;
  if (
    imageRecord &&
    typeof imageRecord === "object" &&
    typeof (imageRecord as { url?: string }).url === "string"
  ) {
    const url = (imageRecord as { url?: string }).url;
    if (url) return url;
  }
  if (typeof record.imageUrl === "string" && record.imageUrl.trim()) {
    return record.imageUrl.trim();
  }
  return undefined;
};

const resolveRequestOrigin = async () => {
  try {
    const h = await headers();
    const host = h.get("host");
    if (!host) return getSiteUrl();
    const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return getSiteUrl();
  }
};

type FetchMenuItemOptions = {
  origin: string;
  restaurantId: string;
  menuItemId: string;
  kind?: string;
};

const fetchMenuItemPayload = async ({
  origin,
  restaurantId,
  menuItemId,
  kind,
}: FetchMenuItemOptions): Promise<MenuItemPayload | null> => {
  const qs = new URLSearchParams();
  if (kind) qs.set("kind", kind);

  const url = `${origin}/api/menuItems/${restaurantId}/menu-items/${menuItemId}${
    qs.size > 0 ? `?${qs.toString()}` : ""
  }`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json().catch(() => null);
    if (!json || typeof json !== "object") return null;
    const candidate = (json as { data?: unknown }).data;
    if (candidate && typeof candidate === "object") {
      return candidate as MenuItemPayload;
    }
    return json as MenuItemPayload;
  } catch {
    return null;
  }
};

const buildMenuItemViewModel = (
  payload: MenuItemPayload,
  menuItemId: string,
  localePriority: Locale[]
): MenuItemViewModel => {
  const name = pickLocalizedValue(payload?.name, localePriority, "Item");
  const description = pickLocalizedValue(payload?.description, localePriority, "");
  const imageMeta =
    payload.image && typeof payload.image === "object"
      ? {
          mk: (payload.image as { altMk?: string })?.altMk,
          sq: (payload.image as { altSq?: string })?.altSq,
          en: (payload.image as { altEn?: string })?.altEn,
        }
      : undefined;

  return {
    id: payload?._id ?? payload?.id ?? menuItemId,
    name,
    description,
    imageUrl: resolveImageUrl(payload) ?? FALLBACK_IMAGE,
    imageAlt: pickLocalizedValue(imageMeta, localePriority, name),
    price: parsePrice(payload?.price),
  };
};

const formatPriceLabel = (price: number | undefined, locale: Locale) => {
  if (typeof price !== "number" || Number.isNaN(price)) return null;
  const intlLocale =
    locale === "mk" ? "mk-MK" : locale === "sq" ? "sq-AL" : locale === "en" ? "en-US" : "en-US";
  return `${new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)} ${DEFAULT_CURRENCY}`;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale: routeLocale, restaurantSlug, menuItemId } = await params;
  const resolvedLocale: Locale =
    locales.find((candidate) => candidate === routeLocale) ?? defaultLocale;
  const record = await fetchRestaurantRecord(restaurantSlug);

  if (!record?.id) {
    return {
      title: "Menu item | Smart Menu",
      description: "Discover digital menus with Smart Menu.",
    };
  }

  const localePriority = buildLocalePriority(resolvedLocale);
  const restaurantName =
    pickRestaurantName(record, localePriority) ?? record.plainName ?? "Smart Menu";
  const resolvedSearch = (searchParams ? await searchParams : {}) ?? {};
  const origin = await resolveRequestOrigin();
  const payload = await fetchMenuItemPayload({
    origin,
    restaurantId: record.id,
    menuItemId,
    kind: resolvedSearch?.kind,
  });

  const viewModel = payload ? buildMenuItemViewModel(payload, menuItemId, localePriority) : null;
  const itemName = viewModel?.name ?? "Menu item";
  const city = record.city;
  const formattedPrice = formatPriceLabel(viewModel?.price, resolvedLocale);
  const descriptionPieces = [
    viewModel?.description?.trim(),
    formattedPrice,
    city ? `${restaurantName} · ${city}` : restaurantName,
  ].filter(Boolean);
  const description =
    descriptionPieces.join(" · ") ||
    `Explore ${itemName} at ${restaurantName}${city ? ` in ${city}` : ""}.`;

  const primaryImage =
    viewModel?.imageUrl ?? record.heroImageUrl ?? record.imageUrl ?? `${getSiteUrl()}/og.jpg`;

  return {
    title: `${itemName} | ${restaurantName}`,
    description,
    ...(primaryImage
      ? {
          openGraph: {
            images: [{ url: primaryImage }],
          },
          twitter: {
            card: "summary_large_image",
            images: [primaryImage],
          },
        }
      : {}),
  };
}

export default async function MenuItemPage({ params, searchParams }: Props) {
  const { locale: routeLocale, restaurantSlug, menuItemId } = await params;
  const resolvedLocale: Locale =
    locales.find((candidate) => candidate === routeLocale) ?? defaultLocale;
  const record = await fetchRestaurantRecord(restaurantSlug);

  if (!record?.id) {
    notFound();
  }

  const resolvedSearch = (searchParams ? await searchParams : {}) ?? {};

  if (
    record.slug &&
    record.slug !== restaurantSlug &&
    /^[a-f\\d]{24}$/i.test(restaurantSlug)
  ) {
    const base = buildLocalizedPath(
      `/restaurant/${record.slug}/menuItem/${menuItemId}`,
      resolvedLocale
    );
    const qs = new URLSearchParams();
    if (resolvedSearch?.kind) {
      qs.set("kind", resolvedSearch.kind);
    }
    const target = qs.size > 0 ? `${base}?${qs.toString()}` : base;
    redirect(target);
  }

  const restaurantId = record.id;
  const localePriority = buildLocalePriority(resolvedLocale);
  const origin = await resolveRequestOrigin();
  const payload = await fetchMenuItemPayload({
    origin,
    restaurantId,
    menuItemId,
    kind: resolvedSearch?.kind,
  });

  if (!payload) {
    return <div className="p-6">Not found</div>;
  }

  const viewModel = buildMenuItemViewModel(payload, menuItemId, localePriority);
  const mapped = {
    ...viewModel,
    restaurantId,
    restaurantSlug: record.slug,
  };

  return <MenuItemDetails {...mapped} />;
}
