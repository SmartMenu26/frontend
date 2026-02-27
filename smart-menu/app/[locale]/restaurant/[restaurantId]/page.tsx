import InstallAppButton from "@/app/_components/InstallAppButton";
import AiSuggestion from "@/app/components/aiSuggestion/aiSuggestion";
import RestaurantContent from "@/app/components/restaurant/RestaurantContext";
import Footer from "@/app/components/ui/Footer";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import LanguageSwitcher from "@/app/components/languageSwitcher/LanguageSwitcher";
import type { MealKind } from "@/app/data/dummyMenuCategories";
import { fetchInitialMenuData } from "@/app/lib/menuPrefetch";

async function fetchRestaurantName(restaurantId: string) {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");

  if (!backendBase) {
    console.error("Failed to fetch restaurant: BACKEND_URL is missing");
    return null;
  }

  try {
    const res = await fetch(
      `${backendBase}/api/restaurants/${restaurantId}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.error("Failed to fetch restaurant:", res.status, res.statusText);
      return null;
    }

    const payload = await res.json().catch(() => null);
    const data = payload?.data ?? payload;

    if (!data) return null;

    if (typeof data.name === "string") {
      return data.name;
    }

    if (typeof data.name === "object") {
      return data.name?.mk ?? data.name?.en ?? data.name?.sq ?? null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }
}

type PageProps = {
  params: Promise<{ restaurantId: string }>;
  searchParams?: Promise<{
    kind?: string;
    categoryId?: string;
    subcategoryId?: string;
  }>;
};

export default async function RestaurantPage({ params, searchParams }: PageProps) {
  const { restaurantId } = await params;
  const resolvedSearch = (searchParams ? await searchParams : {}) ?? {};

  const initialMealType: MealKind =
    resolvedSearch.kind === "drink" ? "drink" : "food";
  const requestedCategoryId =
    typeof resolvedSearch.categoryId === "string"
      ? resolvedSearch.categoryId
      : undefined;
  const requestedSubcategoryId =
    typeof resolvedSearch.subcategoryId === "string"
      ? resolvedSearch.subcategoryId
      : undefined;

  const [restaurantName, initialMenuData] = await Promise.all([
    fetchRestaurantName(restaurantId),
    fetchInitialMenuData({
      restaurantId,
      mealType: initialMealType,
      categoryId: requestedCategoryId,
      subcategoryId: requestedSubcategoryId,
    }),
  ]);

  return (
    <>
      <div className="pt-8 flex flex-col gap-6">
        <InstallAppButton />
        <RestaurantHeader name={restaurantName ?? undefined} />

        <AiSuggestion restaurantId={restaurantId} />

        <RestaurantContent
          restaurantId={restaurantId}
          initialMenuData={initialMenuData}
        />

        <Footer />
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
    </>
  );
}
