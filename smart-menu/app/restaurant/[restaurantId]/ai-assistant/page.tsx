import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import Image from "next/image";
import assistantIllustration from "@/public/images/ai-assistant-cook.png";
import AiAssistantPromptPanel from "@/app/components/aiAssistant/AiAssistantPromptPanel";

type Props = {
  params: Promise<{ restaurantId: string }>;
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

export default async function AiAssistantPage({ params }: Props) {
  const { restaurantId } = await params;

  return (
    <div className="min-h-dvh  text-[#1E1F24]">
      <RestaurantHeader showName={false} />
      <div className="mx-auto bg-transparent flex w-full flex-col">
        <header className="flex items-center justify-between h-[10vh]">
          {/* back button */}
          <Link
            type="button"
            href={`/restaurant/${restaurantId}`}
            aria-label="Back"
            className="cursor-pointer absolute left-7 top-6 z-10 rounded-lg bg-black/80 p-1.5 backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>

        </header>

        <div className="h-[90vh] bg-white px-6 pb-8 pt-6 text-center flex flex-col justify-between">
          <p className="text-left text-xl text-[#4B4F54] leading-[1.6] font-light">
            Јас сум <span className="font-semibold text-[#1E1F24]">Бакал!</span>
            <br />
            Како можам да ви помогнам со изборот?
          </p>

          <div className="mt-6 flex justify-center">
            <Image
              src={assistantIllustration}
              alt="AI Асистент Бакал"
              priority
              className="h-auto w-60 max-w-full select-none"
            />
          </div>

          <AiAssistantPromptPanel suggestionPrompts={suggestionPrompts} />
        </div>
      </div>
    </div>
  );
}
