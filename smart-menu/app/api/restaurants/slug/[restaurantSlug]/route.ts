import { NextRequest, NextResponse } from "next/server";
import { fetchRestaurantRecord } from "@/app/lib/restaurants";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ restaurantSlug: string }> }
) {
  const { restaurantSlug } = await ctx.params;
  const normalizedSlug = restaurantSlug?.trim();

  if (!normalizedSlug) {
    return NextResponse.json(
      { ok: false, data: null, error: "Missing restaurant slug" },
      { status: 400 }
    );
  }

  try {
    const record = await fetchRestaurantRecord(normalizedSlug);
    if (!record) {
      return NextResponse.json({ ok: false, data: null }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: record }, { status: 200 });
  } catch (error) {
    console.error("Restaurant slug proxy error", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to resolve restaurant" },
      { status: 500 }
    );
  }
}
