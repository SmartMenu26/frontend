import { locales, type Locale } from "@/i18n";

type LocalizedRecord = Record<string, string | null | undefined>;

export type RestaurantAiSuggestion = {
  label?: string | LocalizedRecord;
  icon?: string;
};

export type DailyComboItem = {
  id: string;
  menuItemId?: string;
  type?: string;
  title: string;
  description?: string;
  price?: string;
  imageUrl?: string | null;
  imageAlt?: string;
};

export type DailyComboOffer = {
  title?: string;
  subtitle?: string;
  totalPrice?: string;
  items: DailyComboItem[];
};

type WeeklyComboItemPayload = {
  menuItemId?: string;
  name?: string | LocalizedRecord;
  price?: number;
  image?: {
    url?: string;
    alt?: string;
    altMk?: string;
    altSq?: string;
    altEn?: string;
  };
};

export type WeeklyComboEntry = {
  day?: string;
  items?: WeeklyComboItemPayload[];
};

export type RestaurantRecord = {
  id: string;
  slug: string;
  plainName?: string;
  localizedName?: LocalizedRecord;
  assistantName?: string | LocalizedRecord;
  city?: string;
  heroImageUrl?: string | null;
  imageUrl?: string | null;
  description?: string | LocalizedRecord;
  fullRestaurantName?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  brandColor?: string;
  location?: string;
  mobilePhone?: string;
  aiSuggestions?: RestaurantAiSuggestion[];
  dailyCombo?: DailyComboOffer;
  supportedLanguages?: Locale[];
};

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const WEEKDAY_KEYS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const IMAGE_KEYS = [
  "heroImage",
  "coverImage",
  "image",
  "logo",
  "thumbnail",
  "primaryImage",
  "featuredImage",
] as const;

const COLLECTION_KEYS = ["images", "gallery", "photos"] as const;

const LOCALIZED_KEYS = ["name", "aiAssistantName", "description"] as const;
const SUPPORTED_LOCALE_SET = new Set<Locale>(locales);

const CITY_KEYS = [
  "city",
  "town",
  "location",
  "address",
  "meta",
  "contact",
] as const;

const getBackendBase = () =>
  process.env.BACKEND_URL?.trim().replace(/\/$/, "") ?? null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toLocalizedRecord = (value: unknown): LocalizedRecord | undefined => {
  if (!isRecord(value)) return undefined;
  return Object.entries(value).reduce<LocalizedRecord>((acc, [key, val]) => {
    if (typeof val === "string") {
      acc[key] = val;
    }
    return acc;
  }, {});
};

const resolveImageUrl = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (isRecord(value)) {
    const candidates = [
      value.url,
      value.src,
      value.imageUrl,
      value.href,
      value.original,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return null;
};

const readString = (value: unknown): string | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
};

const normalizeSupportedLanguages = (value: unknown): Locale[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const normalized = value.reduce<Locale[]>((acc, entry) => {
    if (typeof entry !== "string") return acc;
    const locale = entry.trim().toLowerCase();
    if (!SUPPORTED_LOCALE_SET.has(locale as Locale)) return acc;
    const supportedLocale = locale as Locale;
    if (!acc.includes(supportedLocale)) {
      acc.push(supportedLocale);
    }
    return acc;
  }, []);

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeAiSuggestions = (
  value: unknown
): RestaurantAiSuggestion[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const normalized = value.reduce<RestaurantAiSuggestion[]>((acc, entry) => {
    if (!isRecord(entry)) return acc;

    const label =
      typeof entry.label === "string"
        ? entry.label.trim() || undefined
        : toLocalizedRecord(entry.label);

    const icon = readString(entry.icon);

    if (!label) return acc;

    acc.push({
      label,
      icon,
    });

    return acc;
  }, []);

  return normalized.length > 0 ? normalized : undefined;
};

const parseDailyComboItem = (
  value: unknown,
  fallbackId: string
): DailyComboItem | null => {
  if (!isRecord(value)) return null;

  const title =
    readString(value.title) ??
    readString(value.name) ??
    readString(value.item) ??
    readString(value.label);

  if (!title) return null;

  const id =
    readString(value.id) ??
    readString(value.key) ??
    readString(value.slug) ??
    fallbackId;

  const type =
    readString(value.type) ??
    readString(value.kind) ??
    readString(value.category);

  const description = readString(value.description) ?? readString(value.note);

  const rawPrice =
    readString(value.price) ??
    readString(value.cost) ??
    readString(value.amount) ??
    readString(value.value);

  const imageUrl =
    resolveImageUrl(value.image) ??
    resolveImageUrl(value.imageUrl) ??
    resolveImageUrl(value.photo);

  const menuItemId =
    readString(value.menuItemId) ??
    readString(value.menuItemID) ??
    readString(value.menuItem);

  return {
    id,
    menuItemId: menuItemId ?? undefined,
    type: type ?? undefined,
    title,
    description: description ?? undefined,
    price: rawPrice ?? undefined,
    imageUrl,
  };
};

const parseDailyComboPayload = (input: unknown): DailyComboOffer | undefined => {
  if (!isRecord(input)) return undefined;

  const rawItems =
    (Array.isArray(input.items) && input.items) ||
    (Array.isArray((input as { comboItems?: unknown[] }).comboItems) &&
      (input as { comboItems?: unknown[] }).comboItems) ||
    (Array.isArray((input as { entries?: unknown[] }).entries) &&
      (input as { entries?: unknown[] }).entries) ||
    (Array.isArray((input as { combo?: unknown[] }).combo) &&
      (input as { combo?: unknown[] }).combo) ||
    [];

  const items = rawItems
    .map((entry, index) => parseDailyComboItem(entry, `combo-item-${index}`))
    .filter(Boolean) as DailyComboItem[];

  const title = readString(input.title) ?? readString(input.name);
  const subtitle =
    readString((input as { subtitle?: unknown }).subtitle) ??
    readString(input.description);
  const totalPrice =
    readString((input as { totalPrice?: unknown }).totalPrice) ??
    readString(input.price) ??
    readString((input as { cost?: unknown }).cost);

  if (!items.length && !totalPrice && !title) {
    return undefined;
  }

  return {
    title: title ?? undefined,
    subtitle: subtitle ?? undefined,
    totalPrice: totalPrice ?? undefined,
    items,
  };
};

const extractDailyCombo = (
  payload: Record<string, unknown>
): DailyComboOffer | undefined => {
  const candidateKeys = [
    "dailyCombo",
    "comboOffer",
    "combo",
    "dailySpecialCombo",
    "todaysCombo",
  ];

  for (const key of candidateKeys) {
    const source = payload[key];
    const parsed = parseDailyComboPayload(source);
    if (parsed) {
      return parsed;
    }
  }

  const specials = payload["specials"];
  if (isRecord(specials)) {
    const parsed = parseDailyComboPayload(specials["dailyCombo"]);
    if (parsed) {
      return parsed;
    }
  }

  return undefined;
};

const pickFirstImage = (payload: Record<string, unknown>): string | null => {
  const directCandidates = IMAGE_KEYS.map((key) =>
    resolveImageUrl(payload[key])
  ).filter(Boolean) as string[];

  if (directCandidates.length > 0) {
    return directCandidates[0];
  }

  for (const key of COLLECTION_KEYS) {
    const collection = payload[key];
    if (Array.isArray(collection)) {
      for (const entry of collection) {
        const url = resolveImageUrl(entry);
        if (url) return url;
      }
    }
  }

  if (typeof payload.imageUrl === "string" && payload.imageUrl.trim()) {
    return payload.imageUrl.trim();
  }

  return null;
};

const normalizeIdentifier = (value: string) => value.trim().toLowerCase();

const matchesIdentifier = (
  payload: Record<string, unknown>,
  identifier: string
) => {
  const normalized = normalizeIdentifier(identifier);
  const candidateId = [
    payload._id,
    payload.id,
    payload.restaurantId,
  ].find((entry) => typeof entry === "string" && entry.trim());

  if (typeof candidateId === "string" && candidateId === identifier) {
    return true;
  }

  const candidateSlug =
    typeof payload.slug === "string" ? payload.slug.trim().toLowerCase() : null;

  return Boolean(candidateSlug && candidateSlug === normalized);
};

const extractCity = (payload: Record<string, unknown>): string | undefined => {
  for (const key of CITY_KEYS) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (isRecord(value)) {
      const nestedCity = value.city;
      if (typeof nestedCity === "string" && nestedCity.trim()) {
        return nestedCity.trim();
      }
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string" && entry.trim()) {
          return entry.trim();
        }
        if (isRecord(entry) && typeof entry.city === "string" && entry.city.trim()) {
          return entry.city.trim();
        }
      }
    }
  }

  return undefined;
};

const mapRestaurantPayload = (
  payload: Record<string, unknown>,
  fallbackIdentifier: string
): RestaurantRecord | null => {
  const possibleId =
    (typeof payload._id === "string" && payload._id.trim()) ||
    (typeof payload.id === "string" && payload.id.trim()) ||
    (typeof payload.restaurantId === "string" && payload.restaurantId.trim()) ||
    null;

  if (!possibleId) {
    return null;
  }

  const slug =
    (typeof payload.slug === "string" && payload.slug.trim()) ||
    fallbackIdentifier;

  const localizedEntries: Partial<Record<(typeof LOCALIZED_KEYS)[number], LocalizedRecord | string>> =
    {};

  for (const key of LOCALIZED_KEYS) {
    const rawValue = payload[key];
    if (typeof rawValue === "string") {
      localizedEntries[key] = rawValue;
    } else if (isRecord(rawValue)) {
      localizedEntries[key] = toLocalizedRecord(rawValue);
    }
  }

  const heroImageUrl = pickFirstImage(payload);
  const normalizeString = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;

  return {
    id: possibleId,
    slug,
    plainName:
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : undefined,
    localizedName:
      localizedEntries.name && typeof localizedEntries.name !== "string"
        ? localizedEntries.name
        : undefined,
    assistantName: localizedEntries.aiAssistantName,
    description: localizedEntries.description,
    city: extractCity(payload),
    heroImageUrl,
    imageUrl:
      typeof payload.imageUrl === "string" && payload.imageUrl.trim()
        ? payload.imageUrl.trim()
        : undefined,
    fullRestaurantName: normalizeString(payload.fullRestaurantName),
    facebookUrl: normalizeString(payload.facebookUrl),
    instagramUrl: normalizeString(payload.instagramUrl),
    brandColor: normalizeString(payload.brandColor),
    location: normalizeString(payload.location),
    mobilePhone: normalizeString(payload.mobilePhone),
    aiSuggestions: normalizeAiSuggestions(payload.aiSuggestions),
    dailyCombo: extractDailyCombo(payload) ?? undefined,
    supportedLanguages: normalizeSupportedLanguages(payload.supportedLanguages),
  };
};

const unwrapPayload = (input: unknown): unknown => {
  if (isRecord(input) && "data" in input) {
    const data = (input as { data?: unknown }).data;
    return data ?? input;
  }
  return input;
};

const fetchJson = async (url: string) => {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch (error) {
    console.error("[restaurantResolver] Fetch failed", url, error);
    return null;
  }
};

const tryMapPayload = (
  payload: unknown,
  identifier: string
): RestaurantRecord | null => {
  const unwrapped = unwrapPayload(payload);

  if (isRecord(unwrapped)) {
    return mapRestaurantPayload(unwrapped, identifier);
  }

  if (Array.isArray(unwrapped)) {
    const matched = unwrapped.find(
      (entry) => isRecord(entry) && matchesIdentifier(entry, identifier)
    );

    if (matched && isRecord(matched)) {
      return mapRestaurantPayload(matched, identifier);
    }
  }

  return null;
};

const normalizeWeeklyComboArray = (
  source: unknown[],
): WeeklyComboEntry[] => {
  return source.reduce<WeeklyComboEntry[]>((acc, entry) => {
    if (!isRecord(entry)) return acc;
    const rawDay = readString((entry as { day?: unknown }).day);
    const day = rawDay?.toLowerCase();
    if (!day || !WEEKDAY_KEYS.has(day)) {
      return acc;
    }
    const rawItems = (entry as { items?: unknown }).items;
    const items = Array.isArray(rawItems)
      ? (rawItems as WeeklyComboItemPayload[])
      : [];
    acc.push({ day, items });
    return acc;
  }, []);
};

const normalizeWeeklyComboMap = (
  source: Record<string, unknown>,
): WeeklyComboEntry[] => {
  return Object.entries(source).reduce<WeeklyComboEntry[]>(
    (acc, [key, value]) => {
      const day = key.toLowerCase();
      if (!WEEKDAY_KEYS.has(day) || !Array.isArray(value)) {
        return acc;
      }
      acc.push({
        day,
        items: value as WeeklyComboItemPayload[],
      });
      return acc;
    },
    [],
  );
};

const normalizeWeeklyComboPayload = (
  payload: unknown,
): WeeklyComboEntry[] | null => {
  const unwrapped = unwrapPayload(payload);
  if (!unwrapped) return null;

  if (Array.isArray(unwrapped)) {
    const normalized = normalizeWeeklyComboArray(unwrapped);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  if (isRecord(unwrapped)) {
    const dataField = (unwrapped as { data?: unknown }).data;
    if (Array.isArray(dataField)) {
      const normalized = normalizeWeeklyComboArray(dataField);
      if (normalized.length > 0) {
        return normalized;
      }
    }

    if (isRecord(dataField)) {
      const normalized = normalizeWeeklyComboMap(dataField);
      if (normalized.length > 0) {
        return normalized;
      }
    }

    const normalized = normalizeWeeklyComboMap(unwrapped);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return null;
};

export async function fetchRestaurantRecord(
  identifier: string
): Promise<RestaurantRecord | null> {
  const backendBase = getBackendBase();
  if (!backendBase) return null;

  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const urlCandidates: string[] = [];

  if (OBJECT_ID_REGEX.test(trimmed)) {
    urlCandidates.push(`${backendBase}/api/restaurants/${trimmed}`);
  } else {
    urlCandidates.push(
      `${backendBase}/api/restaurants/slug/${trimmed}`,
      `${backendBase}/api/restaurants?slug=${encodeURIComponent(trimmed)}`
    );
  }

  urlCandidates.push(`${backendBase}/api/restaurants/${trimmed}`);

  const seen = new Set<string>();

  for (const url of urlCandidates) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const payload = await fetchJson(url);
    const mapped = tryMapPayload(payload, trimmed);
    if (mapped) return mapped;
  }

  const listPayload = await fetchJson(`${backendBase}/api/restaurants`);
  if (listPayload) {
    const mapped = tryMapPayload(listPayload, trimmed);
    if (mapped) return mapped;
  }

  return null;
}

export async function fetchWeeklyCombos(
  restaurantId: string
): Promise<WeeklyComboEntry[] | null> {
  const backendBase = getBackendBase();
  if (!backendBase || !restaurantId) return null;
  const trimmed = restaurantId.trim();
  if (!trimmed) return null;
  const url = `${backendBase}/api/restaurants/${encodeURIComponent(trimmed)}/weekly-combos`;
  const payload = await fetchJson(url);
  if (!payload) return null;
  return normalizeWeeklyComboPayload(payload);
}

export const resolveLocalizedText = (
  value: string | LocalizedRecord | undefined,
  localePriority: string[]
): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  for (const locale of localePriority) {
    const candidate = value[locale];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  for (const candidate of Object.values(value)) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
};

export const pickRestaurantName = (
  record: RestaurantRecord,
  localePriority: Locale[]
): string | undefined => {
  const priority = Array.from(
    new Set<string>([...localePriority, "mk", "en", "sq", "tr"])
  );

  return (
    resolveLocalizedText(record.localizedName, priority) ??
    record.plainName ??
    undefined
  );
};

export const pickRestaurantDescription = (
  record: RestaurantRecord,
  localePriority: Locale[]
): string | undefined => {
  const priority = Array.from(
    new Set<string>([...localePriority, "mk", "en", "sq", "tr"])
  );

  return resolveLocalizedText(
    typeof record.description === "string"
      ? record.description
      : record.description,
    priority
  );
};
