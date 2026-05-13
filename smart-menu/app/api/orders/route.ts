import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");

  if (!backendBase) {
    console.error("Orders proxy error: BACKEND_URL is missing.");
    return NextResponse.json(
      { ok: false, data: null, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Orders proxy body parse error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${backendBase}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Orders proxy request error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to reach backend." },
      { status: 500 }
    );
  }
}
