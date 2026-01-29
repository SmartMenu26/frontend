"use client";

import { useRouter } from "next/navigation";
import ChipsRow, { ChipItem } from "../ui/ChipsRow";
import { Star, ChefHat, Drumstick, Leaf, Dice5, Flame } from "lucide-react";

type AiSuggestionProps = {
  className?: string;
  restaurantId?: string;
};

export default function AiSuggestion({
  className = "",
  restaurantId,
}: AiSuggestionProps) {
  const router = useRouter();

  const chips: ChipItem[] = [
    {
      id: "ask-bakal",
      label: "ПРАШАЈ ГО БАКАЛ",
      icon: <ChefHat size={16} />,
      variant: "outline",
    },
    {
      id: "protein",
      label: "ПРОТЕИНСКО",
      icon: <Drumstick size={16} />,
      variant: "solid",
      colorClassName: "bg-[#B4654A] text-white hover:bg-red-600",
    },
    {
      id: "low-cal",
      label: "ПОMАЛКУ КАЛОРИИ",
      icon: <Leaf size={16} />,
      variant: "solid",
      colorClassName: "bg-[#70B77E] text-white hover:bg-emerald-500",
    },
    {
      id: "protein2",
      label: "ИЗНЕНАДИ МЕ",
      icon: <Dice5 size={16} />,
      variant: "solid",
      colorClassName: "bg-[#7EA0B7] text-white hover:bg-red-600",
    },
    {
      id: "protein3",
      label: "ЛУТО",
      icon: <Flame size={16} />,
      variant: "solid",
      colorClassName: "bg-[#C33149] text-white hover:bg-red-600",
    },
  ];

  const handleChipClick = (id: string) => {
    if (id === "ask-bakal") {
      const target = restaurantId
        ? `/restaurant/${restaurantId}/ai-assistant`
        : "/ai-assistant";
      router.push(target);
      return;
    }
    if (id === "protein") {
      console.log("Apply protein filter");
      return;
    }
    if (id === "low-cal") {
      console.log("Apply low calories filter");
      return;
    }
  };

  return (
    <section className={`container mx-auto${className}`}>
      <div className=" space-y-3 md:px-0 pl-6 py-5 ">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Star size={14} fill="currentColor" className="text-[#E0D14E]" />
          <span className="uppercase text-[#4D4747]">БРЗИ AI ПРЕПОРАКИ ЗА ТЕБЕ</span>
        </div>

        <h2 className="text-lg font-normal text-(--color-primary)">
          Што сте расположени да јадете?
        </h2>

        <ChipsRow items={chips} onChipClick={handleChipClick} />
      </div>
    </section>
  );
}
