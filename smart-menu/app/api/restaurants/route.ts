import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  const backendBase = process.env.BACKEND_URL;

  if (!backendBase) {
    console.error("Restaurants proxy error: BACKEND_URL is missing.");
    return NextResponse.json(
      {
        ok: false,
        data: null,
        error: "BACKEND_URL is not configured.",
      },
      { status: 500 }
    );
  }

  const url = `${backendBase}/api/restaurants`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({ ok: false, data: null }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Restaurants proxy error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to fetch restaurants." },
      { status: 500 }
    );
  }
}
