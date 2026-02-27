"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CategoryLink from "../ui/CategoryLink";
import ChipsRow, { ChipItem } from "../ui/ChipsRow";
import Card from "../ui/Card";
import MealTypeToggle from "../mealTypeToggle/MealTypeToggle";
import type { MealKind, Category } from "@/app/data/dummyMenuCategories";
import { SkeletonCard } from "../skeletons/cardSkeleton";
import { CategorySkeleton } from "../skeletons/categorySkeleton";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { defaultLocale, type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PrefetchedMenuData } from "@/app/lib/menuPrefetch";

type MenuItem = {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    kind?: string;
};

type Props = {
    restaurantId: string;
    mealType: MealKind;
    onMealTypeChange: (next: MealKind) => void;
    initialData?: PrefetchedMenuData | null;
};

const pickDefaultSubcategoryId = (categoryId?: string, source?: Category[]) => {
    if (!categoryId || !source) return "all";
    const category = source.find((cat) => cat.id === categoryId);
    return category?.subcategories?.[0]?.id ?? "all";
};


export default function MenuBrowser({
    restaurantId,
    mealType,
    onMealTypeChange,
    initialData,
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchParamsString = searchParams.toString();
    const locale = useLocale() as Locale;

    const selectionStorageKey = useMemo(
        () => `menu-browser:${restaurantId}:${mealType}`,
        [restaurantId, mealType]
    );

    const categoryContainerRef = useRef<HTMLDivElement | null>(null);
    const categoryRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const initialSelectionAppliedRef = useRef(false);
    const cardsContainerRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);

    const labelPriority = useMemo(() => {
        const order: string[] = [];
        if (locale) order.push(locale);
        if (!order.includes(defaultLocale)) order.push(defaultLocale);
        if (!order.includes("en")) order.push("en");
        return order;
    }, [locale]);

    const resolveLocalizedLabel = useCallback(
        (name?: Record<string, string>, fallback = "Category") => {
            for (const key of labelPriority) {
                const value = name?.[key];
                if (value) return value;
            }
            const first = name ? Object.values(name).find(Boolean) : undefined;
            return first ?? fallback;
        },
        [labelPriority]
    );

    const mapCategories = useCallback(
        (data: any[]): Category[] =>
            data
                .slice()
                .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((cat: any) => ({
                    id: cat._id,
                    label: resolveLocalizedLabel(cat.name, "Category"),
                    subcategories: (cat.children ?? [])
                        .slice()
                        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                        .map((sub: any) => ({
                            id: sub._id,
                            label: resolveLocalizedLabel(sub.name, "Subcategory"),
                        })),
                })),
        [resolveLocalizedLabel]
    );

    const mapMenuItems = useCallback(
        (data: any[]): MenuItem[] =>
            data.map((m: any) => ({
                id: m._id ?? m.id,
                title: resolveLocalizedLabel(m?.name, m?.title ?? "Item"),
                imageUrl: m?.image?.url ?? m?.imageUrl ?? "",
                price: m?.price ?? 0,
                kind: m?.kind ?? m?.baseCategory ?? m?.type,
            })),
        [resolveLocalizedLabel]
    );

    const prefetchedData = useMemo(() => {
        if (!initialData) return null;
        if (initialData.restaurantId !== restaurantId) return null;
        if (initialData.mealType !== mealType) return null;
        return initialData;
    }, [initialData, restaurantId, mealType]);

    const prefetchedCategories = useMemo(
        () => (prefetchedData?.rawCategories?.length ? mapCategories(prefetchedData.rawCategories) : []),
        [prefetchedData, mapCategories]
    );

    const prefetchedItems = useMemo(
        () => (prefetchedData?.rawItems?.length ? mapMenuItems(prefetchedData.rawItems) : []),
        [prefetchedData, mapMenuItems]
    );

    const [categories, setCategories] = useState<Category[]>(() => prefetchedCategories);
    const [rawCategories, setRawCategories] = useState<any[]>(() => prefetchedData?.rawCategories ?? []);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => prefetchedData?.categoryId ?? "");
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>(() => prefetchedData?.subcategoryId ?? "all");

    const [items, setItems] = useState<MenuItem[]>(() => prefetchedItems);
    const [loadingCategories, setLoadingCategories] = useState(() => !prefetchedData);
    const [loadingItems, setLoadingItems] = useState(() => !prefetchedData);
    const [cardsVisible, setCardsVisible] = useState(() => Boolean(prefetchedData));

    const selectedCategory = useMemo(
        () => categories.find((c) => c.id === selectedCategoryId),
        [categories, selectedCategoryId]
    );

    useEffect(() => {
        if (prefetchedData) {
            setRawCategories(prefetchedData.rawCategories ?? []);
            setCategories(prefetchedCategories);
            setItems(prefetchedItems);
            setLoadingCategories(false);
            setLoadingItems(false);
        }
    }, [prefetchedData, prefetchedCategories, prefetchedItems]);

    useEffect(() => {
        initialSelectionAppliedRef.current = false;
        if (prefetchedData) {
            setSelectedCategoryId(prefetchedData.categoryId ?? "");
            setSelectedSubcategoryId(prefetchedData.subcategoryId ?? "all");
        } else {
            setSelectedCategoryId("");
            setSelectedSubcategoryId("all");
        }
    }, [restaurantId, mealType, prefetchedData]);

    useEffect(() => {
        if (!restaurantId) return;

        let cancelled = false;

        async function loadCategories() {
            if (prefetchedData?.rawCategories?.length) {
                const mapped = mapCategories(prefetchedData.rawCategories);
                if (cancelled) return;
                setRawCategories(prefetchedData.rawCategories);
                setCategories(mapped);
                setCategoriesError(null);
                setLoadingCategories(false);
                return;
            }

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
                const mapped = mapCategories(data);
                setRawCategories(data);
                setCategories(mapped);
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
    }, [restaurantId, mealType, mapCategories, prefetchedData]);

    useEffect(() => {
        if (!rawCategories.length) return;
        const mapped = mapCategories(rawCategories);
        setCategories(mapped);

        if (!initialSelectionAppliedRef.current) {
            return;
        }

        setSelectedCategoryId((prevCategoryId) => {
            const hasPrev = prevCategoryId && mapped.some((cat) => cat.id === prevCategoryId);
            const fallbackCategoryId = mapped[0]?.id ?? "";
            const nextCategoryId = hasPrev ? prevCategoryId : fallbackCategoryId;
            const defaultSubcategoryId = pickDefaultSubcategoryId(nextCategoryId, mapped);

            setSelectedSubcategoryId((prevSubcategoryId) => {
                if (!hasPrev || nextCategoryId !== prevCategoryId) {
                    return defaultSubcategoryId;
                }
                if (prevSubcategoryId === "all") {
                    return prevSubcategoryId;
                }
                const nextCategory = mapped.find((cat) => cat.id === nextCategoryId);
                const subExists = nextCategory?.subcategories.some(
                    (sub) => sub.id === prevSubcategoryId
                );
                return subExists ? prevSubcategoryId : defaultSubcategoryId;
            });

            return nextCategoryId;
        });
    }, [rawCategories, mapCategories]);

    useEffect(() => {
        if (!categories.length || initialSelectionAppliedRef.current) return;

        const params = new URLSearchParams(searchParamsString);
        let candidateCategoryId = params.get("categoryId");
        let candidateSubcategoryId = params.get("subcategoryId");

        if (typeof window !== "undefined" && (!candidateCategoryId || !candidateSubcategoryId)) {
            try {
                const storedRaw = window.sessionStorage.getItem(selectionStorageKey);
                if (storedRaw) {
                    const stored = JSON.parse(storedRaw) as {
                        categoryId?: string;
                        subcategoryId?: string;
                    };
                    if (!candidateCategoryId && stored?.categoryId) {
                        candidateCategoryId = stored.categoryId;
                    }
                    if (!candidateSubcategoryId && stored?.subcategoryId) {
                        candidateSubcategoryId = stored.subcategoryId;
                    }
                }
            } catch {
                // ignore storage errors
            }
        }

        const fallbackCategoryId =
            candidateCategoryId && categories.some((cat) => cat.id === candidateCategoryId)
                ? candidateCategoryId
                : categories[0]?.id ?? "";

        const nextCategoryId = fallbackCategoryId;
        setSelectedCategoryId(nextCategoryId);

        const defaultSubcategoryId = pickDefaultSubcategoryId(nextCategoryId, categories);
        let nextSubcategoryId = defaultSubcategoryId;
        if (nextCategoryId && candidateSubcategoryId) {
            if (candidateSubcategoryId === "all") {
                nextSubcategoryId = "all";
            } else {
                const category = categories.find((cat) => cat.id === nextCategoryId);
                if (category?.subcategories.some((sub) => sub.id === candidateSubcategoryId)) {
                    nextSubcategoryId = candidateSubcategoryId;
                }
            }
        }
        setSelectedSubcategoryId(nextSubcategoryId);

        initialSelectionAppliedRef.current = true;
    }, [categories, searchParamsString, selectionStorageKey]);

    const allChipLabel = useMemo(
        () =>
            resolveLocalizedLabel(
                {
                    mk: "Сите",
                    sq: "Të gjitha",
                    en: "All",
                },
                "All"
            ),
        [resolveLocalizedLabel]
    );

    // 2) Chips for subcategories of selected category
    const chipItems: ChipItem[] = useMemo(() => {
        const subs = selectedCategory?.subcategories ?? [];
        return [
            {
                id: "all",
                label: allChipLabel,
                variant: "outline",
                colorClassName: "bg-[#2F3A37] text-white hover:opacity-90",
            },
            ...subs.map((s) => ({
                id: s.id,
                label: s.label,
                variant: "outline" as const,
            })),
        ];
    }, [selectedCategory, allChipLabel]);


    const handleCategorySelect = useCallback(
        (categoryId: string) => {
            if (categoryId === selectedCategoryId) return;
            setSelectedCategoryId(categoryId);
            setSelectedSubcategoryId(pickDefaultSubcategoryId(categoryId, categories));
        },
        [selectedCategoryId, categories]
    );

    // keep active category centered in scroll container
    useEffect(() => {
        if (!selectedCategoryId) return;
        const target = categoryRefs.current[selectedCategoryId];
        if (!target) return;

        target.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
        });
    }, [selectedCategoryId]);

    const updateCardScrollState = useCallback(() => {
        const container = cardsContainerRef.current;
        if (!container) return;
        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 8);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }, []);

    const scrollCards = useCallback((direction: "left" | "right") => {
        const container = cardsContainerRef.current;
        if (!container) return;
        const delta = container.clientWidth * 0.8 * (direction === "left" ? -1 : 1);
        container.scrollBy({ left: delta, behavior: "smooth" });
    }, []);

    useEffect(() => {
        const container = cardsContainerRef.current;
        if (!container) return;

        updateCardScrollState();
        const handleScroll = () => updateCardScrollState();
        container.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, [updateCardScrollState, items.length, loadingItems, loadingCategories]);

    const prefetchedMatchesSelection = useMemo(() => {
        if (!prefetchedData) return false;
        return (
            prefetchedData.categoryId === selectedCategoryId &&
            (prefetchedData.subcategoryId ?? "all") === selectedSubcategoryId
        );
    }, [prefetchedData, selectedCategoryId, selectedSubcategoryId]);

    useEffect(() => {
        if (!selectedCategoryId) return;

        if (prefetchedMatchesSelection && prefetchedData?.rawItems) {
            setItems(mapMenuItems(prefetchedData.rawItems));
            setLoadingItems(false);
            return;
        }

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

                const mapped = mapMenuItems(data);

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
    }, [
        restaurantId,
        selectedCategoryId,
        selectedSubcategoryId,
        mealType,
        mapMenuItems,
        prefetchedData,
        prefetchedMatchesSelection,
    ]);

    useEffect(() => {
        if (loadingItems || loadingCategories) {
            setCardsVisible(false);
            return;
        }
        let frame = requestAnimationFrame(() => setCardsVisible(true));
        return () => cancelAnimationFrame(frame);
    }, [loadingItems, loadingCategories, items.length]);

    useEffect(() => {
        if (!initialSelectionAppliedRef.current) return;

        const params = new URLSearchParams(searchParamsString);
        if (selectedCategoryId) {
            params.set("categoryId", selectedCategoryId);
        } else {
            params.delete("categoryId");
        }

        if (selectedSubcategoryId) {
            params.set("subcategoryId", selectedSubcategoryId);
        } else {
            params.delete("subcategoryId");
        }

        const nextSearch = params.toString();
        if (nextSearch === searchParamsString) return;

        const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;
        router.replace(nextUrl, { scroll: false });
    }, [selectedCategoryId, selectedSubcategoryId, pathname, router, searchParamsString]);

    useEffect(() => {
        if (!initialSelectionAppliedRef.current) return;
        if (typeof window === "undefined") return;

        try {
            const payload = JSON.stringify({
                categoryId: selectedCategoryId,
                subcategoryId: selectedSubcategoryId,
            });
            window.sessionStorage.setItem(selectionStorageKey, payload);
        } catch {
            // ignore storage errors
        }
    }, [selectedCategoryId, selectedSubcategoryId, selectionStorageKey]);



    return (
        <section aria-labelledby="menu-browser-heading" className="bg-[#F7F7F7] min-h-[50vh] max-h-125 flex flex-col justify-center items-center">
            <div className="container mx-auto space-y-1 py-8 pl-4">
                <h2 id="menu-browser-heading" className="sr-only">
                    Мени
                </h2>
                <MealTypeToggle value={mealType} onChange={onMealTypeChange} className="ml-auto" />
                <nav
                    ref={categoryContainerRef}
                    className="pr-2 flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth"
                    aria-label="Категории"
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
                                onClick={() => handleCategorySelect(cat.id)}
                                className="shrink-0"
                                ref={(el) => {
                                    categoryRefs.current[cat.id] = el;
                                }}
                            />
                        ))
                    )}
                </nav>



                {/* SUBCATEGORY CHIPS */}
                {loadingCategories ? (
                    <div className="flex gap-2 mt-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="h-4 w-24 rounded-full bg-black/10 animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    !!selectedCategory && (
                        <ChipsRow
                            items={chipItems}
                            activeId={selectedSubcategoryId}
                            onChipClick={(id) => setSelectedSubcategoryId(id)}
                            className="gap-1!"
                        />
                    )
                )}

                {/* CARDS */}
                <div className="relative mt-4" role="region" aria-label="Ставки од менито">
                    <div
                        ref={cardsContainerRef}
                        className="
                overflow-x-auto overflow-y-visible
                scroll-smooth
                [-webkit-overflow-scrolling:touch]
                [&::-webkit-scrollbar]:hidden
              "
                    >
                        {/* INNER STRIP */}
                        <div
                            className={[
                                "flex gap-6 pb-4 pt-12 overflow-visible min-h-45",
                                "transition-all duration-200 ease-out transform-gpu",
                                cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                            ].join(" ")}
                            role="list"
                        >
                            {(loadingItems || loadingCategories)
                                ? Array.from({ length: 6 }).map((_, idx) => (
                                    <SkeletonCard key={idx} />
                                ))
                                : items.map((it, index) => (
                                    <div role="listitem" key={it.id}>
                                        <Card
                                            title={it.title}
                                            imageUrl={it.imageUrl}
                                            priceLabel={`${it.price}ден`}
                                            kind={it.kind ?? mealType}
                                            onClick={() => {
                                                const detailParams = new URLSearchParams();
                                                detailParams.set("kind", mealType);
                                                const detailHref = buildLocalizedPath(
                                                    `/restaurant/${restaurantId}/menuItem/${it.id}?${detailParams.toString()}`,
                                                    locale
                                                );
                                                router.push(detailHref);
                                            }}
                                            className="shrink-0"
                                            index={index}
                                        />
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div
                        className={[
                            "pointer-events-none absolute inset-y-0 left-0 hidden md:flex items-center",
                            canScrollLeft ? "opacity-100" : "opacity-0",
                        ].join(" ")}
                    >
                        <button
                            type="button"
                            aria-label="Scroll left"
                            onClick={() => scrollCards("left")}
                            className="cursor-pointer pointer-events-auto h-10 w-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center transition"
                            disabled={!canScrollLeft}
                        >
                            <ChevronLeft className="h-5 w-5 text-[#2F3A37]" />
                        </button>
                    </div>

                    <div
                        className={[
                            "pointer-events-none absolute inset-y-0 right-0 hidden md:flex items-center justify-end",
                            canScrollRight ? "opacity-100" : "opacity-0",
                        ].join(" ")}
                    >
                        <button
                            type="button"
                            aria-label="Scroll right"
                            onClick={() => scrollCards("right")}
                            className="cursor-pointer pointer-events-auto h-10 w-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center transition"
                            disabled={!canScrollRight}
                        >
                            <ChevronRight className="h-5 w-5 text-[#2F3A37]" />
                        </button>
                    </div>
                </div>
            </div>

        </section>
    );
}
