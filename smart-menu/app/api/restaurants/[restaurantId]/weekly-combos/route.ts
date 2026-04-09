import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await ctx.params;
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");

  if (!backendBase) {
    console.error("Weekly combos public proxy error: BACKEND_URL missing.");
    return NextResponse.json(
      { ok: false, data: null, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  if (!restaurantId) {
    return NextResponse.json(
      { ok: false, data: null, error: "restaurantId is required." },
      { status: 400 }
    );
  }

  const url = `${backendBase}/api/restaurants/${restaurantId}/weekly-combos`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Weekly combos public proxy request error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to fetch weekly combos." },
      { status: 500 }
    );
  }
}
