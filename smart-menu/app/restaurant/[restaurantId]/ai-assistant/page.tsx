import AiAssistantContent from "@/app/components/aiAssistant/AiAssistantContent";

type Props = {
  params: Promise<{ restaurantId: string }>;
  searchParams?: Promise<{ prompt?: string }>;
};

const suggestionPrompts = [
  {
    id: "no-lactose",
    label: "Сакам храна без лактоза",
    icon: "/icons/sparkie.svg",
  },
  {
    id: "light",
    label: "Нешто лесно",
    icon: "/icons/sparkie.svg",
  },
  {
    id: "sport",
    label: "Што да јадам за тренинг?",
    icon: "/icons/sparkie.svg",
  },
  {
    id: "surprise",
    label: "Изненади ме",
    icon: "/icons/sparkie.svg",
  },
];

export default async function AiAssistantPage({ params, searchParams }: Props) {
  const { restaurantId } = await params;
  const { prompt = "" } = (searchParams ? await searchParams : {}) ?? {};

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
          : restaurant?.aiAssistantName?.mk ??
          restaurant?.aiAssistantName?.en ??
          restaurant?.aiAssistantName?.sq
      }
      aiCreditsRemaining={aiCreditsRemaining}
    />
  );
}
