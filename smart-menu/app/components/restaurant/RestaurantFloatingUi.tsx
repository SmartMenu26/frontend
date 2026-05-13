"use client";

import LanguageSwitcher from "@/app/components/languageSwitcher/LanguageSwitcher";
import RestaurantStickyActions from "@/app/components/restaurant/RestaurantStickyActions";
import type { Locale } from "@/i18n";
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

  return (
    <>
      {orderSystem ? (
        <RestaurantStickyActions
          restaurantId={restaurantId}
          restaurantSlug={restaurantSlug}
        />
      ) : null}
      <div
        className={[
          "fixed right-4 z-30 md:bottom-4 md:z-50",
          orderSystem ? "bottom-28" : "bottom-6",
        ].join(" ")}
      >
        <LanguageSwitcher allowedLocales={supportedLanguages} />
      </div>
    </>
  );
}
