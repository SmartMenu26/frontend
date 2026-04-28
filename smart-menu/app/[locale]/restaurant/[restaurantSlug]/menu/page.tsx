import { permanentRedirect } from "next/navigation";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

export const revalidate = 3600;

type PageParams = {
  locale: string;
  restaurantSlug: string;
};

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RestaurantMenuRedirect({
  params,
  searchParams,
}: PageProps) {
  const { locale: routeLocale, restaurantSlug } = await params;
  const resolvedLocale: Locale =
    locales.find((candidate) => candidate === routeLocale) ?? defaultLocale;
  const resolvedSearch = (searchParams ? await searchParams : {}) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearch)) {
    if (typeof value === "string" && value.length > 0) {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      value
        .filter((item) => item.length > 0)
        .forEach((item) => query.append(key, item));
    }
  }

  const canonicalPath = buildLocalizedPath(
    `/restaurant/${restaurantSlug}`,
    resolvedLocale
  );
  const target =
    query.size > 0 ? `${canonicalPath}?${query.toString()}` : canonicalPath;

  permanentRedirect(target);
}
