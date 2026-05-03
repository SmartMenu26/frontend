import { defaultLocale, type Locale } from "@/i18n";

export type LocalizedValue = Record<string, string | null | undefined>;

export type MenuItemPayload = {
  _id?: string;
  id?: string;
  name?: LocalizedValue | string;
  description?: LocalizedValue | string;
  allergens?: unknown;
  allergen?: unknown;
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
  calories?: unknown;
  proteinGrams?: unknown;
  carbsGrams?: unknown;
  fatGrams?: unknown;
  nutritionBreakdown?: unknown;
  ingredientBreakdown?: unknown;
  ingredientsBreakdown?: unknown;
  ingredientComposition?: unknown;
  [key: string]: unknown;
};

export type HealthCornerIngredientViewModel = {
  id?: string;
  label: string;
  value: number;
};

export type AllergenViewModel = {
  key: string;
  label: string;
  code?: string;
};

export type MenuItemViewModel = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  price?: number;
  allergens?: AllergenViewModel[];
  healthCornerIngredients?: HealthCornerIngredientViewModel[];
  nutritionSummary?: NutritionSummary;
};

export type NutritionSummary = {
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  macroDistribution?: {
    protein: number;
    carbs: number;
    fat: number;
  };
};

const FALLBACK_IMAGE = "/placeholder.jpg";

export const buildLocalePriority = (locale: Locale): Locale[] =>
  Array.from(
    new Set<Locale>([locale, defaultLocale, "en" as Locale, "sq" as Locale, "tr" as Locale])
  );

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

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
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

const parseIngredientPercent = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace("%", ""));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const normalizeAllergenToken = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildAllergenKey = (code?: string, label?: string, index?: number): string => {
  const normalizedCode = code ? normalizeAllergenToken(code) : "";
  if (normalizedCode) return normalizedCode;

  const normalizedLabel = label ? normalizeAllergenToken(label) : "";
  if (normalizedLabel) return normalizedLabel;

  return `allergen-${index ?? 0}`;
};

const readAllergenSource = (payload: MenuItemPayload): unknown[] | undefined => {
  const candidates = [payload.allergens, payload.allergen];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string" && candidate.trim()) {
      const trimmed = candidate.trim();

      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Support comma-separated strings from older payloads.
      }

      return trimmed
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }

  return undefined;
};

const readIngredientBreakdownSource = (
  payload: MenuItemPayload
): unknown[] | undefined => {
  const candidates = [
    payload.nutritionBreakdown,
    payload.ingredientBreakdown,
    payload.ingredientsBreakdown,
    payload.ingredientComposition,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string" && candidate.trim()) {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Ignore invalid JSON strings from older API payloads.
      }
    }
  }

  return undefined;
};

export const hasNutritionBreakdown = (payload: MenuItemPayload): boolean =>
  Boolean(readIngredientBreakdownSource(payload)?.length);

export const buildHealthCornerIngredients = (
  payload: MenuItemPayload,
  localePriority: Locale[]
): HealthCornerIngredientViewModel[] | undefined => {
  const source = readIngredientBreakdownSource(payload);

  if (!source) return undefined;

  const ingredients = source.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;

    const label = pickLocalizedValue(
      (record.label ?? record.name ?? record.ingredient ?? record.title) as
        | LocalizedValue
        | string
        | undefined,
      localePriority,
      ""
    );

    const value = parseIngredientPercent(
      record.percent ?? record.percentage ?? record.value ?? record.ratio
    );

    if (!label || value === undefined || value <= 0) return [];

    const id =
      typeof record.id === "string"
        ? record.id
        : typeof record.key === "string"
          ? record.key
          : undefined;

    return [
      {
        id: id ?? undefined,
        label,
        value: Math.min(100, value),
      },
    ];
  });

  return ingredients.length > 0 ? ingredients.slice(0, 6) : undefined;
};

const buildAllergens = (
  payload: MenuItemPayload,
  localePriority: Locale[]
): AllergenViewModel[] | undefined => {
  const source = readAllergenSource(payload);

  if (!source) return undefined;

  const allergens = source.flatMap((item, index) => {
    if (typeof item === "string") {
      const label = item.trim();
      if (!label) return [];

      const code = normalizeAllergenToken(label);
      if (!code || code === "none") return [];

      return [
        {
          key: buildAllergenKey(code, label, index),
          label,
          code,
        },
      ];
    }

    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    const label = pickLocalizedValue(
      (record.label ??
        record.name ??
        record.title ??
        record.value ??
        record.allergen) as LocalizedValue | string | undefined,
      localePriority,
      ""
    );
    const rawCode =
      typeof record.code === "string"
        ? record.code
        : typeof record.key === "string"
          ? record.key
          : typeof record.slug === "string"
            ? record.slug
            : typeof record.id === "string"
              ? record.id
              : label;
    const code = rawCode ? normalizeAllergenToken(rawCode) : undefined;
    const normalizedLabel = label.trim();

    if (!normalizedLabel && !code) return [];
    if (code === "none" || normalizeAllergenToken(normalizedLabel) === "none") {
      return [];
    }

    return [
      {
        key: buildAllergenKey(code, normalizedLabel, index),
        label: normalizedLabel,
        code,
      },
    ];
  });

  const deduped = allergens.filter((allergen, index, array) => {
    return (
      array.findIndex(
        (candidate) =>
          candidate.key === allergen.key ||
          (candidate.code &&
            allergen.code &&
            candidate.code === allergen.code)
      ) === index
    );
  });

  return deduped.length > 0 ? deduped : undefined;
};

const buildNutritionSummary = (
  payload: MenuItemPayload
): NutritionSummary | undefined => {
  const calories = parseNumber(payload.calories);
  const proteinGrams = parseNumber(payload.proteinGrams);
  const carbsGrams = parseNumber(payload.carbsGrams);
  const fatGrams = parseNumber(payload.fatGrams);

  if (
    calories === undefined &&
    proteinGrams === undefined &&
    carbsGrams === undefined &&
    fatGrams === undefined
  ) {
    return undefined;
  }

  const proteinCalories =
    proteinGrams !== undefined ? Math.max(0, proteinGrams) * 4 : 0;
  const carbsCalories =
    carbsGrams !== undefined ? Math.max(0, carbsGrams) * 4 : 0;
  const fatCalories = fatGrams !== undefined ? Math.max(0, fatGrams) * 9 : 0;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  return {
    calories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    macroDistribution:
      totalMacroCalories > 0
        ? {
            protein: (proteinCalories / totalMacroCalories) * 100,
            carbs: (carbsCalories / totalMacroCalories) * 100,
            fat: (fatCalories / totalMacroCalories) * 100,
          }
        : undefined,
  };
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
          tr: (payload.image as { alt?: string })?.alt,
        }
      : undefined;

  return {
    id: payload?._id ?? payload?.id ?? menuItemId,
    name,
    description,
    imageUrl: resolveImageUrl(payload) ?? FALLBACK_IMAGE,
    imageAlt: pickLocalizedValue(imageMeta, localePriority, name),
    price: parsePrice(payload?.price ?? payload?.priceValue),
    allergens: buildAllergens(payload, localePriority),
    healthCornerIngredients: buildHealthCornerIngredients(payload, localePriority),
    nutritionSummary: buildNutritionSummary(payload),
  };
};
