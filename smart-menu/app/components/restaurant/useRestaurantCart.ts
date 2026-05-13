"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type RestaurantCartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
};

type RestaurantCartState = {
  table?: string;
  items: RestaurantCartItem[];
};

type UseRestaurantCartParams = {
  restaurantId?: string;
  restaurantSlug?: string;
};

type AddRestaurantCartItemInput = {
  menuItemId: string;
  name: string;
  price?: number;
  note?: string;
};

const CART_EVENT = "smart-menu:cart-updated";
export const CART_ADD_EVENT = "smart-menu:cart-added";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getRestaurantCartKey = (restaurantId?: string, restaurantSlug?: string) =>
  `smart-menu:cart:${restaurantId ?? restaurantSlug ?? "default"}`;

const normalizeTableValue = (value?: string | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const readTableFromSearch = (searchParams: URLSearchParams | null) =>
  normalizeTableValue(
    searchParams?.get("table") ??
      searchParams?.get("utm_table") ??
      searchParams?.get("t")
  );

const readStoredCart = (storageKey: string): RestaurantCartState => {
  if (typeof window === "undefined") {
    return { items: [] };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as unknown;

    if (!isRecord(parsed)) {
      return { items: [] };
    }

    const items = Array.isArray(parsed.items)
        ? parsed.items.reduce<RestaurantCartItem[]>((acc, entry) => {
          if (!isRecord(entry)) return acc;
          const menuItemId =
            typeof entry.menuItemId === "string"
              ? entry.menuItemId.trim()
              : typeof entry.id === "string"
                ? entry.id.trim()
                : "";
          const name = typeof entry.name === "string" ? entry.name.trim() : "";
          const quantity =
            typeof entry.quantity === "number" && Number.isFinite(entry.quantity)
              ? Math.max(1, Math.round(entry.quantity))
              : 1;
          const price =
            typeof entry.price === "number" && Number.isFinite(entry.price)
              ? entry.price
              : 0;

          const note = typeof entry.note === "string" ? entry.note.trim() : "";

          if (!menuItemId || !name) return acc;
          acc.push({ menuItemId, name, quantity, price, note });
          return acc;
        }, [])
      : [];

    return {
      table: normalizeTableValue(
        typeof parsed.table === "string" ? parsed.table : undefined
      ),
      items,
    };
  } catch {
    return { items: [] };
  }
};

const writeStoredCart = (storageKey: string, state: RestaurantCartState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
  window.dispatchEvent(
    new CustomEvent(CART_EVENT, {
      detail: { storageKey },
    })
  );
};

const dispatchCartAddEvent = (storageKey: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CART_ADD_EVENT, {
      detail: { storageKey },
    })
  );
};

export default function useRestaurantCart({
  restaurantId,
  restaurantSlug,
}: UseRestaurantCartParams) {
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";

  const storageKey = useMemo(
    () => getRestaurantCartKey(restaurantId, restaurantSlug),
    [restaurantId, restaurantSlug]
  );

  const tableFromUrl = useMemo(
    () => readTableFromSearch(searchParams),
    [searchParams, searchParamsString]
  );

  const [cart, setCart] = useState<RestaurantCartState>(() => ({
    table: tableFromUrl,
    items: [],
  }));

  const syncFromStorage = useCallback(() => {
    const stored = readStoredCart(storageKey);
    if (tableFromUrl && stored.table !== tableFromUrl) {
      const next = { ...stored, table: tableFromUrl };
      writeStoredCart(storageKey, next);
      setCart(next);
      return;
    }
    setCart(stored);
  }, [storageKey, tableFromUrl]);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== storageKey) return;
      syncFromStorage();
    };

    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ storageKey?: string }>;
      if (customEvent.detail?.storageKey !== storageKey) return;
      syncFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CART_EVENT, handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CART_EVENT, handleCartUpdate as EventListener);
    };
  }, [storageKey, syncFromStorage]);

  const addItem = useCallback(
    ({ menuItemId, name, price, note = "" }: AddRestaurantCartItemInput) => {
      if (!menuItemId || !name) return;

      const current = readStoredCart(storageKey);
      const nextItems = [...current.items];
      const existingIndex = nextItems.findIndex(
        (item) => item.menuItemId === menuItemId && item.note === note
      );
      const safePrice =
        typeof price === "number" && Number.isFinite(price) ? price : 0;

      if (existingIndex >= 0) {
        const existing = nextItems[existingIndex];
        nextItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
          price: safePrice || existing.price,
        };
      } else {
        nextItems.push({
          menuItemId,
          name,
          price: safePrice,
          quantity: 1,
          note,
        });
      }

      writeStoredCart(storageKey, {
        table: tableFromUrl ?? current.table,
        items: nextItems,
      });
      dispatchCartAddEvent(storageKey);
    },
    [storageKey, tableFromUrl]
  );

  const updateItemQuantity = useCallback(
    (menuItemId: string, note: string, quantity: number) => {
      if (!menuItemId) return;

      const current = readStoredCart(storageKey);
      const normalizedQuantity = Math.max(0, Math.round(quantity));
      const nextItems = current.items.reduce<RestaurantCartItem[]>((acc, item) => {
        if (item.menuItemId !== menuItemId || item.note !== note) {
          acc.push(item);
          return acc;
        }

        if (normalizedQuantity <= 0) {
          return acc;
        }

        acc.push({
          ...item,
          quantity: normalizedQuantity,
        });
        return acc;
      }, []);

      writeStoredCart(storageKey, {
        table: tableFromUrl ?? current.table,
        items: nextItems,
      });
    },
    [storageKey, tableFromUrl]
  );

  const incrementItem = useCallback(
    (menuItemId: string, note = "") => {
      const currentItem = cart.items.find(
        (item) => item.menuItemId === menuItemId && item.note === note
      );
      if (!currentItem) return;
      updateItemQuantity(menuItemId, note, currentItem.quantity + 1);
    },
    [cart.items, updateItemQuantity]
  );

  const decrementItem = useCallback(
    (menuItemId: string, note = "") => {
      const currentItem = cart.items.find(
        (item) => item.menuItemId === menuItemId && item.note === note
      );
      if (!currentItem) return;
      updateItemQuantity(menuItemId, note, currentItem.quantity - 1);
    },
    [cart.items, updateItemQuantity]
  );

  const clearCart = useCallback(() => {
    writeStoredCart(storageKey, {
      table: tableFromUrl ?? cart.table,
      items: [],
    });
  }, [cart.table, storageKey, tableFromUrl]);

  const itemCount = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items]
  );

  const total = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart.items]
  );

  return {
    cart,
    table: tableFromUrl ?? cart.table,
    items: cart.items,
    itemCount,
    total,
    addItem,
    updateItemQuantity,
    incrementItem,
    decrementItem,
    clearCart,
    storageKey,
  };
}
