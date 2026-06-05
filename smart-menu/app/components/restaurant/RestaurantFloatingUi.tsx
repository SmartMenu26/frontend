"use client";

import LanguageSwitcher from "@/app/components/languageSwitcher/LanguageSwitcher";
import RestaurantStickyActions from "@/app/components/restaurant/RestaurantStickyActions";
import type { Locale } from "@/i18n";
import { useCallback, useState } from "react";
import useRestaurantOrderSystem from "./useRestaurantOrderSystem";

type Props = {
  restaurantId: string;
  restaurantSlug?: string;
  supportedLanguages?: Locale[];
  initialOrderSystem?: boolean;
};

export default function RestaurantFloatingUi({
  restaurantId,
  restaurantSlug,
  supportedLanguages,
  initialOrderSystem = false,
}: Props) {
  const orderSystem = useRestaurantOrderSystem({
    restaurantId,
    restaurantSlug,
    initialValue: initialOrderSystem,
  });
  const [stickyActionsVisible, setStickyActionsVisible] = useState(true);
  const handleStickyActionsVisibilityChange = useCallback((visible: boolean) => {
    setStickyActionsVisible(visible);
  }, []);

  return (
    <>
      {orderSystem ? (
        <RestaurantStickyActions
          restaurantId={restaurantId}
          restaurantSlug={restaurantSlug}
          onVisibilityChange={handleStickyActionsVisibilityChange}
        />
      ) : null}
      <div
        className={[
          "fixed right-4 z-30 transition-[bottom] duration-300 ease-out md:z-50",
          orderSystem && stickyActionsVisible
            ? "bottom-[calc(env(safe-area-inset-bottom)+68px)]"
            : "bottom-[calc(env(safe-area-inset-bottom)+8px)]",
        ].join(" ")}
      >
        <LanguageSwitcher allowedLocales={supportedLanguages} />
      </div>
    </>
  );
}
