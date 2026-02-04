import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ restaurantId: string; menuItemId: string }> }
) {
  const { restaurantId, menuItemId } = await ctx.params;

  const backendBase = process.env.BACKEND_URL;
  console.log("BACKEND_URL:", process.env.BACKEND_URL);

  if (!backendBase) {
    return NextResponse.json(
      { ok: false, message: "BACKEND_URL is not set" },
      { status: 500 }
    );
  }

  const url = `${backendBase}/api/menuItems/${restaurantId}/menu-items/${menuItemId}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => null);

  return NextResponse.json(data, { status: res.status });
}
