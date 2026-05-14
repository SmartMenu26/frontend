"use client";

import { useRouter } from "next/navigation";
import ChipsRow, { ChipItem } from "../ui/ChipsRow";
import { Star, ChefHat } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { trackEvent } from "@/app/lib/analytics";
import {
  getSuggestionIconNode,
  isSuggestionImageIcon,
} from "@/app/components/aiSuggestion/suggestionIcons";

type RestaurantChipSuggestion = {
  label: string;
  icon?: string;
  prompt?: string;
};

type SuggestionChipItem = ChipItem & {
  prompt?: string;
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
  const proteinLabel = t("chips.protein").trim().toLowerCase();
  const proteinPrompt = t("prompts.protein");

  const resolvePrompt = (suggestion: RestaurantChipSuggestion) => {
    if (suggestion.prompt?.trim()) return suggestion.prompt;
    return suggestion.label.trim().toLowerCase() === proteinLabel
      ? proteinPrompt
      : suggestion.label;
  };

  const defaultSuggestionChips: RestaurantChipSuggestion[] = [
    {
      label: t("chips.healthy"),
      icon: "leaf",
    },
    {
      label: t("chips.protein"),
      icon: "drumstick",
      prompt: proteinPrompt,
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

  const chips: SuggestionChipItem[] = [
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
      icon: isSuggestionImageIcon(suggestion.icon) ? (
        <img
          src={suggestion.icon}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          className="h-4 w-4 opacity-90"
        />
      ) : (
        getSuggestionIconNode(suggestion.icon, index)
      ),
      variant: "solid" as const,
      colorClassName: DEFAULT_CHIP_COLORS[index % DEFAULT_CHIP_COLORS.length],
      prompt: resolvePrompt(suggestion),
    })),
  ];

  const handleChipClick = (chipId: string) => {
    const slugOrId = restaurantSlug ?? restaurantId;
    const base = slugOrId
      ? `/restaurant/${slugOrId}/ai-assistant`
      : "/ai-assistant";
    const localizedBase = buildLocalizedPath(base, locale);

    const chip = chips.find((c) => c.id === chipId);
    const prompt =
      chip && chip.id !== "ask-assistant"
        ? (chip.prompt ?? chip.label)
        : undefined;
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
      <div className="space-y-3 md:px-0 pl-4 pt-3 ">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Star size={14} fill="currentColor" className="text-[#E0D14E]" />
          <span className="uppercase text-[#4D4747]">{t("subtitle")}</span>
        </div>

        <ChipsRow items={chips} onChipClick={handleChipClick} />
      </div>
    </section>
  );
}
