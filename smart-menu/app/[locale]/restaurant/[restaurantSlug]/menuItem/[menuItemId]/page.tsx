import type { Metadata } from "next";
import MenuItemDetailsPageClient from "@/app/components/menuItemDetails/MenuItemDetailsPageClient";
import { defaultLocale, locales, type Locale } from "@/i18n";

type Params = {
  locale: Locale;
  restaurantSlug: string;
  menuItemId: string;
};

type PageProps = {
  params: Promise<Params>;
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const readableSlug = restaurantSlug.replace(/[-_]+/g, " ").trim();
  const baseTitle = readableSlug ? readableSlug : "Smart Menu";

  return {
    title: `Menu item | ${baseTitle} | Smart Menu`,
    description: "Discover single dishes inside Smart Menu's fully digital menus.",
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
