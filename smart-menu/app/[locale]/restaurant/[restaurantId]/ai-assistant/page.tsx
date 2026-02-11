import AiAssistantContent from "@/app/components/aiAssistant/AiAssistantContent";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; restaurantId: string }>;
  searchParams?: Promise<{ prompt?: string }>;
};

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
  const { locale, restaurantId } = await params;
  const { prompt = "" } = (searchParams ? await searchParams : {}) ?? {};
  const t = await getTranslations({ locale, namespace: "aiAssistantSuggestions" });

  const suggestionPrompts = suggestionPromptConfigs.map(({ messageKey, ...config }) => ({
    ...config,
    label: t(messageKey),
  }));

  const base = process.env.BACKEND_URL?.replace(/\/$/, "");

  if (!base) {
    console.error("AI assistant page error: BACKEND_URL missing");
  }

  const endpoint = base
    ? `${base}/api/admin/restaurants/${restaurantId}`
    : undefined;

  const res = endpoint
    ? await fetch(endpoint, { cache: "no-store" }).catch(() => null)
    : null;

  const payload = await res?.json().catch(() => null);
  const restaurant = payload?.data ?? payload ?? null;
  const aiCreditsRemaining =
    typeof restaurant?.aiCredits?.remaining === "number"
      ? restaurant.aiCredits.remaining
      : 0;

  return (
    <AiAssistantContent
      restaurantId={restaurantId}
      suggestionPrompts={suggestionPrompts}
      prompt={prompt}
      restaurantName={
        typeof restaurant?.name === "string"
          ? restaurant.name
          : restaurant?.name?.mk ?? restaurant?.name?.en ?? restaurant?.name?.sq
      }
      assistantName={
        typeof restaurant?.aiAssistantName === "string"
          ? restaurant.aiAssistantName
          : restaurant?.aiAssistantName ?? undefined
      }
      aiCreditsRemaining={aiCreditsRemaining}
    />
  );
}
