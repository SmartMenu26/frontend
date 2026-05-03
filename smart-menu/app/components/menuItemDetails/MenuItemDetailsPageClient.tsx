"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MenuItemDetails from "@/app/components/menuItemDetails/menuItemDetails";
import MenuItemLoading from "@/app/components/menuItemDetails/MenuItemLoading";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import {
  buildLocalePriority,
  buildMenuItemViewModel,
  type MenuItemPayload,
  type MenuItemViewModel,
} from "./menuItemDetailsUtils";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const mapApiPayload = (payload: unknown): Record<string, unknown> | null => {
  if (payload && typeof payload === "object") {
    if ("data" in payload && payload.data && typeof payload.data === "object") {
      return payload.data as Record<string, unknown>;
    }
    return payload as Record<string, unknown>;
  }
  return null;
};

const getPayloadId = (record: Record<string, unknown>): string | undefined =>
  typeof record._id === "string"
    ? record._id
    : typeof record.id === "string"
      ? record.id
      : undefined;

const getBrandColor = (payload: Record<string, unknown> | null): string | undefined => {
  if (typeof payload?.brandColor !== "string") {
    return undefined;
  }

  const brandColor = payload.brandColor.trim();
  return brandColor || undefined;
};

const getLocalizedValue = (
  value: unknown,
  localePriority: string[]
): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const locale of localePriority) {
    const candidate = record[locale];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  for (const candidate of Object.values(record)) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
};

const getMenuItemPayload = (
  payload: unknown,
  menuItemId: string,
  depth = 0
): MenuItemPayload | null => {
  if (!payload || typeof payload !== "object" || depth > 8) {
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const match = getMenuItemPayload(item, menuItemId, depth + 1);
      if (match) return match;
    }
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidateId = getPayloadId(record);
  if (candidateId === menuItemId) {
    return record as MenuItemPayload;
  }

  const nestedKeys = [
    "data",
    "item",
    "menuItem",
    "menuItems",
    "items",
    "results",
    "docs",
    "attributes",
  ];

  for (const key of nestedKeys) {
    const nested = record[key];
    if (!nested || nested === payload) continue;
    const match = getMenuItemPayload(nested, menuItemId, depth + 1);
    if (match) return match;
  }

  if (Array.isArray(record.nutritionBreakdown) || record.name || record.image) {
    return record as MenuItemPayload;
  }

  return null;
};

type Props = {
  locale: Locale;
  restaurantSlug: string;
  menuItemId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      viewModel: MenuItemViewModel;
      restaurantId: string;
      canonicalSlug: string;
      restaurantName: string;
      googleReviewUrl?: string;
      brandColor?: string;
    };

export default function MenuItemDetailsPageClient({
  locale,
  restaurantSlug,
  menuItemId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const serializedSearchParams = searchParams?.toString() ?? "";
  const kindParam = searchParams?.get("kind") ?? undefined;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      try {
        const restaurantRes = await fetch(
          `/api/restaurants/slug/${encodeURIComponent(restaurantSlug)}`,
          { cache: "no-store" }
        );

        if (!restaurantRes.ok) {
          throw new Error(
            restaurantRes.status === 404
              ? "Restaurant not found"
              : "Failed to fetch restaurant"
          );
        }

        const restaurantPayload = mapApiPayload(await restaurantRes.json().catch(() => null));
        const restaurantId =
          typeof restaurantPayload?.id === "string" ? restaurantPayload.id : undefined;
        const canonicalSlug =
          typeof restaurantPayload?.slug === "string"
            ? restaurantPayload.slug
            : restaurantSlug;
        const brandColor = getBrandColor(restaurantPayload);
        const localePriority = buildLocalePriority(locale);
        const restaurantName =
          getLocalizedValue(restaurantPayload?.localizedName, localePriority) ??
          getLocalizedValue(restaurantPayload?.plainName, localePriority) ??
          canonicalSlug;
        const googleReviewUrl =
          getLocalizedValue(restaurantPayload?.googleReviewUrl, localePriority) ??
          undefined;

        if (!restaurantId) {
          throw new Error("Restaurant not found");
        }

        if (
          canonicalSlug &&
          canonicalSlug !== restaurantSlug &&
          OBJECT_ID_REGEX.test(restaurantSlug)
        ) {
          const target = buildLocalizedPath(
            `/restaurant/${canonicalSlug}/menuItem/${menuItemId}${
              serializedSearchParams ? `?${serializedSearchParams}` : ""
            }`,
            locale
          );
          router.replace(target);
        }

        const detailSearch = new URLSearchParams();
        if (kindParam) {
          detailSearch.set("kind", kindParam);
        }
        const detailUrl = `/api/menuItems/${encodeURIComponent(
          restaurantId
        )}/menu-items/${encodeURIComponent(menuItemId)}${
          detailSearch.size > 0 ? `?${detailSearch.toString()}` : ""
        }`;

        const detailRes = await fetch(detailUrl, { cache: "no-store" });
        if (!detailRes.ok) {
          throw new Error(
            detailRes.status === 404 ? "Menu item not found" : "Failed to fetch menu item"
          );
        }

        const rawDetailResponse = await detailRes.json().catch(() => null);
        const payload = getMenuItemPayload(rawDetailResponse, menuItemId);

        if (!payload) {
          throw new Error("Menu item not found");
        }

        const viewModel = buildMenuItemViewModel(payload, menuItemId, localePriority);

        if (cancelled) {
          return;
        }

        setState({
          status: "ready",
          viewModel,
          restaurantId,
          canonicalSlug,
          restaurantName,
          googleReviewUrl,
          brandColor,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load menu item.",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    restaurantSlug,
    menuItemId,
    locale,
    kindParam,
    serializedSearchParams,
    router,
  ]);

  if (state.status === "loading") {
    return <MenuItemLoading />;
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-[#B91C1C]">
        {state.message}
      </div>
    );
  }

  return (
    <MenuItemDetails
      {...state.viewModel}
      restaurantId={state.restaurantId}
      restaurantSlug={state.canonicalSlug}
      restaurantName={state.restaurantName}
      googleReviewUrl={state.googleReviewUrl}
      brandColor={state.brandColor}
    />
  );
}
