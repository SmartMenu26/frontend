import { NextResponse } from "next/server";
import {
  buildResponseHeaders,
} from "@/app/api/cache";

export async function GET() {
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
    return NextResponse.json(data, {
      status: res.status,
      headers: buildResponseHeaders(false, 0),
    });
  } catch (error) {
    console.error("Restaurants proxy error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to fetch restaurants." },
      { status: 500 }
    );
  }
}
