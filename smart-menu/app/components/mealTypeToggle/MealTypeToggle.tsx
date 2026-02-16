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
  const options: Array<{ value: MealType; label: string; Icon: typeof Drumstick }> = [
    { value: "food", label: t("food"), Icon: Drumstick },
    { value: "drink", label: t("drink"), Icon: Wine },
  ];
  const controlLabel = `${t("food")} / ${t("drink")}`;

  return (
    <div className={`flex justify-end items-end px-6 pb-8 ${className}`}>
      <div
        role="tablist"
        aria-label={controlLabel}
        className="inline-flex rounded-full border border-[#074128]/40 bg-white shadow-sm overflow-hidden"
      >
        {options.map(({ value: optionValue, label, Icon }) => {
          const isActive = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              role="tab"
              aria-pressed={isActive}
              aria-selected={isActive}
              onClick={() => onChange(optionValue)}
              className={[
                "min-w-[100px] px-3 py-1 text-sm font-semibold flex items-center justify-between gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#074128]/40",
                isActive
                  ? "bg-[#074128] text-white"
                  : "bg-transparent text-[#074128]"
              ].join(" ")}
            >
              <Icon size={18} />
              <span className="uppercase text-[12px] tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
