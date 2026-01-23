import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await ctx.params;

  const kind = req.nextUrl.searchParams.get("kind"); // "food" | "drink" | null

  const url = new URL(
    `${process.env.BACKEND_URL}/api/restaurants/${restaurantId}/categories`
  );
  if (kind) url.searchParams.set("kind", kind);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    const data = await res.json().catch(() => ({ ok: false, data: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Categories proxy error:", error);
    return NextResponse.json({ ok: false, data: [] }, { status: 500 });
  }
}
