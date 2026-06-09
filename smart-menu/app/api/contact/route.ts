import { NextResponse } from "next/server";
import { getSmtpConfig, sendSmartMenuEmail } from "@/app/lib/email";

const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO ?? "restaurantsmart26@gmail.com";

type ContactPayload = {
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  email?: unknown;
  restaurantName?: unknown;
  message?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    return NextResponse.json(
      { error: "Contact email is not configured." },
      { status: 500 }
    );
  }

  const payload = (await request.json().catch(() => null)) as ContactPayload | null;

  if (!payload) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const firstName = readString(payload.firstName);
  const lastName = readString(payload.lastName);
  const phone = readString(payload.phone);
  const email = readString(payload.email);
  const restaurantName = readString(payload.restaurantName);
  const message = readString(payload.message);

  if (!firstName || !lastName || !email || !restaurantName) {
    return NextResponse.json(
      { error: "Required contact fields are missing." },
      { status: 400 }
    );
  }

  const subject = `Smart Menu contact request - ${restaurantName}`;
  const text = [
    `First name: ${firstName}`,
    `Last name: ${lastName}`,
    `Phone: ${phone || "Not provided"}`,
    `Email: ${email}`,
    `Restaurant name: ${restaurantName}`,
    `Message: ${message || "Not provided"}`,
  ].join("\n");
  const htmlRows = [
    ["First name", firstName],
    ["Last name", lastName],
    ["Phone", phone || "Not provided"],
    ["Email", email],
    ["Restaurant name", restaurantName],
    ["Message", message || "Not provided"],
  ];

  try {
    await sendSmartMenuEmail({
      to: CONTACT_EMAIL_TO,
      from: process.env.CONTACT_EMAIL_FROM ?? smtpConfig.auth.user,
      replyTo: email,
      subject,
      text,
      html: `
        <h2>Smart Menu contact request</h2>
        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
          ${htmlRows
            .map(
              ([label, value]) => `
                <tr>
                  <th align="left" style="border-bottom:1px solid #eee">${escapeHtml(label)}</th>
                  <td style="border-bottom:1px solid #eee">${escapeHtml(value)}</td>
                </tr>
              `
            )
            .join("")}
        </table>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return NextResponse.json(
      { error: "Unable to send contact email." },
      { status: 500 }
    );
  }
}
