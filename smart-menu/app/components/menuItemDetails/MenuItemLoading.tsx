"use client";

import { useTranslations } from "next-intl";

const DOTS = ["-0.3s", "-0.15s", "0s"] as const;

export default function MenuItemLoading() {
  const t = useTranslations("menuItemDetails");
  const loadingText = t("loadingLabel");

  return (
    <div
      className="flex w-full h-screen flex-col items-center justify-center gap-6 py-10"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {DOTS.map((delay) => (
          <span
            key={delay}
            className="h-2.5 w-2.5 rounded-full bg-[#4B5C55] animate-bounce"
            style={{ animationDelay: delay }}
          />
        ))}
      </div>
      <p className="text-sm text-[#4B4F54]">{loadingText}</p>
      <span className="sr-only">{loadingText}</span>
    </div>
  );
}
