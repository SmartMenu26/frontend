"use client";

import { useEffect, useMemo, useState } from "react";
import MenuBrowser from "@/app/components/menuBrowser/MenuBrowser";
import PopularSection from "@/app/components/popularSection/PopularSection";
import type { MealKind } from "@/app/data/dummyMenuCategories";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  restaurantId: string;
  restaurantSlug?: string;
};

export default function RestaurantContent({
  restaurantId,
  restaurantSlug,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const { kind: kindParam, categoryId: initialCategoryId, subcategoryId: initialSubcategoryId } = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    return {
      kind: params.get("kind"),
      categoryId: params.get("categoryId") ?? undefined,
      subcategoryId: params.get("subcategoryId") ?? undefined,
    };
  }, [searchParamsString]);

  const initialMealType: MealKind = kindParam === "drink" ? "drink" : "food";

  const [mealType, setMealType] = useState<MealKind>(initialMealType);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    if (mealType === "food") {
      params.delete("kind");
    } else {
      params.set("kind", mealType);
    }

    const nextSearch = params.toString();
    if (nextSearch === searchParamsString) return;

    const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [mealType, pathname, router, searchParamsString]);

  return (
    <>
      <MenuBrowser
        restaurantId={restaurantId}
        restaurantSlug={restaurantSlug}
        mealType={mealType}
        onMealTypeChange={setMealType}
        initialCategoryId={initialCategoryId}
        initialSubcategoryId={initialSubcategoryId}
      />
      <PopularSection
        restaurantId={restaurantId}
        restaurantSlug={restaurantSlug}
        mealType={mealType}
      />
    </>
  );
}
