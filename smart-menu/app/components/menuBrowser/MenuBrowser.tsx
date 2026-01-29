"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import CategoryLink from "../ui/CategoryLink";
import ChipsRow, { ChipItem } from "../ui/ChipsRow";
import Card from "../ui/Card";
import MealTypeToggle from "../mealTypeToggle/MealTypeToggle";
import type { MealKind, Category } from "@/app/data/dummyMenuCategories";
import { SkeletonCard } from "../skeletons/cardSkeleton";
import { CategorySkeleton } from "../skeletons/categorySkeleton";
import { useRouter } from "next/navigation";

type MenuItem = {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
};

type Props = {
    restaurantId: string;
    mealType: MealKind;
    onMealTypeChange: (next: MealKind) => void;
};


export default function MenuBrowser({ restaurantId, mealType, onMealTypeChange }: Props) {
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("all");

    const [items, setItems] = useState<MenuItem[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);

    const categoryContainerRef = useRef<HTMLDivElement | null>(null);
    const categoryRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [categoriesError, setCategoriesError] = useState<string | null>(null);

    const selectedCategory = useMemo(
        () => categories.find((c) => c.id === selectedCategoryId),
        [categories, selectedCategoryId]
    );

    useEffect(() => {
        if (!restaurantId) return;

        let cancelled = false;

        async function loadCategories() {
            setLoadingCategories(true);

            try {
                const res = await fetch(
                    `/api/restaurants/${restaurantId}/categories?kind=${mealType}`,
                    { cache: "no-store" }
                );


                if (!res.ok) throw new Error("Failed to load categories");

                const json = await res.json();
                if (cancelled) return;

                const data = json?.data ?? [];

                // 👇 map backend → UI Category
                const mapped: Category[] = data
                    .slice()
                    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((cat: any) => ({
                        id: cat._id,
                        label: cat.name?.mk ?? "Category",
                        subcategories: (cat.children ?? [])
                            .slice()
                            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                            .map((sub: any) => ({
                                id: sub._id,
                                label: sub.name?.mk ?? "Subcategory",
                            })),
                    }));

                setCategories(mapped);
                setSelectedCategoryId(mapped[0]?.id ?? "");
                setSelectedSubcategoryId("all");
            } catch (err) {
                console.error("Failed to load categories:", err);

                if (!cancelled) {
                    setCategories([]);
                    setSelectedCategoryId("");
                    setSelectedSubcategoryId("all");
                    setCategoriesError("Не успеав да ги вчитам категориите. Обиди се повторно.");
                }
            } finally {
                if (!cancelled) setLoadingCategories(false);
            }
        }

        loadCategories();

        return () => {
            cancelled = true;
        };
    }, [restaurantId, mealType]);


    // 2) Chips for subcategories of selected category
    const chipItems: ChipItem[] = useMemo(() => {
        const subs = selectedCategory?.subcategories ?? [];
        return [
            {
                id: "all",
                label: "Сите",
                variant: "outline",
                colorClassName: "bg-[#2F3A37] text-white hover:opacity-90",
            },
            ...subs.map((s) => ({
                id: s.id,
                label: s.label,
                variant: "outline" as const,
            })),
        ];
    }, [selectedCategory]);

    // Reset subcategory when category changes
    useEffect(() => {
        setSelectedSubcategoryId("all");
    }, [selectedCategoryId]);

    useEffect(() => {
        if (!selectedCategoryId) return;

        let cancelled = false;

        async function loadItems() {
            setLoadingItems(true);

            try {
                const params = new URLSearchParams();
                params.set("categoryId", selectedCategoryId);
                if (selectedSubcategoryId !== "all") {
                    params.set("subcategoryId", selectedSubcategoryId);
                }
                params.set("kind", mealType);

                const res = await fetch(
                    `/api/menuItems/${restaurantId}/menu-items?${params.toString()}`,
                    { cache: "no-store" }
                );



                // If endpoint doesn't exist or fails, fallback to dummy
                if (!res.ok) throw new Error(`Items request failed: ${res.status}`);

                const json = await res.json();
                if (cancelled) return;

                const data = json?.data ?? json;
                if (!Array.isArray(data)) throw new Error("Menu items response is not an array");

                const mapped: MenuItem[] = data.map((m: any) => ({
                    id: m._id ?? m.id,
                    title: m?.name?.mk ?? m?.name ?? m?.title ?? "Item",
                    imageUrl: m?.image?.url ?? m?.imageUrl ?? "",
                    price: m?.price ?? 0,
                }));

                setItems(mapped);
            } catch (e) {
                console.error("Failed to load items:", e);
                if (!cancelled) {
                    setItems([]);
                }
            } finally {
                if (!cancelled) setLoadingItems(false);
            }

        }


        loadItems();
        return () => {
            cancelled = true;
        };
    }, [restaurantId, selectedCategoryId, selectedSubcategoryId, mealType]);



    return (
        <div className="bg-[#F7F7F7] min-h-[50vh] flex flex-col justify-center items-center">
            <div className="container mx-auto space-y-1 py-8 pl-4">

                <MealTypeToggle value={mealType} onChange={onMealTypeChange} className="ml-auto" />
                <div
                    ref={categoryContainerRef}
                    className="flex gap-8 overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth"
                >
                    {loadingCategories ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                            <CategorySkeleton key={idx} active={idx === 0} />
                        ))
                    ) : (
                        categories.map((cat) => (
                            <CategoryLink
                                key={cat.id}
                                label={cat.label}
                                active={cat.id === selectedCategoryId}
                                onClick={() => {
                                    setSelectedCategoryId(cat.id);
                                    categoryRefs.current[cat.id]?.scrollIntoView({
                                        behavior: "smooth",
                                        inline: "center",
                                        block: "nearest",
                                    });
                                }}
                                className="shrink-0"
                                ref={(el) => {
                                    categoryRefs.current[cat.id] = el;
                                }}
                            />
                        ))
                    )}
                </div>



                {/* SUBCATEGORY CHIPS */}
                {!!selectedCategory && (
                    <ChipsRow
                        items={chipItems}
                        activeId={selectedSubcategoryId}
                        onChipClick={(id) => setSelectedSubcategoryId(id)}
                        className="gap-1!"
                    />
                )}

                {/* CARDS */}
                <div
                    className="
            overflow-x-auto overflow-y-visible
            scroll-smooth touch-pan-x
            [-webkit-overflow-scrolling:touch]
            [&::-webkit-scrollbar]:hidden mt-4
          "
                >
                    {/* INNER STRIP */}
                    <div className="flex gap-6 pb-4 pt-12 overflow-visible">
                        {loadingItems
                            ? Array.from({ length: 6 }).map((_, idx) => (
                                <SkeletonCard key={idx} />
                            ))
                            : items.map((it, index) => (
                                <Card
                                    key={it.id}
                                    title={it.title}
                                    imageUrl={it.imageUrl}
                                    priceLabel={`${it.price}ден`}
                                    onClick={() => router.push(`/restaurant/${restaurantId}/menuItem/${it.id}`)}
                                    className="shrink-0"
                                    index={index}
                                />
                            ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
