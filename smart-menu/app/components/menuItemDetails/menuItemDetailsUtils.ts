import { defaultLocale, type Locale } from "@/i18n";

export type LocalizedValue = Record<string, string | null | undefined>;

export type MenuItemPayload = {
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
  priceValue?: unknown;
  [key: string]: unknown;
};

export type MenuItemViewModel = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  price?: number;
};

const FALLBACK_IMAGE = "/placeholder.jpg";

export const buildLocalePriority = (locale: Locale): Locale[] =>
  Array.from(new Set<Locale>([locale, defaultLocale, "en" as Locale, "sq" as Locale]));

export const pickLocalizedValue = (
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

export const parsePrice = (value: unknown): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (typeof value === "object" && value !== null) {
    const maybeValue =
      (value as { amount?: number })?.amount ??
      (value as { value?: number })?.value ??
      (value as { mk?: number })?.mk ??
      (value as { price?: number })?.price;
    if (typeof maybeValue === "number" && !Number.isNaN(maybeValue)) {
      return maybeValue;
    }
  }
  return undefined;
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

export const buildMenuItemViewModel = (
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
    price: parsePrice(payload?.price ?? payload?.priceValue),
  };
};
