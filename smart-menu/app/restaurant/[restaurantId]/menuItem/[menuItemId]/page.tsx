import MenuItemDetails from "@/app/components/menuItemDetails/menuItemDetails";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ restaurantId: string; menuItemId: string }>;
  searchParams?: Promise<{ kind?: string }>;
};

const normalizeAllergenCode = (value?: string | null) =>
  value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") ?? "";

const humanizeAllergen = (value: string) =>
  value
    ?.split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") ?? "";

const extractAllergenCode = (allergen: any): string => {
  if (!allergen) return "";
  if (typeof allergen === "string") return normalizeAllergenCode(allergen);

  const direct =
    allergen?.code ??
    allergen?.slug ??
    allergen?.key ??
    allergen?.name ??
    allergen?.label;

  if (typeof direct === "string") return normalizeAllergenCode(direct);
  if (typeof direct?.mk === "string") return normalizeAllergenCode(direct.mk);
  if (typeof direct?.en === "string") return normalizeAllergenCode(direct.en);

  return "";
};

const parsePrice = (value: unknown): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (typeof value === "object" && value !== null) {
    const maybeValue =
      (value as { amount?: number })?.amount ??
      (value as { value?: number })?.value ??
      (value as { mk?: number })?.mk;
    if (typeof maybeValue === "number" && !Number.isNaN(maybeValue)) {
      return maybeValue;
    }
  }
  return undefined;
};

export default async function MenuItemPage({ params, searchParams }: Props) {
  const { restaurantId, menuItemId } = await params;
  const { kind } = (searchParams ? await searchParams : {}) ?? {};

  const qs = new URLSearchParams();
  if (kind) qs.set("kind", kind);

  // ✅ build absolute origin from request headers
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const url = `${origin}/api/menuItems/${restaurantId}/menu-items/${menuItemId}${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) return <div className="p-6">Not found</div>;

  const json = await res.json();
  const item = json?.data ?? json;

  const mapped = {
    id: item?._id ?? item?.id ?? menuItemId,
    name: item?.name?.mk ?? "Item",
    description: item?.description?.mk ?? "",
    imageUrl: item?.image?.url ?? "/placeholder.jpg",
    price: parsePrice(item?.price),
    allergens: Array.isArray(item?.allergens)
      ? item.allergens
          .map((a: any, idx: number) => {
            if (!a) return null;

            const code = extractAllergenCode(a);
            if (typeof a === "string") {
              const value = a.trim();
              const label = humanizeAllergen(value);
              return {
                key: value || String(idx),
                code: code || normalizeAllergenCode(value),
                label: label || "Алерген",
              };
            }

            const key = a?._id ?? a?.key ?? String(idx);
            const label =
              a?.label?.mk ??
              a?.label?.en ??
              a?.label ??
              a?.name?.mk ??
              a?.name?.en ??
              a?.name ??
              (typeof a?.key === "string" ? humanizeAllergen(a.key) : "");

            if (!label) return null;

            return {
              key,
              code,
              label,
            };
          })
          .filter(
            (a:any): a is { key: string; label: string; code?: string } =>
              Boolean(a?.label)
          )
      : [],
    restaurantId,
  };

  return <MenuItemDetails {...mapped} />;
}
