import nodemailer from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || Number.isNaN(port)) {
    return null;
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user,
      pass,
    },
  };
}

export async function sendSmartMenuEmail({
  to,
  subject,
  text,
  html,
  replyTo,
  from,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  from?: string;
}) {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    throw new Error("SMTP email is not configured.");
  }

  const transporter = nodemailer.createTransport(smtpConfig);

  await transporter.sendMail({
    to,
    from: from ?? process.env.CONTACT_EMAIL_FROM ?? smtpConfig.auth.user,
    replyTo,
    subject,
    text,
    html,
  });
}
