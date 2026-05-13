import type { Locale } from "@/i18n";

export type LocalizedValue = Partial<Record<Locale, string>> | string | null | undefined;

export type RestaurantOrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "served"
  | "cancelled";

export type RestaurantServiceRequestType =
  | "call_waiter"
  | "bill_normal"
  | "bill_split";

export type RestaurantServiceRequestStatus =
  | "new"
  | "acknowledged"
  | "resolved"
  | "cancelled";

export type RestaurantOrderItem = {
  menuItemId: string;
  quantity: number;
  note?: string;
  nameSnapshot?: LocalizedValue;
  priceSnapshot?: number;
};

export type RestaurantOrder = {
  _id: string;
  restaurantId: string;
  tableNumber: string;
  status: RestaurantOrderStatus;
  items: RestaurantOrderItem[];
  subtotal: number;
  currency: string;
  guestNote?: string;
  acceptedBy?: string;
  servedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantServiceRequest = {
  _id: string;
  restaurantId: string;
  tableNumber: string;
  type: RestaurantServiceRequestType;
  status: RestaurantServiceRequestStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export const extractApiData = <T>(payload: unknown): T | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("data" in payload) {
    return (payload as { data?: T | null }).data ?? null;
  }

  return payload as T;
};
