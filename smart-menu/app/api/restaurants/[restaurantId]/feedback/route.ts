import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (!backendBase) {
    console.error("Feedback proxy error: BACKEND_URL is missing.");
    return NextResponse.json(
      { ok: false, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  const { restaurantId } = await context.params;
  if (!restaurantId) {
    return NextResponse.json(
      { ok: false, error: "restaurantId parameter is required." },
      { status: 400 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const url = `${backendBase}/api/restaurants/${restaurantId}/feedback`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Feedback proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to submit feedback." },
      { status: 500 }
    );
  }
}
