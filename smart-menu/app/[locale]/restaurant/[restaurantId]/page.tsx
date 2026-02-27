import InstallAppButton from "@/app/_components/InstallAppButton";
import AiSuggestion from "@/app/components/aiSuggestion/aiSuggestion";
import RestaurantContent from "@/app/components/restaurant/RestaurantContext";
import Footer from "@/app/components/ui/Footer";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import LanguageSwitcher from "@/app/components/languageSwitcher/LanguageSwitcher";
import type { MealKind } from "@/app/data/dummyMenuCategories";
import { fetchInitialMenuData } from "@/app/lib/menuPrefetch";

type RestaurantMeta = {
  name: string | null;
  heroImageUrl?: string | null;
};

async function fetchRestaurantMeta(restaurantId: string): Promise<RestaurantMeta> {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");

  if (!backendBase) {
    console.error("Failed to fetch restaurant: BACKEND_URL is missing");
    return { name: null, heroImageUrl: null };
  }

  try {
    const res = await fetch(
      `${backendBase}/api/restaurants/${restaurantId}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.error("Failed to fetch restaurant:", res.status, res.statusText);
      return { name: null, heroImageUrl: null };
    }

    const payload = await res.json().catch(() => null);
    const data = payload?.data ?? payload;

    if (!data) return { name: null, heroImageUrl: null };

    const resolvedName =
      typeof data.name === "string"
        ? data.name
        : typeof data.name === "object"
        ? data.name?.mk ?? data.name?.en ?? data.name?.sq ?? null
        : null;

    const heroImageCandidates = [
      data?.heroImage,
      data?.coverImage,
      data?.logo,
      data?.image,
      Array.isArray(data?.images) ? data.images[0] : null,
      Array.isArray(data?.gallery) ? data.gallery[0] : null,
    ];

    const resolveImageUrl = (entry: any): string | null => {
      if (!entry) return null;
      if (typeof entry === "string") return entry;
      if (typeof entry === "object") {
        return entry.url ?? entry.src ?? null;
      }
      return null;
    };

    const heroImageUrl =
      heroImageCandidates
        .map(resolveImageUrl)
        .find((url) => typeof url === "string" && url.length > 0) ?? null;

    return { name: resolvedName, heroImageUrl };
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return { name: null, heroImageUrl: null };
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

  const [restaurantMeta, initialMenuData] = await Promise.all([
    fetchRestaurantMeta(restaurantId),
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
        <RestaurantHeader
          name={restaurantMeta.name ?? undefined}
        />

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
