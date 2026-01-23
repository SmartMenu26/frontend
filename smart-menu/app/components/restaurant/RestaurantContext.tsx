"use client";

import { useState } from "react";
import MenuBrowser from "@/app/components/menuBrowser/MenuBrowser";
import PopularSection from "@/app/components/popularSection/PopularSection";
import type { MealKind } from "@/app/data/dummyMenuCategories";

export default function RestaurantContent({ restaurantId }: { restaurantId: string }) {
  const [mealType, setMealType] = useState<MealKind>("food");

  return (
    <>
      <MenuBrowser
        restaurantId={restaurantId}
        mealType={mealType}
        onMealTypeChange={setMealType}
      />
      <PopularSection restaurantId={restaurantId} mealType={mealType} />
    </>
  );
}
