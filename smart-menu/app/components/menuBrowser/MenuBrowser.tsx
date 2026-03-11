"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CategoryLink from "../ui/CategoryLink";
import ChipsRow, { ChipItem } from "../ui/ChipsRow";
import Card from "../ui/Card";
import MealTypeToggle from "../mealTypeToggle/MealTypeToggle";
import type { MealKind, Category } from "@/app/data/dummyMenuCategories";
import { SkeletonCard } from "../skeletons/cardSkeleton";
import { CategorySkeleton } from "../skeletons/categorySkeleton";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { defaultLocale, type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import type { PrefetchedMenuData } from "@/app/lib/menuPrefetch";
import { incrementMenuItemView } from "@/app/lib/menuItemViews";

const ITEMS_PER_PAGE = 4;
const PAGE_VIEWPORT_PX = 520;
const SCROLL_HINT_STORAGE_KEY = "menuBrowserSwipeHintShown";

type MenuItem = {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    kind?: string;
    description?: string;
};

type Props = {
    restaurantId: string;
    restaurantSlug?: string;
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
    restaurantSlug,
    mealType,
    onMealTypeChange,
    initialData,
}: Props) {
    const router = useRouter();
    const locale = useLocale() as Locale;

    const selectionStorageKey = useMemo(
        () => `menu-browser:${restaurantId}:${mealType}`,
        [restaurantId, mealType]
    );

    const categoryContainerRef = useRef<HTMLDivElement | null>(null);
    const categoryRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const initialSelectionAppliedRef = useRef(false);
    const cardsContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollHintShownRef = useRef(false);
    const userInteractedRef = useRef(false);
    const programmaticScrollActiveRef = useRef(false);
    const programmaticScrollTimeoutRef = useRef<number | null>(null);
    const touchStateRef = useRef<{ lastY: number } | null>(null);
    const requestedItemsKeyRef = useRef<string | null>(null);
    const fulfilledItemsKeyRef = useRef<string | null>(null);
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

    const resolveLocalizedText = useCallback(
        (value?: string | Record<string, string>, fallback = "") => {
            if (!value) return fallback;
            if (typeof value === "string") return value;
            return resolveLocalizedLabel(value, fallback || "");
        },
        [resolveLocalizedLabel]
    );

    const mapCategories = useCallback(
        (data: any[]): Category[] =>
            data
                .slice()
                .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((cat: any) => ({
                    id: cat._id,
                    label: resolveLocalizedText(cat.name, "Category"),
                    subcategories: (cat.children ?? [])
                        .slice()
                        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                        .map((sub: any) => ({
                            id: sub._id,
                            label: resolveLocalizedText(sub.name, "Subcategory"),
                        })),
                })),
        [resolveLocalizedText]
    );

    const mapMenuItems = useCallback(
        (data: any[]): MenuItem[] =>
            data.map((m: any) => {
                const descriptionSource =
                    m?.description ??
                    m?.details ??
                    m?.detail ??
                    m?.shortDescription ??
                    m?.subtitle ??
                    m?.summary;

                const resolvedTitle = resolveLocalizedText(
                    m?.name ?? m?.title,
                    typeof m?.title === "string" ? m.title : "Item"
                );
                const resolvedDescription = resolveLocalizedText(descriptionSource, "");

                return {
                    id: m._id ?? m.id,
                    title: resolvedTitle,
                    imageUrl: m?.image?.url ?? m?.imageUrl ?? "",
                    price: m?.price ?? 0,
                    kind: m?.kind ?? m?.baseCategory ?? m?.type,
                    description: resolvedDescription || undefined,
                };
            }),
        [resolveLocalizedText]
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
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("all");

    const [items, setItems] = useState<MenuItem[]>(() => prefetchedItems);
    const [loadingCategories, setLoadingCategories] = useState(() => !prefetchedData);
    const [loadingItems, setLoadingItems] = useState(() => !prefetchedData);
    const [cardsVisible, setCardsVisible] = useState(() => Boolean(prefetchedData));
    const [pageIndicator, setPageIndicator] = useState<{ total: number; index: number }>(() => ({
        total: 1,
        index: 0,
    }));

    const chunkedItems = useMemo(() => {
        if (!items.length) return [];
        const chunks: MenuItem[][] = [];
        for (let i = 0; i < items.length; i += 1) {
            const chunkIndex = Math.floor(i / ITEMS_PER_PAGE);
            if (!chunks[chunkIndex]) {
                chunks[chunkIndex] = [];
            }
            chunks[chunkIndex].push(items[i]);
        }
        return chunks;
    }, [items]);

    const shouldForcePagedLayout = loadingItems || loadingCategories || chunkedItems.length > 1;

    const markProgrammaticScroll = useCallback((duration = 400) => {
        if (typeof window === "undefined") return;
        programmaticScrollActiveRef.current = true;
        if (programmaticScrollTimeoutRef.current !== null) {
            window.clearTimeout(programmaticScrollTimeoutRef.current);
        }
        programmaticScrollTimeoutRef.current = window.setTimeout(() => {
            programmaticScrollActiveRef.current = false;
            programmaticScrollTimeoutRef.current = null;
        }, duration);
    }, []);

    const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
        userInteractedRef.current = true;
        const touch = event.touches[0];
        if (!touch) {
            touchStateRef.current = null;
            return;
        }
        touchStateRef.current = { lastY: touch.clientY };
    }, []);

    const handleTouchMove = useCallback(
        (event: React.TouchEvent<HTMLDivElement>) => {
            if (!shouldForcePagedLayout) return;
            const container = cardsContainerRef.current;
            const touchState = touchStateRef.current;
            const touch = event.touches[0];
            if (!container || !touchState || !touch) return;

            userInteractedRef.current = true;

            const currentY = touch.clientY;
            const deltaY = currentY - touchState.lastY;
            touchState.lastY = currentY;

            if (Math.abs(deltaY) < 0.5) return;

            const atTop = container.scrollTop <= 0;
            const atBottom =
                container.scrollTop + container.clientHeight >= container.scrollHeight - 1;

            if (typeof window === "undefined") return;

            if (atTop && deltaY > 0) {
                window.scrollBy({ top: -deltaY, left: 0, behavior: "auto" });
            } else if (atBottom && deltaY < 0) {
                window.scrollBy({ top: -deltaY, left: 0, behavior: "auto" });
            }
        },
        [shouldForcePagedLayout]
    );

    const resetTouchState = useCallback(() => {
        touchStateRef.current = null;
    }, []);

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
    }, [restaurantId, mealType]);

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
  if (!categories.length) return;

  let storedCategoryId: string | null = null;
  let storedSubcategoryId: string | null = null;

  if (typeof window !== "undefined") {
    try {
      const storedRaw = window.sessionStorage.getItem(selectionStorageKey);
      if (storedRaw) {
        const stored = JSON.parse(storedRaw) as {
          categoryId?: string;
          subcategoryId?: string;
        };
        storedCategoryId = stored.categoryId ?? null;
        storedSubcategoryId = stored.subcategoryId ?? null;
      }
    } catch {}
  }

  const validStoredCategory =
    storedCategoryId && categories.some((cat) => cat.id === storedCategoryId)
      ? storedCategoryId
      : null;

  const validPrefetchedCategory =
    prefetchedData?.categoryId &&
    categories.some((cat) => cat.id === prefetchedData.categoryId)
      ? prefetchedData.categoryId
      : null;

  const nextCategoryId =
    validStoredCategory ??
    validPrefetchedCategory ??
    categories[0]?.id ??
    "";

  const category = categories.find((cat) => cat.id === nextCategoryId);
  const defaultSubId = pickDefaultSubcategoryId(nextCategoryId, categories);

  let nextSubcategoryId = defaultSubId;

  const candidateSubId =
    validStoredCategory === nextCategoryId
      ? storedSubcategoryId
      : prefetchedData?.subcategoryId ?? null;

  if (candidateSubId === "all") {
    nextSubcategoryId = "all";
  } else if (
    candidateSubId &&
    category?.subcategories.some((sub) => sub.id === candidateSubId)
  ) {
    nextSubcategoryId = candidateSubId;
  }

  setSelectedCategoryId(nextCategoryId);
  setSelectedSubcategoryId(nextSubcategoryId);
  initialSelectionAppliedRef.current = true;
}, [categories, selectionStorageKey, prefetchedData]);


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
        if (!container) {
            setPageIndicator({ total: 1, index: 0 });
            return;
        }

        const { scrollTop, clientHeight, scrollHeight } = container;
        const totalPages =
            chunkedItems.length > 0
                ? chunkedItems.length
                : Math.max(1, Math.ceil(scrollHeight / (clientHeight || PAGE_VIEWPORT_PX)));
        const activePage =
            totalPages <= 1
                ? 0
                : Math.min(
                      totalPages - 1,
                      Math.floor((scrollTop + clientHeight / 2) / (clientHeight || 1))
                  );

        setPageIndicator((prev) =>
            prev.total === totalPages && prev.index === activePage
                ? prev
                : { total: totalPages, index: activePage }
        );
    }, [chunkedItems.length]);

    const scrollToPage = useCallback(
        (targetIndex: number) => {
            const container = cardsContainerRef.current;
            if (!container) return;

            const totalPages =
                chunkedItems.length > 0
                    ? chunkedItems.length
                    : Math.max(
                          1,
                          Math.ceil(container.scrollHeight / (container.clientHeight || PAGE_VIEWPORT_PX))
                      );
            const clampedIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));
            const viewport = container.clientHeight || PAGE_VIEWPORT_PX;

            container.scrollTo({
                top: clampedIndex * viewport,
                behavior: "smooth",
            });
        },
        [chunkedItems.length]
    );

    useEffect(() => {
        const container = cardsContainerRef.current;
        if (!container) return;
        markProgrammaticScroll(200);
        container.scrollTop = 0;
        requestAnimationFrame(() => updateCardScrollState());
    }, [selectedCategoryId, selectedSubcategoryId, updateCardScrollState, markProgrammaticScroll]);

    useEffect(() => {
        const container = cardsContainerRef.current;
        if (!container) return;

        updateCardScrollState();
        const handleScroll = () => {
            if (!programmaticScrollActiveRef.current) {
                userInteractedRef.current = true;
            }
            updateCardScrollState();
        };
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

        const itemsQueryKey = [
            restaurantId,
            mealType,
            selectedCategoryId,
            selectedSubcategoryId,
        ].join(":");

        if (prefetchedMatchesSelection && prefetchedData?.rawItems) {
            setItems(mapMenuItems(prefetchedData.rawItems));
            setLoadingItems(false);
            fulfilledItemsKeyRef.current = itemsQueryKey;
            requestedItemsKeyRef.current = null;
            return;
        }

        if (
            requestedItemsKeyRef.current === itemsQueryKey ||
            fulfilledItemsKeyRef.current === itemsQueryKey
        ) {
            return;
        }

        let cancelled = false;
        requestedItemsKeyRef.current = itemsQueryKey;

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

                if (!cancelled) {
                    setItems(mapped);
                    fulfilledItemsKeyRef.current = itemsQueryKey;
                }
            } catch (e) {
                console.error("Failed to load items:", e);
                if (!cancelled) {
                    setItems([]);
                    fulfilledItemsKeyRef.current = null;
                }
            } finally {
                if (!cancelled) {
                    setLoadingItems(false);
                    requestedItemsKeyRef.current = null;
                } else if (requestedItemsKeyRef.current === itemsQueryKey) {
                    requestedItemsKeyRef.current = null;
                }
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
        return () => {
            if (typeof window === "undefined") return;
            if (programmaticScrollTimeoutRef.current !== null) {
                window.clearTimeout(programmaticScrollTimeoutRef.current);
                programmaticScrollTimeoutRef.current = null;
                programmaticScrollActiveRef.current = false;
            }
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!cardsVisible) return;
        if (loadingItems || loadingCategories) return;
        if (scrollHintShownRef.current) return;

        const storedHintValue = window.localStorage.getItem(SCROLL_HINT_STORAGE_KEY);
        if (storedHintValue === "true") {
            scrollHintShownRef.current = true;
            return;
        }

        const container = cardsContainerRef.current;
        if (!container) return;
        if (container.scrollHeight <= container.clientHeight + 24) return;

        const previousHintValue = storedHintValue;

        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll <= 0) return;
        const cards = Array.from(
            container.querySelectorAll<HTMLElement>("[data-menu-card]")
        );
        let hintOffset =
            (container.clientHeight || PAGE_VIEWPORT_PX) / Math.max(ITEMS_PER_PAGE, 1);
        if (cards.length > 1) {
            const firstRect = cards[0].getBoundingClientRect();
            const secondRect = cards[1].getBoundingClientRect();
            const diff = secondRect.top - firstRect.top;
            if (diff > 20) {
                hintOffset = diff;
            }
        }

        const targetOffset = Math.min(Math.max(hintOffset, 200), maxScroll * 0.8);
        if (targetOffset <= 0) return;

        scrollHintShownRef.current = true;
        window.localStorage.setItem(SCROLL_HINT_STORAGE_KEY, "true");
        let animationTriggered = false;

        const downDelay = 800;
        const pauseDuration = 350;
        const upDelay = 1600;

        const timeouts: number[] = [];
        const enqueue = (id: number) => timeouts.push(id);
        const clearAll = () => timeouts.forEach((t) => window.clearTimeout(t));

        enqueue(
            window.setTimeout(() => {
                if (userInteractedRef.current) return;
                animationTriggered = true;
                markProgrammaticScroll(800);
                container.scrollTo({ top: targetOffset, behavior: "smooth" });

                enqueue(
                    window.setTimeout(() => {
                        if (userInteractedRef.current) return;
                        markProgrammaticScroll(800);
                        container.scrollTo({ top: 0, behavior: "smooth" });
                    }, pauseDuration)
                );
            }, downDelay)
        );

        return () => {
            clearAll();
            if (!animationTriggered) {
                scrollHintShownRef.current = false;
                if (previousHintValue === null) {
                    window.localStorage.removeItem(SCROLL_HINT_STORAGE_KEY);
                } else {
                    window.localStorage.setItem(SCROLL_HINT_STORAGE_KEY, previousHintValue);
                }
            }
        };
    }, [cardsVisible, loadingItems, loadingCategories, chunkedItems.length, markProgrammaticScroll]);

    // Removed URL-sync effect to keep menu links clean

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
        <section aria-labelledby="menu-browser-heading" className="bg-[#F7F7F7] min-h-[30vh] h-fit max-h-125 flex flex-col justify-start items-center">
            <div className="container mx-auto space-y-1 py-5 pl-4">
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
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={resetTouchState}
                        onTouchCancel={resetTouchState}
                        className={[
                            shouldForcePagedLayout ? "min-h-[330px] max-h-[330px]" : "",
                            shouldForcePagedLayout
                                ? "overflow-y-auto snap-y snap-mandatory scroll-smooth"
                                : "overflow-y-visible",
                            "overflow-x-hidden",
                            "[-webkit-overflow-scrolling:touch]",
                            "[&::-webkit-scrollbar]:hidden",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        {/* INNER STRIP */}
                        <div
                            className={[
                                "flex flex-col gap-6 pr-7",
                                "transition-all duration-200 ease-out transform-gpu",
                                cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                            ].join(" ")}
                            role="list"
                        >
                            {(loadingItems || loadingCategories) ? (
                                <div
                                    className={[
                                        "snap-start snap-always flex flex-col divide-y divide-[#e1e5e1b3]",
                                        shouldForcePagedLayout ? "min-h-[330px]" : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    role="listitem"
                                >
                                    {Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                                        <div key={`skeleton-${idx}`} className="py-3">
                                            <SkeletonCard layout="list" />
                                        </div>
                                    ))}
                                </div>
                            ) : chunkedItems.length ? (
                                chunkedItems.map((group, pageIdx) => (
                                    <div
                                        role="listitem"
                                        key={`menu-page-${pageIdx}`}
                                        className={[
                                            "snap-start snap-always flex flex-col divide-y divide-[#e1e5e1b3]",
                                            shouldForcePagedLayout ? "min-h-[330px]" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    >
                                        {group.map((it, index) => (
                                            <div key={it.id} className="w-full py-3" data-menu-card>
                                                <Card
                                                    title={it.title}
                                                    imageUrl={it.imageUrl}
                                                    priceLabel={`${it.price}ден`}
                                                    kind={it.kind ?? mealType}
                                                    description={it.description}
                                                    layout="list"
                                                    onClick={() => {
                                                        void incrementMenuItemView({
                                                            restaurantId,
                                                            menuItemId: it.id,
                                                        });
                                                        const detailParams = new URLSearchParams();
                                                        detailParams.set("kind", mealType);
                                                        detailParams.set("categoryId", selectedCategoryId);
                                                        detailParams.set("subcategoryId", selectedSubcategoryId);
                                                        const slugOrId = restaurantSlug ?? restaurantId;
                                                        const detailHref = buildLocalizedPath(
                                                            `/restaurant/${slugOrId}/menuItem/${it.id}?${detailParams.toString()}`,
                                                            locale
                                                        );
                                                        router.push(detailHref);
                                                    }}
                                                    className="w-full"
                                                    index={pageIdx * ITEMS_PER_PAGE + index}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                <div
                                    className={[
                                        "snap-start snap-always flex items-center justify-center text-sm text-[#64706A]",
                                        shouldForcePagedLayout ? "min-h-[330px]" : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    Нема артикли за оваа категорија.
                                </div>
                            )}
                        </div>
                    </div>

                    {!loadingItems && !loadingCategories && pageIndicator.total > 1 && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-2 pr-1">
                            {Array.from({ length: pageIndicator.total }).map((_, idx) => (
                                <button
                                    type="button"
                                    key={`scroll-dot-${idx}`}
                                    className={[
                                        "pointer-events-auto h-2.5 w-2.5 rounded-full border-2 border-[#355B4B] transition cursor-pointer",
                                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#355B4B]",
                                        idx === pageIndicator.index
                                            ? "bg-[#355B4B] border-[#355B4B] scale-110"
                                            : "bg-transparent",
                                    ].join(" ")}
                                    aria-label={`Прикажи група ${idx + 1}`}
                                    onClick={() => scrollToPage(idx)}
                                    disabled={idx === pageIndicator.index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </section>
    );
}
