import type { Metadata } from "next";
import InstallAppButton from "@/app/_components/InstallAppButton";
import AiSuggestion from "@/app/components/aiSuggestion/aiSuggestion";
import RestaurantContent from "@/app/components/restaurant/RestaurantContext";
import Footer from "@/app/components/ui/Footer";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import LanguageSwitcher from "@/app/components/languageSwitcher/LanguageSwitcher";
import type { MealKind } from "@/app/data/dummyMenuCategories";
import { fetchInitialMenuData } from "@/app/lib/menuPrefetch";
import {
  fetchRestaurantRecord,
  pickRestaurantDescription,
  pickRestaurantName,
  resolveLocalizedText,
} from "@/app/lib/restaurants";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { notFound, redirect } from "next/navigation";

export const revalidate = 3600;

const TITLE_COPY: Record<Locale, (name: string, city?: string) => string> = {
  mk: (name, city) => `Мени | ${name}${city ? ` – ${city}` : ""} | Smart Menu`,
  sq: (name, city) => `Menu | ${name}${city ? ` – ${city}` : ""} | Smart Menu`,
  en: (name, city) => `Menu | ${name}${city ? ` – ${city}` : ""} | Smart Menu`,
};

const DESCRIPTION_COPY: Record<Locale, (name: string, city?: string) => string> = {
  mk: (name, city) =>
    `Официјално дигитално мени на ${name}${city ? ` во ${city}` : ""}. QR мени со цени, алергени и секојдневни специјалитети.`,
  sq: (name, city) =>
    `Menuja zyrtare digjitale e ${name}${city ? ` në ${city}` : ""}. Menü QR me çmime, alergjenë dhe specialitete ditore.`,
  en: (name, city) =>
    `Official digital menu of ${name}${city ? ` in ${city}` : ""}. QR menu with live prices, allergens, and daily specials.`,
};

const HIGHLIGHT_LABELS: Record<Locale, { dishes: string; categories: string }> = {
  mk: { dishes: "Популарни јадења", categories: "Категории" },
  sq: { dishes: "Pjata të njohura", categories: "Kategori" },
  en: { dishes: "Popular dishes", categories: "Menu sections" },
};

const DESCRIPTION_MAX_LENGTH = 320;
const HIGHLIGHT_MEAL_TYPE: MealKind = "food";

const dedupeValues = (values: string[]): string[] => {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(trimmed);
  }

  return unique;
};

const toLocalizedRecord = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record: Record<string, string> = {};

  for (const [key, candidate] of Object.entries(value)) {
    if (typeof candidate === "string" && candidate.trim()) {
      record[key] = candidate.trim();
    }
  }

  return Object.keys(record).length ? record : undefined;
};

const resolveMenuLabel = (
  value: unknown,
  localePriority: Locale[],
  fallback?: string
): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = resolveMenuLabel(entry, localePriority);
      if (resolved) return resolved;
    }
  } else if (value && typeof value === "object") {
    const localizedRecord = toLocalizedRecord(value);
    if (localizedRecord) {
      const localized = resolveLocalizedText(localizedRecord, localePriority);
      if (localized) return localized;
    }
  }

  if (typeof fallback === "string") {
    const trimmedFallback = fallback.trim();
    if (trimmedFallback) return trimmedFallback;
  }

  return undefined;
};

const composeDescription = (base: string, additions: string[]): string => {
  const full = [base, ...additions.filter((entry) => entry && entry.trim())]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (full.length <= DESCRIPTION_MAX_LENGTH) {
    return full;
  }

  return `${full.slice(0, DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`;
};

const buildMenuHighlights = async (
  restaurantId: string,
  localePriority: Locale[]
): Promise<{ categories: string[]; dishes: string[] } | null> => {
  try {
    const prefetched = await fetchInitialMenuData({
      restaurantId,
      mealType: HIGHLIGHT_MEAL_TYPE,
    });

    if (!prefetched) {
      return null;
    }

    const categoryNames = Array.isArray(prefetched.rawCategories)
      ? dedupeValues(
          prefetched.rawCategories
            .slice()
            .sort((a: any, b: any) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
            .map((category: any) =>
              resolveMenuLabel(
                category?.name ?? category?.label ?? category?.title,
                localePriority,
                typeof category?._id === "string" ? category._id : undefined
              )
            )
            .filter((label): label is string => Boolean(label))
        ).slice(0, 3)
      : [];

    const dishNames = Array.isArray(prefetched.rawItems)
      ? dedupeValues(
          prefetched.rawItems
            .map((item: any) =>
              resolveMenuLabel(
                item?.name ?? item?.title ?? item?.label,
                localePriority,
                typeof item?.plainName === "string"
                  ? item.plainName
                  : typeof item?.slug === "string"
                  ? item.slug
                  : undefined
              )
            )
            .filter((label): label is string => Boolean(label))
        ).slice(0, 5)
      : [];

    if (!categoryNames.length && !dishNames.length) {
      return null;
    }

    return {
      categories: categoryNames,
      dishes: dishNames,
    };
  } catch (error) {
    console.warn("[restaurant:metadata] Failed to build menu highlights", error);
    return null;
  }
};

type PageParams = {
  locale: string;
  restaurantSlug: string;
};

type SearchParams = {
  kind?: string;
  categoryId?: string;
  subcategoryId?: string;
};

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<SearchParams>;
};

const OBJECT_ID_REGEX = /^[a-f\\d]{24}$/i;

const getLocalePriority = (locale: Locale): Locale[] =>
  Array.from(new Set<Locale>([locale, defaultLocale, "en" as Locale, "sq" as Locale]));

const formatTitle = (locale: Locale, name: string, city?: string) =>
  (TITLE_COPY[locale] ?? TITLE_COPY.mk)(name, city);

const formatDescription = (locale: Locale, name: string, city?: string) =>
  (DESCRIPTION_COPY[locale] ?? DESCRIPTION_COPY.mk)(name, city);

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale: routeLocale, restaurantSlug } = await params;
  const resolvedLocale: Locale =
    locales.find((candidate) => candidate === routeLocale) ?? defaultLocale;
  const record = await fetchRestaurantRecord(restaurantSlug);

  if (!record) {
    const fallbackTitle = formatTitle(resolvedLocale, "Smart Menu");
    const fallbackDescription = formatDescription(resolvedLocale, "Smart Menu");
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }

  const localePriority = getLocalePriority(resolvedLocale);
  const name =
    pickRestaurantName(record, localePriority) ?? record.plainName ?? "Smart Menu";
  const city = record.city;
  const customDescription = pickRestaurantDescription(record, localePriority);

  const highlightLabels = HIGHLIGHT_LABELS[resolvedLocale] ?? HIGHLIGHT_LABELS.mk;
  const menuHighlights =
    record.id ? await buildMenuHighlights(record.id, localePriority) : null;

  const highlightSentences: string[] = [];

  if (menuHighlights?.dishes?.length) {
    highlightSentences.push(
      `${highlightLabels.dishes}: ${menuHighlights.dishes.join(", ")}.`
    );
  }

  if (menuHighlights?.categories?.length) {
    highlightSentences.push(
      `${highlightLabels.categories}: ${menuHighlights.categories.join(", ")}.`
    );
  }

  const title = formatTitle(resolvedLocale, name, city);
  const baseDescription = customDescription ?? formatDescription(resolvedLocale, name, city);
  const description = composeDescription(baseDescription, highlightSentences);
  const canonicalPath = buildLocalizedPath(
    `/restaurant/${record.slug}`,
    resolvedLocale
  );
  const ogImages = record.heroImageUrl ? [{ url: record.heroImageUrl }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages?.map((image) => image.url),
    },
  };
}

export default async function RestaurantPage({ params, searchParams }: PageProps) {
  const { locale: routeLocale, restaurantSlug } = await params;
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
    OBJECT_ID_REGEX.test(restaurantSlug)
  ) {
    const base = buildLocalizedPath(`/restaurant/${record.slug}`, resolvedLocale);
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearch)) {
      if (typeof value === "string" && value.length > 0) {
        qs.set(key, value);
      }
    }
    const target = qs.size > 0 ? `${base}?${qs.toString()}` : base;
    redirect(target);
  }

  const initialMealType: MealKind =
    resolvedSearch.kind === "drink" ? "drink" : "food";
  const requestedCategoryId =
    typeof resolvedSearch.categoryId === "string"
      ? resolvedSearch.categoryId
      : undefined;
  const requestedSubcategoryId =
    typeof resolvedSearch.subcategoryId === "string"
      ? resolvedSearch.subcategoryId
      : undefined;

  const initialMenuData = await fetchInitialMenuData({
    restaurantId: record.id,
    mealType: initialMealType,
    categoryId: requestedCategoryId,
    subcategoryId: requestedSubcategoryId,
  });

  const localePriority = getLocalePriority(resolvedLocale);
  const restaurantName =
    pickRestaurantName(record, localePriority) ?? record.plainName ?? undefined;
  const assistantDisplayName = resolveLocalizedText(
    typeof record.assistantName === "string"
      ? record.assistantName
      : record.assistantName,
    localePriority
  );

  return (
    <>
      <div className="pt-8 flex flex-col gap-6">
        <InstallAppButton />
        <RestaurantHeader name={restaurantName} />

        <AiSuggestion
          restaurantId={record.id}
          restaurantSlug={record.slug}
          assistantName={assistantDisplayName}
        />

        <RestaurantContent
          restaurantId={record.id}
          restaurantSlug={record.slug}
          initialMenuData={initialMenuData}
        />

        <Footer />
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
    </>
  );
}
