import "server-only";
import { requireServerEnv } from "@/lib/env";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Dispatches transactional email through the EmailBump API.
 * API Endpoint: https://emailbump.com/api/v1/emails
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const env = requireServerEnv();
  const apiKey = env.EMAILBUMP_API_KEY;
  const defaultFrom = env.EMAIL_FROM || "tickets@abeokutapolofestival.com";

  if (!apiKey) {
    console.warn("[EmailBump] No EMAILBUMP_API_KEY configured. Email dispatch skipped in dev.");
    return {
      success: false,
      error: "EMAILBUMP_API_KEY is not configured",
    };
  }

  const recipients = Array.isArray(options.to) ? options.to.join(",") : options.to;

  try {
    const response = await fetch("https://emailbump.com/api/v1/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || defaultFrom,
        to: recipients,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[EmailBump] Dispatch failed:", response.status, errorText);
      return {
        success: false,
        error: `EmailBump HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      messageId: data.id || data.message_id || "sent",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[EmailBump] Exception sending email:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
