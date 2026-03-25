"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

const CARD_IMAGE_SIZE = 155;
const CARD_IMAGE_SIZES = "155px";
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTU1IiBoZWlnaHQ9IjE1NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTU1IiBoZWlnaHQ9IjE1NSIgZmlsbD0iI0U4RTdFOSIvPjwvc3ZnPg==";
const PRIORITY_CARD_COUNT = 2;

type CardVariant = "default" | "popular";
type CardLayout = "stacked" | "list";

type CardProps = {
  title: string;
  imageUrl: string;
  priceLabel?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  variant?: CardVariant;
  index?: number;
  kind?: string;
  layout?: CardLayout;
};

export default function Card({
  title,
  imageUrl,
  priceLabel,
  description,
  onClick,
  className = "",
  variant = "default",
  index,
  kind,
  layout = "stacked",
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
  const isListLayout = layout === "list";

  useEffect(() => {
    setImageLoaded(false);
  }, [imageUrl]);

  const tileSizeClasses = "h-[200px] w-[200px]";
  const tileImageClasses = "-top-4 h-[155px] w-[155px]";
  const tileTitleClasses = "mt-[48px] text-[17px] font-regular line-clamp-2";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "cursor-pointer text-left group",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#355B4B]/50",
        isListLayout
          ? [
              "flex w-full items-center gap-4 px-1 py-3",
              "rounded-none border-none bg-transparent",
              "transition-colors duration-150",
              "hover:bg-[#F6F8F7]",
            ].join(" ")
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isListLayout ? (
        <div className="flex w-full items-center gap-4">
          <div className="relative h-[64px] w-[64px] flex-shrink-0 overflow-hidden rounded-2xl border border-[#E1E6E3] bg-[#F8FBF9]">
            <div
              aria-hidden
              className={[
                "absolute inset-0 bg-[#E8EEE9]",
                "transition-opacity duration-300",
                imageLoaded ? "opacity-0" : "opacity-100",
              ].join(" ")}
            />
            <Image
              src={imageUrl}
              alt={title}
              width={96}
              height={96}
              priority={shouldPrioritizeImage}
              loading={shouldPrioritizeImage ? "eager" : "lazy"}
              fetchPriority={shouldPrioritizeImage ? "high" : "low"}
              quality={75}
              sizes="96px"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              onLoad={() => setImageLoaded(true)}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium leading-snug text-[#0B1F17] line-clamp-2">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-[#6B726E] line-clamp-1">{description}</p>
            )}
          </div>
          <div className="ml-2 flex items-center gap-2 text-[#0F241A]">
            {priceLabel && (
              <span className="text-base font-semibold whitespace-nowrap">
                {priceLabel}
              </span>
            )}
            <ArrowUpRight
              size={18}
              aria-hidden
              className="text-[#6E7571] transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </div>
        </div>
      ) : (
        <>
          <div
            className={[
              "flex items-end justify-center relative rounded-[21px]",
              "pt-20 pb-2 px-4 overflow-visible",
              tileSizeClasses,
              bg,
              "shadow-md",
              "transition-all duration-300 ease-out",
              "hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
              "hover:-translate-y-px",
            ].join(" ")}
          >
            <div
              className={[
                "absolute left-1/2 -translate-x-1/2",
                tileImageClasses,
              ].join(" ")}
            >
              <div
                aria-hidden
                className={[
                  "absolute inset-0 rounded-full bg-white/20",
                  "transition-opacity duration-300",
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
                onLoad={() => setImageLoaded(true)}
                className="rounded-full h-full w-full object-cover shadow-[0_0_12px_-4px_rgba(63,93,80,0.35)]"
              />
            </div>
            <h3
              className={[
                "text-white leading-tight text-center min-h-[32px]",
                tileTitleClasses,
              ].join(" ")}
            >
              {title}
            </h3>
          </div>
          {priceLabel && (
            <div className="mt-2 flex justify-center">
              <div className={["rounded-full border px-2 py-1 font-normal text-sm", border, text].join(" ")}>
                {priceLabel}
              </div>
            </div>
          )}
        </>
      )}
    </button>
  );
}
