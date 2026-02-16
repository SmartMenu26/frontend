"use client";

import Image from "next/image";
import React from "react";

type CardVariant = "default" | "popular";

type CardProps = {
  title: string;
  imageUrl: string;
  priceLabel?: string;
  onClick?: () => void;
  className?: string;
  variant?: CardVariant;
  index?: number;
  kind?: string;
};

export default function Card({
  title,
  imageUrl,
  priceLabel,
  onClick,
  className = "",
  variant = "default",
  index,
  kind,
}: CardProps) {
  const normalizedKind = kind?.toLowerCase();
  const isDrink = variant !== "popular" && normalizedKind === "drink";
  const bg =
    variant === "popular"
      ? "bg-[#A16B00]"
      : isDrink
      ? "bg-[#6B2E2E]"
      : "bg-[#355B4B]";
  const text =
    variant === "popular"
      ? "text-[#A16B00]"
      : isDrink
      ? "text-[#6B2E2E]"
      : "text-[#355B4B]";
  const border =
    variant === "popular"
      ? "border-[#A16B00]"
      : isDrink
      ? "border-[#6B2E2E]"
      : "border-[#355B4B]";
  
  const sizeClasses =
    variant === "popular"
      ? "h-[200px] w-[200px]"
      : "h-[200px] w-[200px]";

  const imageClasses =
    variant === "popular"
      ? "-top-4 h-[155px] w-[155px]"
      : "-top-4 h-[155px] w-[155px]";

const titleClasses =
  variant === "popular"
    ? "mt-[48px] text-[17px] font-regular line-clamp-2"
    : "mt-[48px] text-[17px] font-regular line-clamp-2";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "cursor-pointer text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        className,
      ].join(" ")}
    >
      {/* CARD */}
      <div
        className={[
          "flex items-end justify-center relative rounded-[21px]",
          "pt-20 pb-2 px-4 overflow-visible",
          sizeClasses,
          bg,

          // base
          "shadow-md",

          // hover
          "transition-all duration-300 ease-out",
          "hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
          "hover:-translate-y-px",
        ].join(" ")}
      >


          {/* IMAGE */}
          <Image
            src={imageUrl}
            alt={title}
            width={variant === "popular" ? 100 : 100}
            height={variant === "popular" ? 100 : 100}
            priority
            quality={60}
            sizes={variant === "popular" ? "100px" : "100px"}
            className={[
              "rounded-full absolute left-1/2 -translate-x-1/2 object-cover shadow-[0_0_12px_-4px_rgba(63,93,80,0.35)]",
              imageClasses,
            ].join(" ")}
          />


        {/* TITLE */}
        <h3
          className={[
            "text-white leading-tight text-center min-h-[32px]",
            titleClasses,
          ].join(" ")}
        >
          {title}
        </h3>

      </div>

      {/* PRICE */}
      {priceLabel && (
        <div className="mt-2 flex justify-center">
          <div className={["rounded-full border px-2 py-1 font-normal text-sm", border, text].join(" ")}>
            {priceLabel}
          </div>
        </div>
      )}
    </button>
  );
}
