import AiAssistantContent from "@/app/components/aiAssistant/AiAssistantContent";
import {
  fetchRestaurantRecord,
  pickRestaurantName,
  resolveLocalizedText,
} from "@/app/lib/restaurants";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { buildLocalizedPath } from "@/lib/routing";

type Props = {
  params: Promise<{ locale: string; restaurantSlug: string }>;
  searchParams?: Promise<{ prompt?: string }>;
};

const OBJECT_ID_REGEX = /^[a-f\\d]{24}$/i;
const getLocalePriority = (locale: Locale): Locale[] =>
  Array.from(
    new Set<Locale>([locale, defaultLocale, "en" as Locale, "sq" as Locale, "tr" as Locale])
  );

const suggestionPromptConfigs = [
  {
    id: "no-lactose",
    icon: "/icons/sparkie.svg",
    messageKey: "prompts.noLactose",
  },
  {
    id: "light",
    icon: "/icons/sparkie.svg",
    messageKey: "prompts.light",
  },
  {
    id: "sport",
    icon: "/icons/sparkie.svg",
    messageKey: "prompts.sweet",
  },
  {
    id: "surprise",
    icon: "/icons/sparkie.svg",
    messageKey: "prompts.surprise",
  },
] as const;

export default async function AiAssistantPage({ params, searchParams }: Props) {
  const { locale, restaurantSlug } = await params;
  const resolvedLocale: Locale =
    locales.find((candidate) => candidate === locale) ?? defaultLocale;
  const record = await fetchRestaurantRecord(restaurantSlug);

  if (!record?.id) {
    notFound();
  }

  const { prompt = "" } = (searchParams ? await searchParams : {}) ?? {};

  if (
    record.slug &&
    record.slug !== restaurantSlug &&
    OBJECT_ID_REGEX.test(restaurantSlug)
  ) {
    const base = buildLocalizedPath(
      `/restaurant/${record.slug}/ai-assistant`,
      resolvedLocale
    );
    const target = prompt ? `${base}?prompt=${encodeURIComponent(prompt)}` : base;
    redirect(target);
  }

  const restaurantId = record.id;
  const t = await getTranslations({ locale, namespace: "aiAssistantSuggestions" });

  const base = process.env.BACKEND_URL?.replace(/\/$/, "");

  if (!base) {
    console.error("AI assistant page error: BACKEND_URL missing");
  }

  const endpoint = base
    ? `${base}/api/restaurants/${restaurantId}`
    : undefined;

  const res = endpoint
    ? await fetch(endpoint, { cache: "no-store" }).catch(() => null)
    : null;

  const payload = await res?.json().catch(() => null);
  const restaurant = payload?.data ?? payload ?? null;
  const aiCreditsAvailable =
    typeof restaurant?.aiCreditsAvailable === "boolean"
      ? restaurant.aiCreditsAvailable
      : typeof restaurant?.aiCredits?.remaining === "number"
        ? restaurant.aiCredits.remaining > 0
        : undefined;

  const fallbackRestaurantName =
    pickRestaurantName(record, [resolvedLocale]) ?? record.plainName;
  const localePriority = getLocalePriority(resolvedLocale);
  const restaurantSuggestionPrompts = record.aiSuggestions?.reduce<
    { id: string; label: string; icon?: string }[]
  >((acc, suggestion, index) => {
    const label = resolveLocalizedText(suggestion.label, localePriority);
    if (!label) return acc;
    acc.push({
      id: `restaurant-suggestion-${index}`,
      label,
      icon: suggestion.icon,
    });
    return acc;
  }, []);
  const defaultSuggestionPrompts = suggestionPromptConfigs.map(
    ({ messageKey, ...config }) => ({
      ...config,
      label: t(messageKey),
    })
  );
  const suggestionPrompts = [
    ...defaultSuggestionPrompts,
    ...(restaurantSuggestionPrompts ?? []),
  ].reduce<{ id: string; label: string; icon?: string }[]>((acc, suggestion) => {
    const normalizedLabel = suggestion.label.trim().toLowerCase();
    if (!normalizedLabel) return acc;
    if (acc.some((entry) => entry.label.trim().toLowerCase() === normalizedLabel)) {
      return acc;
    }
    acc.push(suggestion);
    return acc;
  }, []);

  return (
    <AiAssistantContent
      restaurantId={restaurantId}
      restaurantSlug={record.slug}
      suggestionPrompts={suggestionPrompts}
      prompt={prompt}
      restaurantName={
        typeof restaurant?.name === "string"
          ? restaurant.name
          : restaurant?.name?.mk ??
            restaurant?.name?.en ??
            restaurant?.name?.sq ??
            fallbackRestaurantName
      }
      assistantName={
        typeof restaurant?.aiAssistantName === "string"
          ? restaurant.aiAssistantName
          : restaurant?.aiAssistantName ?? record.assistantName ?? undefined
      }
      aiCreditsAvailable={aiCreditsAvailable}
      aiAssistantImageUrl={restaurant?.aiAssistantImageUrl}
      aiAssistantThinkingImageUrl={restaurant?.aiAssistantThinkingImageUrl}
      aiAssistantNoCreditsImageUrl={restaurant?.aiAssistantNoCreditsImageUrl}
    />
  );
}
