"use client";

import { useEffect, useState } from "react";

type Params = {
  restaurantId?: string;
  restaurantSlug?: string;
  initialValue?: boolean;
};

type RestaurantListEntry = {
  _id?: string;
  id?: string;
  slug?: string;
  orderSystem?: boolean;
};

const readEntries = (payload: unknown): RestaurantListEntry[] => {
  if (Array.isArray(payload)) {
    return payload as RestaurantListEntry[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown[] }).data)
  ) {
    return (payload as { data: RestaurantListEntry[] }).data;
  }

  return [];
};

export default function useRestaurantOrderSystem({
  restaurantId,
  restaurantSlug,
  initialValue = false,
}: Params) {
  const [orderSystem, setOrderSystem] = useState(initialValue);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/restaurants", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json().catch(() => null);
        const entries = readEntries(payload);
        const normalizedSlug = restaurantSlug?.trim().toLowerCase();
        const match = entries.find((entry) => {
          const entryId =
            typeof entry._id === "string"
              ? entry._id
              : typeof entry.id === "string"
                ? entry.id
                : undefined;
          const entrySlug =
            typeof entry.slug === "string" ? entry.slug.trim().toLowerCase() : undefined;

          return (
            (restaurantId && entryId === restaurantId) ||
            (normalizedSlug && entrySlug === normalizedSlug)
          );
        });

        if (cancelled || typeof match?.orderSystem !== "boolean") return;

        console.log("[SmartMenu] client orderSystem", {
          restaurantId,
          restaurantSlug,
          orderSystem: match.orderSystem,
          source: "api/restaurants",
          restaurant: match,
        });

        setOrderSystem(match.orderSystem);
      } catch (error) {
        if (!cancelled) {
          console.error("[SmartMenu] client orderSystem fetch failed", error);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [restaurantId, restaurantSlug]);

  return orderSystem;
}
