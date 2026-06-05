import FullMenuBrowser from "@/app/components/menuBrowser/FullMenuBrowser";
import { fetchRestaurantRecord } from "@/app/lib/restaurants";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { notFound, redirect } from "next/navigation";

export const revalidate = 3600;

type PageParams = {
  locale: string;
  restaurantSlug: string;
};

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const buildSearchString = (source: Record<string, string | string[] | undefined>) => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string" && value.length > 0) {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      value
        .filter((item) => item.length > 0)
        .forEach((item) => query.append(key, item));
    }
  }

  return query.toString();
};

export default async function RestaurantFullMenuPage({
  params,
  searchParams,
}: PageProps) {
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
    const base = buildLocalizedPath(
      `/restaurant/${record.slug}/menu`,
      resolvedLocale
    );
    const queryString = buildSearchString(resolvedSearch);
    redirect(queryString ? `${base}?${queryString}` : base);
  }

  return (
    <FullMenuBrowser
      restaurantId={record.id}
      restaurantSlug={record.slug}
    />
  );
}
