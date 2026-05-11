import nodemailer from "nodemailer";
import { logger } from "./logger";

const SMTP_HOST = process.env["SMTP_HOST"];
const SMTP_PORT = process.env["SMTP_PORT"];
const SMTP_USER = process.env["SMTP_USER"];
const SMTP_PASS = process.env["SMTP_PASS"];
const NOTIFY_EMAIL = process.env["NOTIFY_EMAIL"];

function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && NOTIFY_EMAIL);
}

function parseSmtpPort(raw: string): number {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid SMTP_PORT value: "${raw}" — must be an integer between 1 and 65535`,
    );
  }
  return port;
}

let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured()) {
  try {
    const smtpPort = parseSmtpPort(SMTP_PORT!);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    logger.info("Email notifications enabled");
  } catch (err) {
    logger.error(
      { err },
      "Failed to initialize email transporter — email notifications disabled",
    );
  }
} else {
  logger.warn(
    "Email notifications disabled — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and NOTIFY_EMAIL to enable.",
  );
}

export async function verifySmtpConnection(): Promise<void> {
  if (!transporter) {
    logger.warn("Skipping SMTP verification — email not configured");
    return;
  }

  try {
    await transporter.verify();
    logger.info("SMTP connection verified successfully");
  } catch (err) {
    logger.error(
      { err },
      "SMTP connection verification failed — email notifications will not work",
    );
  }
}

interface ContactNotification {
  name: string;
  email: string;
  phone?: string;
  zipCode?: string;
  serviceType?: string;
  projectSummary?: string;
  budgetRange?: string;
  desiredStart?: string;
  preferredContactMethod?: string;
  source?: string;
  serviceDetails?: Record<string, unknown>;
  uploads?: Array<{ url: string; name: string; type: string; size: number }>;
  projectDetails?: string;
  description?: string;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, " ");
}

function formatServiceDetails(details: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) return "";
  const lines = Object.entries(details)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([k, v]) => `  ${formatLabel(k)}: ${v}`);
  return lines.length > 0 ? "\nService-Specific Details:\n" + lines.join("\n") : "";
}

export async function sendContactNotification(
  data: ContactNotification,
): Promise<void> {
  if (!transporter || !NOTIFY_EMAIL) {
    logger.warn(
      { submitterEmail: data.email },
      "Skipping email notification — SMTP not configured",
    );
    return;
  }

  const body = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    data.zipCode ? `ZIP Code: ${data.zipCode}` : null,
    data.serviceType ? `Service: ${data.serviceType}` : null,
    data.budgetRange ? `Budget: ${data.budgetRange}` : null,
    data.desiredStart ? `Timeline: ${data.desiredStart}` : null,
    data.preferredContactMethod ? `Preferred Contact: ${data.preferredContactMethod}` : null,
    data.source ? `Source: ${data.source}` : null,
    data.projectSummary ? `\nProject Summary:\n${data.projectSummary}` : null,
    data.projectDetails ? `\nProject Details:\n${data.projectDetails}` : null,
    data.description ? `\nDescription:\n${data.description}` : null,
    data.serviceDetails ? formatServiceDetails(data.serviceDetails) : null,
    data.uploads && data.uploads.length > 0
      ? `\nUploaded Files (${data.uploads.length}):\n` +
        data.uploads.map((u) => `  - ${u.name} (${(u.size / 1024).toFixed(1)} KB)`).join("\n")
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const serviceLabel = data.serviceType || "General";
  const zipLabel = data.zipCode || "";
  const subject = `New Able Hands Contracting Lead — ${serviceLabel}${zipLabel ? ` — ${zipLabel}` : ""}`;

  await transporter.sendMail({
    from: SMTP_USER,
    to: NOTIFY_EMAIL,
    subject,
    text: body,
    replyTo: data.email,
  });

  logger.info({ to: NOTIFY_EMAIL }, "Contact notification email sent");
}
