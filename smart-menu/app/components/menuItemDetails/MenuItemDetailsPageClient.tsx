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

const getMenuItemPayload = (payload: unknown): MenuItemPayload | null => {
  if (payload && typeof payload === "object") {
    if ("data" in payload && payload.data && typeof payload.data === "object") {
      return payload.data as MenuItemPayload;
    }
    return payload as MenuItemPayload;
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

        const payload = getMenuItemPayload(await detailRes.json().catch(() => null));
        if (!payload) {
          throw new Error("Menu item not found");
        }

        const localePriority = buildLocalePriority(locale);
        const viewModel = buildMenuItemViewModel(payload, menuItemId, localePriority);

        if (cancelled) {
          return;
        }

        setState({
          status: "ready",
          viewModel,
          restaurantId,
          canonicalSlug,
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
    return (
      <MenuItemLoading animationPath="/loader/loading-animation.json" />
    );
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
    />
  );
}
