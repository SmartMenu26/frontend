import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

const normalizeBase = (value?: string | null) =>
  value?.trim().replace(/\/$/, "") ?? "";

export async function GET(req: NextRequest, context: RouteContext) {
  const backendBase = normalizeBase(process.env.BACKEND_URL);
  if (!backendBase) {
    return NextResponse.json(
      { ok: false, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  const { restaurantId } = await context.params;
  if (!restaurantId) {
    return NextResponse.json(
      { ok: false, error: "restaurantId is required." },
      { status: 400 }
    );
  }

  const query = req.nextUrl.searchParams.toString();
  const url = `${backendBase}/api/menuItems/${restaurantId}/menu-items/top-viewed${
    query ? `?${query}` : ""
  }`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Top viewed menu items proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch top viewed items." },
      { status: 502 }
    );
  }
}
