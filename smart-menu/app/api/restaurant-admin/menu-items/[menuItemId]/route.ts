import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicRestaurantCache } from "@/app/api/cache";

type RouteContext = {
  params: Promise<{ menuItemId: string }>;
};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const unwrapRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const data = record.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return record;
};

const readNestedId = (value: unknown): string | null => {
  if (typeof value === "string") return readString(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return readString(record._id) ?? readString(record.id);
};

const extractRestaurantId = (payload: unknown) => {
  const record = unwrapRecord(payload);
  if (!record) return null;
  return (
    readString(record.restaurantId) ??
    readNestedId(record.restaurant) ??
    readNestedId(record.restaurantId)
  );
};

const extractRestaurantSlug = (payload: unknown) => {
  const record = unwrapRecord(payload);
  if (!record) return null;
  const restaurant = record.restaurant;
  if (restaurant && typeof restaurant === "object" && !Array.isArray(restaurant)) {
    return readString((restaurant as Record<string, unknown>).slug);
  }
  return readString(record.restaurantSlug) ?? readString(record.slug);
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (!backendBase) {
    console.error("Menu item update proxy error: BACKEND_URL missing.");
    return NextResponse.json(
      { ok: false, data: null, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { ok: false, data: null, error: "Missing authorization header." },
      { status: 401 }
    );
  }

  const { menuItemId } = await context.params;
  if (!menuItemId) {
    return NextResponse.json(
      { ok: false, data: null, error: "menuItemId is required." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Menu item update proxy body parse error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const url = `${backendBase}/api/restaurant-admin/menu-items/${menuItemId}`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (response.ok) {
      revalidatePublicRestaurantCache({
        restaurantId:
          readString(req.headers.get("x-restaurant-id")) ??
          extractRestaurantId(data),
        restaurantSlug:
          readString(req.headers.get("x-restaurant-slug")) ??
          extractRestaurantSlug(data),
        menuItemId,
        includeRestaurant: false,
        includeCategories: true,
        includeMenuItems: true,
      });
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Menu item update proxy request error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to update menu item." },
      { status: 500 }
    );
  }
}
