import { NextRequest, NextResponse } from "next/server";
import { sendPushToAll } from "@/app/actions";
import { extractApiData } from "@/app/lib/restaurantOperations";

export async function POST(req: NextRequest) {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");

  if (!backendBase) {
    console.error("Service requests proxy error: BACKEND_URL is missing.");
    return NextResponse.json(
      { ok: false, data: null, error: "BACKEND_URL is not configured." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Service requests proxy body parse error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${backendBase}/api/service-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    if (response.ok && data) {
      const reqData = body && typeof body === "object" ? (body as any) : null;
      const savedReq = extractApiData<any>(data) || data?.data || data;
      const table = savedReq?.tableNumber || reqData?.tableNumber || "—";
      const type = savedReq?.type || reqData?.type || "";
      const note = savedReq?.note || reqData?.note || "";

      let title = `Повик за услуга 🔔 (Маса ${table})`;
      if (type === "call_waiter") {
        title = `Повик за келнер 🙋‍♂️ (Маса ${table})`;
      } else if (type === "bill_normal") {
        title = `Барање сметка 💳 (Маса ${table})`;
      } else if (type === "bill_split") {
        title = `Поделена сметка 🧾 (Маса ${table})`;
      }

      const bodyText = note ? `Забелешка: ${note}` : `Маса ${table} бара услуга.`;

      void sendPushToAll(title, bodyText).catch((err) =>
        console.error("Error sending push notification for service request:", err)
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Service requests proxy request error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to reach backend." },
      { status: 500 }
    );
  }
}
