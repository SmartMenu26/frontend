import type { Locale } from "@/i18n";

type LocalizedRecord = Record<string, string | null | undefined>;

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
};

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

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
    new Set<string>([...localePriority, "mk", "en", "sq"])
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
    new Set<string>([...localePriority, "mk", "en", "sq"])
  );

  return resolveLocalizedText(
    typeof record.description === "string"
      ? record.description
      : record.description,
    priority
  );
};
