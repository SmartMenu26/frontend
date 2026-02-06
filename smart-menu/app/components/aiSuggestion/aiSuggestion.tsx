"use client";

import { useRouter } from "next/navigation";
import ChipsRow, { ChipItem } from "../ui/ChipsRow";
import { Star, ChefHat, Drumstick, Leaf, Dice5, Flame } from "lucide-react";

type AiSuggestionProps = {
  className?: string;
  restaurantId?: string;
  assistantName?: string;
};

export default function AiSuggestion({
  className = "",
  restaurantId,
  assistantName,
}: AiSuggestionProps) {
  const router = useRouter();
  const assistantLabel = assistantName?.trim()
    ? `Прашај го ${assistantName.trim()}`
    : "Прашај го асистентот";

  const chips: ChipItem[] = [
    {
      id: "ask-bakal",
      label: assistantLabel,
      icon: <ChefHat size={16} />,
      variant: "outline",
      colorClassName:"uppercase"
    },
    {
      id: "protein",
      label: "Протеинско",
      icon: <Drumstick size={16} />,
      variant: "solid",
      colorClassName: "uppercase bg-[#B4654A] text-white hover:bg-[#B4654A]/90",
    },
    {
      id: "low-cal",
      label: "Здрава храна",
      icon: <Leaf size={16} />,
      variant: "solid",
      colorClassName: "uppercase bg-[#70B77E] text-white hover:bg-[#70B77E]/90",
    },
    {
      id: "protein2",
      label: "Изненади ме",
      icon: <Dice5 size={16} />,
      variant: "solid",
      colorClassName: "uppercase bg-[#7EA0B7] text-white hover:bg-[#7EA0B7]/90",
    },
    {
      id: "protein3",
      label: "Луто",
      icon: <Flame size={16} />,
      variant: "solid",
      colorClassName: "uppercase bg-[#C33149] text-white hover:bg-[#C33149]/90",
    },
  ];

  const handleChipClick = (chipId: string) => {
    const base = restaurantId
      ? `/restaurant/${restaurantId}/ai-assistant`
      : "/ai-assistant";

    const chip = chips.find((c) => c.id === chipId);
    const prompt = chip && chip.id !== "ask-bakal" ? chip.label : undefined;
    const target =
      prompt?.trim() && chip?.id !== "ask-bakal"
        ? `${base}?prompt=${encodeURIComponent(prompt.trim())}`
        : base;

    router.push(target);
  };

  return (
    <section className={`container mx-auto${className}`}>
      <div className="space-y-3 md:px-0 pl-6 py-5 ">
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
