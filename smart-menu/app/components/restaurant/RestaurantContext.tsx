"use client";

import { useEffect, useMemo, useState } from "react";
import MenuBrowser from "@/app/components/menuBrowser/MenuBrowser";
import PopularSection from "@/app/components/popularSection/PopularSection";
import type { MealKind } from "@/app/data/dummyMenuCategories";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PrefetchedMenuData } from "@/app/lib/menuPrefetch";

type Props = {
  restaurantId: string;
  initialMenuData?: PrefetchedMenuData | null;
};

export default function RestaurantContent({ restaurantId, initialMenuData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const initialMealType = useMemo<MealKind>(() => {
    const params = new URLSearchParams(searchParamsString);
    const param = params.get("kind");
    return param === "drink" ? "drink" : "food";
  }, [searchParamsString]);

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
        mealType={mealType}
        onMealTypeChange={setMealType}
        initialData={initialMenuData ?? undefined}
      />
      <PopularSection restaurantId={restaurantId} mealType={mealType} />
    </>
  );
}
