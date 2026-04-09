import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

function getBackendBase() {
  return process.env.BACKEND_URL?.trim().replace(/\/$/, "");
}

async function resolveRestaurantId(context: RouteContext) {
  const params = await context.params;
  return params?.restaurantId ?? "";
}

function missingBackendResponse() {
  console.error("Weekly combos proxy error: BACKEND_URL missing.");
  return NextResponse.json(
    { ok: false, data: null, error: "BACKEND_URL is not configured." },
    { status: 500 }
  );
}

function missingAuthResponse() {
  return NextResponse.json(
    { ok: false, data: null, error: "Missing authorization header." },
    { status: 401 }
  );
}

function missingRestaurantResponse() {
  return NextResponse.json(
    { ok: false, data: null, error: "restaurantId is required." },
    { status: 400 }
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const backendBase = getBackendBase();
  if (!backendBase) {
    return missingBackendResponse();
  }

  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return missingAuthResponse();
  }

  const restaurantId = await resolveRestaurantId(context);
  if (!restaurantId) {
    return missingRestaurantResponse();
  }

  const url = `${backendBase}/api/restaurant-admin/restaurants/${restaurantId}/weekly-combos`;

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
    console.error("Weekly combos GET proxy error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to fetch weekly combos." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const backendBase = getBackendBase();
  if (!backendBase) {
    return missingBackendResponse();
  }

  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return missingAuthResponse();
  }

  const restaurantId = await resolveRestaurantId(context);
  if (!restaurantId) {
    return missingRestaurantResponse();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Weekly combos PUT proxy body parse error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const url = `${backendBase}/api/restaurant-admin/restaurants/${restaurantId}/weekly-combos`;

  try {
    const response = await fetch(url, {
      method: "PUT",
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
    console.error("Weekly combos PUT proxy error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to update weekly combos." },
      { status: 500 }
    );
  }
}
