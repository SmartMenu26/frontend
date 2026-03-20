import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (!backendBase) {
    console.error("Feedback list proxy error: BACKEND_URL missing.");
    return NextResponse.json(
      { ok: false, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization header." },
      { status: 401 }
    );
  }

  const { restaurantId } = await context.params;
  if (!restaurantId) {
    return NextResponse.json(
      { ok: false, error: "restaurantId is required." },
      { status: 400 }
    );
  }

  const search = req.nextUrl.searchParams.toString();
  const url = `${backendBase}/api/restaurant-admin/restaurants/${restaurantId}/feedback${
    search ? `?${search}` : ""
  }`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Feedback list proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch feedback." },
      { status: 500 }
    );
  }
}
