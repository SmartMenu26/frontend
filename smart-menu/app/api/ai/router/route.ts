import { NextRequest, NextResponse } from "next/server";
import { sendSmartMenuEmail } from "@/app/lib/email";

type AiCredits = {
  remaining: number;
  used: number;
};

type AiRouterRequestBody = {
  restaurantId?: string;
  restaurantName?: string;
  message?: string;
};

const buildDefaultRouterUrl = () => {
  const backend = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (backend) {
    return `${backend}/api/ai/router`;
  }
  return "http://localhost:5000/api/ai/router";
};

const routerServiceUrl =
  process.env.AI_ROUTER_SERVICE_URL ?? buildDefaultRouterUrl();
const readEnvString = (...values: (string | undefined)[]) => {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
};
const aiCreditsAlertEmailTo =
  readEnvString(
    process.env.AI_CREDITS_ALERT_EMAIL_TO,
    process.env.CONTACT_EMAIL_TO
  ) ?? "restaurantsmart26@gmail.com";
const creditAlertThresholds = [100, 50] as const;
const sentCreditAlertKeys = new Set<string>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const readFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const readDisplayString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (!isRecord(value)) return null;

  const localizedCandidates = [value.mk, value.en, value.sq, value.tr];
  for (const candidate of localizedCandidates) {
    const resolved = readDisplayString(candidate);
    if (resolved) return resolved;
  }

  return null;
};

const parseAiCredits = (value: unknown): AiCredits | null => {
  if (!isRecord(value)) return null;

  const remaining = readFiniteNumber(value.remaining);

  if (remaining === null) return null;

  return {
    remaining,
    used: readFiniteNumber(value.used) ?? 0,
  };
};

const findAiCredits = (value: unknown, depth = 0): AiCredits | null => {
  if (depth > 5) return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const credits = findAiCredits(entry, depth + 1);
      if (credits) return credits;
    }
    return null;
  }

  if (!isRecord(value)) return null;

  const directCredits = parseAiCredits(value.aiCredits);
  if (directCredits) return directCredits;

  for (const entry of Object.values(value)) {
    const credits = findAiCredits(entry, depth + 1);
    if (credits) return credits;
  }

  return null;
};

const findRestaurantName = (value: unknown, depth = 0): string | null => {
  if (depth > 5) return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const name = findRestaurantName(entry, depth + 1);
      if (name) return name;
    }
    return null;
  }

  if (!isRecord(value)) return null;

  const directName =
    readDisplayString(value.restaurantName) ??
    readDisplayString(value.fullRestaurantName) ??
    readDisplayString(value.name);

  if (directName) return directName;

  for (const entry of Object.values(value)) {
    const name = findRestaurantName(entry, depth + 1);
    if (name) return name;
  }

  return null;
};

const getCreditAlertThreshold = (remaining: number) => {
  if (remaining <= 50) return 50;
  if (remaining <= 100) return 100;
  return null;
};

const resetRecoveredCreditAlerts = (restaurantId: string, remaining: number) => {
  for (const threshold of creditAlertThresholds) {
    if (remaining > threshold) {
      sentCreditAlertKeys.delete(`${restaurantId}:${threshold}`);
    }
  }
};

const sendAiCreditsAlert = async (
  restaurantId: string,
  restaurantName: string | null,
  credits: AiCredits
) => {
  resetRecoveredCreditAlerts(restaurantId, credits.remaining);

  const threshold = getCreditAlertThreshold(credits.remaining);
  if (!threshold) return;

  const alertKey = `${restaurantId}:${threshold}`;
  if (sentCreditAlertKeys.has(alertKey)) return;

  sentCreditAlertKeys.add(alertKey);

  try {
    const restaurantLabel = restaurantName ?? restaurantId;
    const subject = `Smart Menu AI credits alert - ${restaurantLabel} - ${credits.remaining} remaining`;
    const text = [
      `AI credits are at or below ${threshold}.`,
      `Restaurant name: ${restaurantName ?? "Not provided"}`,
      `Restaurant ID: ${restaurantId}`,
      `Remaining credits: ${credits.remaining}`,
      `Used credits: ${credits.used}`,
      `Checked at: ${new Date().toISOString()}`,
    ].join("\n");

    await sendSmartMenuEmail({
      to: aiCreditsAlertEmailTo,
      subject,
      text,
    });
  } catch (error) {
    sentCreditAlertKeys.delete(alertKey);
    console.error("Failed to send AI credits alert email:", error);
  }
};

export async function POST(req: NextRequest) {
  const targetUrl = routerServiceUrl.trim();

  let body: AiRouterRequestBody = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const restaurantId = body.restaurantId?.trim();
  const restaurantName = body.restaurantName?.trim() || null;
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

    const aiCredits = findAiCredits(payload);
    if (aiCredits) {
      await sendAiCreditsAlert(
        restaurantId,
        restaurantName ?? findRestaurantName(payload),
        aiCredits
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
