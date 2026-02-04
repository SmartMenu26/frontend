import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await ctx.params;

  if (!process.env.BACKEND_URL) {
    console.error("Restaurant proxy error: BACKEND_URL is missing.");
    return NextResponse.json(
      { ok: false, data: null, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  const url = `${process.env.BACKEND_URL}/api/restaurants/${restaurantId}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({ ok: false, data: null }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Restaurant proxy error:", error);
    return NextResponse.json({ ok: false, data: null }, { status: 500 });
  }
}
