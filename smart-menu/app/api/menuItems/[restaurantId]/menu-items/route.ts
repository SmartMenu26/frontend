import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildResponseHeaders,
  MENU_REVALIDATE_SECONDS,
} from "@/app/api/cache";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await ctx.params;

  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return NextResponse.json(
      { ok: false, message: "BACKEND_URL is not set" },
      { status: 500 }
    );
  }

  // ✅ forward all query params (kind, popular, limit, categoryId, subcategoryId...)
  const qs = req.nextUrl.searchParams.toString();
  const url = `${backendBase}/api/menuItems/${restaurantId}/menu-items${
    qs ? `?${qs}` : ""
  }`;

  const res = await fetch(url, {
    next: { revalidate: MENU_REVALIDATE_SECONDS },
  });
  const data = await res.json().catch(() => null);

  return NextResponse.json(data, {
    status: res.status,
    headers: buildResponseHeaders(res.ok, MENU_REVALIDATE_SECONDS),
  });
}
