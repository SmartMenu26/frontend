import { NextRequest, NextResponse } from "next/server";
import { sendPushToAll } from "@/app/actions";
import { extractApiData } from "@/app/lib/restaurantOperations";

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

    if (response.ok && data) {
      const orderData = body && typeof body === "object" ? (body as any) : null;
      const savedOrder = extractApiData<any>(data) || data?.data || data;
      const table = savedOrder?.tableNumber || orderData?.tableNumber || "—";
      const itemsCount = Array.isArray(savedOrder?.items)
        ? savedOrder.items.length
        : Array.isArray(orderData?.items)
        ? orderData.items.length
        : 0;
      const totalAmount = savedOrder?.subtotal ?? orderData?.subtotal ?? 0;

      void sendPushToAll(
        `Нова нарачка! 🍔 (Маса ${table})`,
        `${itemsCount} производи · Вкупно: ${totalAmount} ден`
      ).catch((err) => console.error("Error sending push notification for order:", err));
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Orders proxy request error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to reach backend." },
      { status: 500 }
    );
  }
}
