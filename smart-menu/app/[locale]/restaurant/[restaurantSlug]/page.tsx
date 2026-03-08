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
    `Ова е дигиталното QR мени на ${name}${city ? ` во ${city}` : ""}. Менито е достапно преку Smart Menu платформа со AI асистент кој им помага на гостите полесно да изберат јадење.`,
  sq: (name, city) =>
    `Menuja zyrtare digjitale e ${name}${city ? ` në ${city}` : ""}. Menü QR me çmime, alergjenë dhe specialitete ditore.`,
  en: (name, city) =>
    `Official digital menu of ${name}${city ? ` in ${city}` : ""}. QR menu with live prices, allergens, and daily specials.`,
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

  const title = formatTitle(resolvedLocale, name, city);
  const description = customDescription ?? formatDescription(resolvedLocale, name, city);
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
