import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ restaurantId: string; menuItemId: string }>;
};

const normalizeBase = (input?: string | null) =>
  input?.trim().replace(/\/$/, "") ?? "";

export async function PATCH(req: NextRequest, context: RouteParams) {
  const backendBase = normalizeBase(process.env.BACKEND_URL);
  if (!backendBase) {
    return NextResponse.json(
      { ok: false, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  const { restaurantId, menuItemId } = await context.params;
  if (!restaurantId || !menuItemId) {
    return NextResponse.json(
      { ok: false, error: "restaurantId and menuItemId are required." },
      { status: 400 }
    );
  }

  const url = `${backendBase}/api/menuItems/${restaurantId}/menu-items/${menuItemId}/views`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Menu item view proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update menu item views." },
      { status: 502 }
    );
  }
}
