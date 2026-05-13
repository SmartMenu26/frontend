import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ serviceRequestId: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const backendBase = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (!backendBase) {
    console.error("Admin service request status proxy error: BACKEND_URL missing.");
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

  const { serviceRequestId } = await context.params;
  if (!serviceRequestId) {
    return NextResponse.json(
      { ok: false, data: null, error: "serviceRequestId is required." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Admin service request status proxy body parse error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${backendBase}/api/restaurant-admin/service-requests/${serviceRequestId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin service request status proxy error:", error);
    return NextResponse.json(
      { ok: false, data: null, error: "Failed to update service request status." },
      { status: 500 }
    );
  }
}
