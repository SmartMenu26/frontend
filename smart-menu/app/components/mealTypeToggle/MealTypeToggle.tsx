"use client";

import { Drumstick, Wine } from "lucide-react";
import React from "react";

type MealType = "food" | "drink";

type Props = {
  value: MealType;
  onChange: (v: MealType) => void;
  className?: string;
};

export default function MealTypeToggle({ value, onChange, className = "" }: Props) {
  const base =
    "cursor-pointer h-9 w-9 rounded-full flex items-center justify-center border transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20";

  const active = "bg-[#074128] text-white";
  const inactive = "bg-white";

  return (
    <div className={`flex justify-end items-end gap-3 px-6 pb-4 ${className}`}>
      {/* Food */}
      <button
        type="button"
        aria-label="Food"
        aria-pressed={value === "food"}
        onClick={() => onChange("food")}
        className={[base, value === "food" ? active : inactive].join(" ")}
      >
        {/* simple icon: meat/food */}
        <span className="text-lg"><Drumstick size={20}/></span>
      </button>

      {/* Drink */}
      <button
        type="button"
        aria-label="Drink"
        aria-pressed={value === "drink"}
        onClick={() => onChange("drink")}
        className={[base, value === "drink" ? active : inactive].join(" ")}
      >
        <span className="text-lg"><Wine size={20}/></span>
      </button>
    </div>
  );
}
