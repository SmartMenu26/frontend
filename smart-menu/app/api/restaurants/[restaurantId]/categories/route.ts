import { NextRequest, NextResponse } from "next/server";
import {
  buildResponseHeaders,
  RESTAURANT_REVALIDATE_SECONDS,
} from "@/app/api/cache";

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
    const res = await fetch(url.toString(), {
      next: { revalidate: RESTAURANT_REVALIDATE_SECONDS },
    });

    const data = await res.json().catch(() => ({ ok: false, data: [] }));
    return NextResponse.json(data, {
      status: res.status,
      headers: buildResponseHeaders(res.ok, RESTAURANT_REVALIDATE_SECONDS),
    });
  } catch (error) {
    console.error("Categories proxy error:", error);
    return NextResponse.json({ ok: false, data: [] }, { status: 500 });
  }
}
