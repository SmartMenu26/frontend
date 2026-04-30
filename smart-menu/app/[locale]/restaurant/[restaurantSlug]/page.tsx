import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import InstallAppButton from "@/app/_components/InstallAppButton";
import AiSuggestion from "@/app/components/aiSuggestion/aiSuggestion";
import RestaurantContent from "@/app/components/restaurant/RestaurantContext";
import RestaurantDailyComboPrompt from "@/app/components/restaurant/RestaurantDailyComboPrompt";
import RestaurantContactCard, {
  type RestaurantContactLabels,
} from "@/app/components/restaurant/RestaurantContactCard";
import Footer from "@/app/components/ui/Footer";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import LanguageSwitcher from "@/app/components/languageSwitcher/LanguageSwitcher";
import {
  fetchRestaurantRecord,
  fetchWeeklyCombos,
  pickRestaurantDescription,
  resolveLocalizedText,
  pickRestaurantName,
  type DailyComboOffer,
  type WeeklyComboEntry,
} from "@/app/lib/restaurants";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { getSiteUrl } from "@/lib/siteMeta";
import { notFound, redirect } from "next/navigation";

export const revalidate = 3600;

const TITLE_COPY: Record<Locale, (name: string) => string> = {
  mk: (name) => `Мени | ${name} | Smart Menu`,
  sq: (name) => `Menu | ${name} | Smart Menu`,
  en: (name) => `Menu | ${name} | Smart Menu`,
  tr: (name) => `Menu | ${name} | Smart Menu`,
};

const DESCRIPTION_COPY: Record<Locale, (name: string, city?: string) => string> = {
  mk: (name, city) =>
    `Ова е дигиталното QR мени на ${name}${city ? ` во ${city}` : ""}. Менито е достапно преку Smart Menu платформа со AI асистент кој им помага на гостите полесно да изберат јадење.`,
  sq: (name, city) =>
    `Menuja zyrtare digjitale e ${name}${city ? ` në ${city}` : ""}. Menü QR me çmime, alergjenë dhe specialitete ditore.`,
  en: (name, city) =>
    `Official digital menu of ${name}${city ? ` in ${city}` : ""}. QR menu with live prices, allergens, and daily specials.`,
  tr: (name, city) =>
    `${name}${city ? ` ${city}` : ""} icin resmi dijital menu. Canli fiyatlar, alerjenler ve gunluk spesiyaller iceren QR menu.`,
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
  Array.from(
    new Set<Locale>([locale, defaultLocale, "en" as Locale, "sq" as Locale, "tr" as Locale])
  );

const formatTitle = (locale: Locale, name: string) =>
  (TITLE_COPY[locale] ?? TITLE_COPY.mk)(name);

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

  const title = formatTitle(resolvedLocale, name);
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
  const weeklyCombos = record?.id ? await fetchWeeklyCombos(record.id) : null;
  const siteUrl = getSiteUrl();

  if (!record?.id) {
    notFound();
  }

  const canonicalPath = buildLocalizedPath(`/restaurant/${record.slug}`, resolvedLocale);
  const absoluteMenuUrl = `${siteUrl}${canonicalPath}`;

  const hasContactDetails = Boolean(
    record.facebookUrl ||
      record.instagramUrl ||
      record.location ||
      record.mobilePhone
  );

  let contactLabels: RestaurantContactLabels | null = null;
  if (hasContactDetails) {
    const contactTranslations = await getTranslations({
      locale: resolvedLocale,
      namespace: "restaurantContact",
    });
    contactLabels = {
      title: contactTranslations("title"),
      location: contactTranslations("location"),
      phone: contactTranslations("phone"),
      call: contactTranslations("call"),
      facebook: contactTranslations("facebook"),
      instagram: contactTranslations("instagram"),
    };
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

  const localePriority = getLocalePriority(resolvedLocale);
  const restaurantName =
    pickRestaurantName(record, localePriority) ?? record.plainName ?? undefined;
  const assistantDisplayName = resolveLocalizedText(
    typeof record.assistantName === "string"
      ? record.assistantName
      : record.assistantName,
    localePriority
  );
  const resolvedAiSuggestions = record.aiSuggestions?.reduce<
    { label: string; icon?: string }[]
  >((acc, suggestion) => {
    const label = resolveLocalizedText(suggestion.label, localePriority);
    if (!label) return acc;
    acc.push({
      label,
      icon: suggestion.icon,
    });
    return acc;
  }, []);
  const contactDisplayName = record.fullRestaurantName ?? restaurantName;
  const schemaPayload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name:
      contactDisplayName ??
      restaurantName ??
      record.plainName ??
      record.localizedName?.mk ??
      record.slug,
    url: absoluteMenuUrl,
    hasMenu: absoluteMenuUrl,
  };

  if (record.heroImageUrl || record.imageUrl) {
    schemaPayload.image = record.heroImageUrl ?? record.imageUrl;
  }
  if (record.mobilePhone) {
    schemaPayload.telephone = record.mobilePhone;
  }
  const sameAs = [record.facebookUrl, record.instagramUrl].filter(
    (url): url is string => Boolean(url?.trim())
  );
  if (sameAs.length > 0) {
    schemaPayload.sameAs = sameAs;
  }
  if (record.location || record.city) {
    const address: Record<string, string> = { "@type": "PostalAddress", addressCountry: "MK" };
    if (record.location) address.streetAddress = record.location;
    if (record.city) address.addressLocality = record.city;
    schemaPayload.address = address;
  }

  const structuredData = JSON.stringify(schemaPayload);

  const dailyCombo = buildTodaysComboOffer(weeklyCombos, localePriority);

  return (
    <>
      <div className="pt-8 md:pt-0 flex flex-col gap-6">
        <InstallAppButton />
        <RestaurantHeader name={restaurantName} />

        <AiSuggestion
          restaurantId={record.id}
          restaurantSlug={record.slug}
          assistantName={assistantDisplayName}
          aiSuggestions={resolvedAiSuggestions}
        />

        <RestaurantContent
          restaurantId={record.id}
          restaurantSlug={record.slug}
        />

        {contactLabels ? (
          <RestaurantContactCard
            labels={contactLabels}
            restaurantName={contactDisplayName ?? undefined}
            location={record.location}
            phone={record.mobilePhone}
            facebookUrl={record.facebookUrl}
            instagramUrl={record.instagramUrl}
          />
        ) : null}

        <Footer />
      </div>
      {dailyCombo ? (
        <RestaurantDailyComboPrompt
          restaurantSlug={record.slug}
          locale={resolvedLocale}
          combo={dailyCombo}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <div className="fixed bottom-4 right-4 z-50">
        <LanguageSwitcher allowedLocales={record.supportedLanguages} />
      </div>
  </>
);
}

const COMBO_TIMEZONE = "Europe/Skopje";

function formatMkdPrice(value?: number): string | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }
  return `${Math.round(value)} ден`;
}

function buildTodaysComboOffer(
  weeklyCombos: WeeklyComboEntry[] | null,
  localePriority: Locale[]
): DailyComboOffer | null {
  if (!weeklyCombos?.length) {
    return null;
  }

  const todayKey = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: COMBO_TIMEZONE,
  })
    .format(new Date())
    .toLowerCase();

  const todayEntry = weeklyCombos.find(
    (entry) => entry.day?.toLowerCase() === todayKey && Array.isArray(entry.items) && entry.items.length > 0
  );

  if (!todayEntry?.items) {
    return null;
  }

  const items = todayEntry.items
    .map((item, index) => {
      const localizedTitle =
        resolveLocalizedText(
          typeof item.name === "string" ? item.name : (item.name as Record<string, string | null | undefined>),
          localePriority
        ) ?? (typeof item.name === "string" ? item.name : undefined);

      if (!localizedTitle) {
        return null;
      }

      const priceLabel = formatMkdPrice(item.price);
      const imageUrl = typeof item.image?.url === "string" ? item.image.url : null;
      const imageAlt = resolveLocalizedText(
        {
          mk: item.image?.altMk ?? item.image?.alt,
          sq: item.image?.altSq ?? item.image?.alt,
          en: item.image?.altEn ?? item.image?.alt,
          tr: item.image?.alt ?? undefined,
        },
        localePriority
      );

      return {
        id: item.menuItemId ?? `combo-${index}`,
        menuItemId: item.menuItemId ?? undefined,
        title: localizedTitle,
        price: priceLabel,
        imageUrl,
        imageAlt: imageAlt ?? undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (!items.length) {
    return null;
  }

  const totalPriceValue = todayEntry.items.reduce(
    (sum, item) => sum + (typeof item.price === "number" ? item.price : 0),
    0
  );

  return {
    title: undefined,
    subtitle: undefined,
    totalPrice: totalPriceValue > 0 ? formatMkdPrice(totalPriceValue) : undefined,
    items,
  };
}
