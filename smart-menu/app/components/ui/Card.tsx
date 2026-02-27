"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";

const CARD_IMAGE_SIZE = 155;
const CARD_IMAGE_SIZES = "155px";
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTU1IiBoZWlnaHQ9IjE1NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTU1IiBoZWlnaHQ9IjE1NSIgZmlsbD0iI0U4RTdFOSIvPjwvc3ZnPg==";
const PRIORITY_CARD_COUNT = 2;

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
  const shouldPrioritizeImage = typeof index === "number" && index < PRIORITY_CARD_COUNT;
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
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    setImageLoaded(false);
  }, [imageUrl]);
  
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
          <div
            className={[
              "absolute left-1/2 -translate-x-1/2",
              imageClasses,
            ].join(" ")}
          >
            <div
              aria-hidden
              className={[
                "absolute inset-0 rounded-full bg-white/20",
                "animate-pulse transition-opacity duration-300",
                imageLoaded ? "opacity-0" : "opacity-100",
              ].join(" ")}
            />
            <Image
              src={imageUrl}
              alt={title}
              width={CARD_IMAGE_SIZE}
              height={CARD_IMAGE_SIZE}
              priority={shouldPrioritizeImage}
              loading={shouldPrioritizeImage ? "eager" : "lazy"}
              fetchPriority={shouldPrioritizeImage ? "high" : "low"}
              quality={65}
              sizes={CARD_IMAGE_SIZES}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              onLoadingComplete={() => setImageLoaded(true)}
              className="rounded-full h-full w-full object-cover shadow-[0_0_12px_-4px_rgba(63,93,80,0.35)]"
            />
          </div>


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
