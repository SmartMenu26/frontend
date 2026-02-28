import type { MealKind } from "@/app/data/dummyMenuCategories";

type BackendCategory = {
  _id: string;
  sortOrder?: number;
  children?: BackendCategory[];
};

type BackendMenuItem = Record<string, any>;

export type PrefetchedMenuData = {
  restaurantId: string;
  mealType: MealKind;
  rawCategories: BackendCategory[];
  rawItems: BackendMenuItem[];
  categoryId: string;
  subcategoryId: string;
};

const REVALIDATE_SECONDS = 120;

const sortByOrder = <T extends { sortOrder?: number }>(list: T[] = []): T[] =>
  list.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

const normalizeCategorySelection = (
  rawCategories: BackendCategory[],
  requestedCategoryId?: string | null,
  requestedSubcategoryId?: string | null
) => {
  if (!rawCategories.length) {
    return { categoryId: "", subcategoryId: "all" as const };
  }

  const sortedCategories = sortByOrder(rawCategories);
  const category =
    sortedCategories.find((cat) => cat._id === requestedCategoryId) ??
    sortedCategories[0];

  if (!category?._id) {
    return { categoryId: "", subcategoryId: "all" as const };
  }

  const sortedSubcategories = sortByOrder(category.children ?? []);
  const wantsAll =
    requestedSubcategoryId === "all" || sortedSubcategories.length === 0;

  if (wantsAll) {
    return {
      categoryId: category._id,
      subcategoryId: "all" as const,
    };
  }

  const subcategory =
    sortedSubcategories.find((child) => child._id === requestedSubcategoryId) ??
    sortedSubcategories[0];

  return {
    categoryId: category._id,
    subcategoryId: subcategory?._id ?? "all",
  };
};

export async function fetchInitialMenuData(args: {
  restaurantId: string;
  mealType: MealKind;
  categoryId?: string | null;
  subcategoryId?: string | null;
}): Promise<PrefetchedMenuData | null> {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (!backendBase) {
    console.warn("[menuPrefetch] BACKEND_URL missing; skipping prefetch.");
    return null;
  }

  const categoriesUrl = `${backendBase}/api/restaurants/${args.restaurantId}/categories?kind=${args.mealType}`;
  const categoriesRes = await fetch(categoriesUrl, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!categoriesRes.ok) {
    console.warn(
      "[menuPrefetch] Failed to fetch categories",
      categoriesRes.status,
      categoriesRes.statusText
    );
    return null;
  }

  const categoriesPayload = await categoriesRes.json().catch(() => null);
  const rawCategories: BackendCategory[] = Array.isArray(categoriesPayload?.data)
    ? categoriesPayload.data
    : Array.isArray(categoriesPayload)
    ? categoriesPayload
    : [];

  const { categoryId, subcategoryId } = normalizeCategorySelection(
    rawCategories,
    args.categoryId,
    args.subcategoryId
  );

  if (!categoryId) {
    return {
      restaurantId: args.restaurantId,
      mealType: args.mealType,
      rawCategories,
      rawItems: [],
      categoryId: "",
      subcategoryId: "all",
    };
  }

  const qs = new URLSearchParams();
  qs.set("kind", args.mealType);
  qs.set("categoryId", categoryId);
  if (subcategoryId && subcategoryId !== "all") {
    qs.set("subcategoryId", subcategoryId);
  }

  const itemsUrl = `${backendBase}/api/menuItems/${args.restaurantId}/menu-items?${qs.toString()}`;
  const itemsRes = await fetch(itemsUrl, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!itemsRes.ok) {
    console.warn(
      "[menuPrefetch] Failed to fetch items",
      itemsRes.status,
      itemsRes.statusText
    );
  }

  const itemsPayload = await itemsRes.json().catch(() => null);
  const rawItems: BackendMenuItem[] = Array.isArray(itemsPayload?.data)
    ? itemsPayload.data
    : Array.isArray(itemsPayload)
    ? itemsPayload
    : [];

  return {
    restaurantId: args.restaurantId,
    mealType: args.mealType,
    rawCategories,
    rawItems,
    categoryId,
    subcategoryId,
  };
}
