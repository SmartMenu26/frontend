"use client";

import { Drumstick, Wine } from "lucide-react";
import React from "react";
import { useTranslations } from "next-intl";

type MealType = "food" | "drink";

type Props = {
  value: MealType;
  onChange: (v: MealType) => void;
  className?: string;
};

export default function MealTypeToggle({ value, onChange, className = "" }: Props) {
  const t = useTranslations("mealTypeToggle");
  const base =
    "cursor-pointer border-b-2 border-transparent px-3 py-1 text-sm font-semibold uppercase tracking-wide " +
    "flex items-center gap-2 transition-colors duration-150 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#074128]/20";

  const active = "text-[#074128] border-b-[#074128]";
  const inactive = "text-[#6A736F] hover:text-[#44504A]";

  return (
    <div className={`flex justify-center gap-6 px-5 pb-8 ${className}`}>
      <button
        type="button"
        aria-label="Food"
        aria-pressed={value === "food"}
        onClick={() => onChange("food")}
        className={[base, value === "food" ? active : inactive].join(" ")}
      >
        <Drumstick size={18} />
        <span>{t("food")}</span>
      </button>

      <button
        type="button"
        aria-label="Drink"
        aria-pressed={value === "drink"}
        onClick={() => onChange("drink")}
        className={[base, value === "drink" ? active : inactive].join(" ")}
      >
        <Wine size={18} />
        <span>{t("drink")}</span>
      </button>
    </div>
  );
}
