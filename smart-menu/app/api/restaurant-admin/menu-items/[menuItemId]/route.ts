import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ menuItemId: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (!backendBase) {
    console.error("Menu item update proxy error: BACKEND_URL missing.");
    return NextResponse.json(
      { ok: false, data: null, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { ok: false, data: null, error: "Missing authorization header." },
      { status: 401 }
    );
  }

  const { menuItemId } = await context.params;
  if (!menuItemId) {
    return NextResponse.json(
      { ok: false, data: null, error: "menuItemId is required." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Menu item update proxy body parse error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const url = `${backendBase}/api/restaurant-admin/menu-items/${menuItemId}`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Menu item update proxy request error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to update menu item." },
      { status: 500 }
    );
  }
}
