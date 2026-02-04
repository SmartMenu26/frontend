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

  return (
    <AiAssistantContent
      restaurantId={restaurantId}
      suggestionPrompts={suggestionPrompts}
      prompt={prompt}
    />
  );
}
