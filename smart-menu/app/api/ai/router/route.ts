import { NextRequest, NextResponse } from "next/server";

const routerServiceUrl =
  process.env.AI_ROUTER_SERVICE_URL ?? "http://localhost:5000/api/ai/router";

export async function POST(req: NextRequest) {
  const targetUrl = routerServiceUrl.trim();

  let body: { restaurantId?: string; message?: string } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const restaurantId = body.restaurantId?.trim();
  const message = body.message?.trim();

  if (!restaurantId || !message) {
    return NextResponse.json(
      {
        ok: false,
        message: "Both restaurantId and message are required",
      },
      { status: 400 }
    );
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AI_ROUTER_SERVICE_TOKEN
          ? { Authorization: `Bearer ${process.env.AI_ROUTER_SERVICE_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ restaurantId, message }),
    });

    const payload = await upstreamRes.json().catch(() => null);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            payload?.message ?? payload?.error ?? "AI router service failed",
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({ ok: true, data: payload });
  } catch (err) {
    console.error("AI router proxy error:", err);
    return NextResponse.json(
      { ok: false, message: "Unable to reach AI router service" },
      { status: 500 }
    );
  }
}
