"use client";

import { useRouter } from "next/navigation";
import ChipsRow, { ChipItem } from "../ui/ChipsRow";
import {
  Star,
  ChefHat,
  Drumstick,
  Leaf,
  Dice5,
  Flame,
  Dumbbell,
  Target,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { trackEvent } from "@/app/lib/analytics";

type RestaurantChipSuggestion = {
  label: string;
  icon?: string;
};

type AiSuggestionProps = {
  className?: string;
  restaurantId?: string;
  restaurantSlug?: string;
  assistantName?: string;
  aiSuggestions?: RestaurantChipSuggestion[];
};

const DEFAULT_CHIP_COLORS = [
  "bg-[#386c42] text-white hover:bg-[#70B77E]/90",
  "bg-[#844b38] text-white hover:bg-[#B4654A]/90",
  "bg-[#436d8a] text-white hover:bg-[#7EA0B7]/90",
  "bg-[#C33149] text-white hover:bg-[#C33149]/90",
] as const;

const getSuggestionIcon = (iconName?: string, index = 0) => {
  const normalized = iconName?.trim().toLowerCase();

  switch (normalized) {
    case "leaf":
      return <Leaf size={16} />;
    case "dumbbell":
      return <Dumbbell size={16} />;
    case "target":
      return <Target size={16} />;
    case "zap":
      return <Zap size={16} />;
    case "flame":
      return <Flame size={16} />;
    case "drumstick":
      return <Drumstick size={16} />;
    case "dice":
    case "dice5":
      return <Dice5 size={16} />;
    default: {
      const fallbackIcons = [
        <Leaf key="leaf" size={16} />,
        <Drumstick key="drumstick" size={16} />,
        <Dice5 key="dice" size={16} />,
        <Flame key="flame" size={16} />,
      ];
      return fallbackIcons[index % fallbackIcons.length];
    }
  }
};

export default function AiSuggestion({
  className = "",
  restaurantId,
  restaurantSlug,
  assistantName,
  aiSuggestions,
}: AiSuggestionProps) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("aiSuggestion");

  const assistantLabel = assistantName?.trim()
    ? t("chips.askNamed", { name: assistantName.trim() })
    : t("chips.askAssistant");

  const defaultSuggestionChips: RestaurantChipSuggestion[] = [
    {
      label: t("chips.healthy"),
      icon: "leaf",
    },
    {
      label: t("chips.protein"),
      icon: "drumstick",
    },
    {
      label: t("chips.surprise"),
      icon: "dice5",
    },
    {
      label: t("chips.spicy"),
      icon: "flame",
    },
  ];
  const suggestionChips =
    aiSuggestions && aiSuggestions.length > 0
      ? aiSuggestions
      : defaultSuggestionChips;

  const chips: ChipItem[] = [
    {
      id: "ask-assistant",
      label: assistantLabel,
      icon: <ChefHat size={16} />,
      variant: "outline",
      colorClassName: "uppercase",
    },
    ...suggestionChips.map((suggestion, index) => ({
      id: `suggestion-${index}`,
      label: suggestion.label,
      icon: getSuggestionIcon(suggestion.icon, index),
      variant: "solid" as const,
      colorClassName: DEFAULT_CHIP_COLORS[index % DEFAULT_CHIP_COLORS.length],
    })),
  ];

  const handleChipClick = (chipId: string) => {
    const slugOrId = restaurantSlug ?? restaurantId;
    const base = slugOrId
      ? `/restaurant/${slugOrId}/ai-assistant`
      : "/ai-assistant";
    const localizedBase = buildLocalizedPath(base, locale);

    const chip = chips.find((c) => c.id === chipId);
    const prompt = chip && chip.id !== "ask-assistant" ? chip.label : undefined;
    const target =
      prompt?.trim() && chip?.id !== "ask-assistant"
        ? `${localizedBase}?prompt=${encodeURIComponent(prompt.trim())}`
        : localizedBase;

    trackEvent("ai_suggestion_chip", {
      chip_id: chipId,
      locale,
      restaurantId: restaurantId ?? "public",
    });

    router.push(target);
  };

  return (
    <section className={`container mx-auto${className}`}>
      <div className="space-y-3 md:px-0 pl-4 pt-5 ">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Star size={14} fill="currentColor" className="text-[#E0D14E]" />
          <span className="uppercase text-[#4D4747]">{t("subtitle")}</span>
        </div>

        <ChipsRow items={chips} onChipClick={handleChipClick} />
      </div>
    </section>
  );
}
