"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import { DUMMY_ITEMS } from "@/app/data/dummyMenuItems";
import type { MealKind } from "@/app/data/dummyMenuCategories";
import { PopularSkeletonCard } from "../skeletons/popularItemsSkeleton";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { defaultLocale, type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

type MenuItem = {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
};

type PopularSectionProps = {
  restaurantId: string;
  mealType: MealKind;
  className?: string;
};

export default function PopularSection({
  restaurantId,
  mealType,
  className = "",
}: PopularSectionProps) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("popularSection");

  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(false);

  const labelPriority = useMemo(() => {
    const order: Locale[] = [];
    if (locale) order.push(locale);
    if (!order.includes(defaultLocale)) order.push(defaultLocale);
    if (!order.includes("en" as Locale)) order.push("en" as Locale);
    return order;
  }, [locale]);

  const resolveLocalizedTitle = useCallback(
    (name?: Record<string, string>, fallback = "Item") => {
      for (const key of labelPriority) {
        const value = name?.[key];
        if (value) return value;
      }
      const first = name ? Object.values(name).find(Boolean) : undefined;
      return first ?? fallback;
    },
    [labelPriority]
  );

  useEffect(() => {
    if (!restaurantId) return;

    let cancelled = false;

    async function loadPopular() {
      setLoadingPopular(true);

      try {
        const res = await fetch(
          `/api/menuItems/${restaurantId}/menu-items?kind=${mealType}&popular=true&limit=5`
        );

        if (!res.ok) throw new Error(`Popular request failed: ${res.status}`);

        const json = await res.json();
        if (cancelled) return;

        const data = json?.data ?? json;
        if (!Array.isArray(data)) throw new Error("Popular response is not an array");

        const mapped: MenuItem[] = data.map((m: any) => ({
          id: m._id ?? m.id,
          title: resolveLocalizedTitle(m?.name, m?.title ?? "Item"),
          imageUrl: m?.image?.url ?? m?.imageUrl ?? "",
          price: m?.price ?? 0,
        }));

        setPopularItems(mapped);
      } catch {
        const fallbackPopular = DUMMY_ITEMS
          .filter((it: any) => it.kind === mealType && it.isPopular)
          .slice(0, 5)
          .map(({ kind, categoryId, subcategoryId, isPopular, ...rest }: any) => rest);

        setPopularItems(fallbackPopular);
      } finally {
        if (!cancelled) setLoadingPopular(false);
      }
    }

    loadPopular();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, mealType, resolveLocalizedTitle]);

  const hasNoPopularItems = !loadingPopular && popularItems.length === 0;

  if (hasNoPopularItems) return null;

  return (
    <section className={`bg-white ${className}`}>
      <div className="container mx-auto">
        <div className="md:px-0 pl-4">
          <h2 className="text-2xl font-semibold text-[#7A5A2A] mb-4">
            {mealType === "food" ? t("title.food") : t("title.drink")}
          </h2>

          <div
            className="
              overflow-x-auto overflow-y-visible
              scroll-smooth
              [-webkit-overflow-scrolling:touch]
              [&::-webkit-scrollbar]:hidden
            "
          >
            <div className="flex gap-6 pb-4 pt-8 overflow-visible">
              {loadingPopular
                ? Array.from({ length: 5 }).map((_, idx) => (
                  <PopularSkeletonCard key={idx} />
                ))
                : popularItems.map((it, index) => (
                  <Card
                    key={it.id}
                    title={it.title}
                    imageUrl={it.imageUrl}
                    priceLabel={`${it.price}ден`}
                    kind={mealType}
                    onClick={() => {
                      const detailParams = new URLSearchParams();
                      detailParams.set("kind", mealType);
                      const detailHref = buildLocalizedPath(
                        `/restaurant/${restaurantId}/menuItem/${it.id}?${detailParams.toString()}`,
                        locale
                      );
                      router.push(detailHref);
                    }}
                    variant="popular"
                    className="shrink-0"
                    index={index}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
