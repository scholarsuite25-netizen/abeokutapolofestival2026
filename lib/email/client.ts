import "server-only";
import { requireServerEnv } from "@/lib/env";
import { recordNotification } from "@/lib/notifications/notification-log";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Dispatches transactional email through Resend or EmailBump API.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const result = await dispatchEmail(options);

  // Delivery proof: every message is logged so the Secretariat can prove
  // what was sent and what the provider replied.
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  void recordNotification({
    channel: "email",
    recipient: recipients.join(", "),
    subject: options.subject,
    status: result.success ? "sent" : result.error ? "failed" : "skipped",
    provider: result.success ? "resend" : undefined,
    providerId: result.messageId,
    error: result.error,
  });

  return result;
}

async function dispatchEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const env = requireServerEnv();
  const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  const emailBumpApiKey = env.EMAILBUMP_API_KEY || process.env.EMAILBUMP_API_KEY;
  const defaultFrom =
    env.EMAIL_FROM ||
    process.env.EMAIL_FROM ||
    "tickets@guests.abeokutapolofestival2026.org.ng";
  const replyTo =
    options.replyTo || process.env.EMAIL_REPLY_TO || "abeokutapolo@gmail.com";
  const plainText = options.text || stripHtmlToPlainText(options.html);

  // 1. Try Resend if configured
  if (resendApiKey) {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const fromSender = options.from || defaultFrom;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:
            fromSender.includes("@") && !fromSender.includes("<")
              ? `Abeokuta Polo Festival 2026 <${fromSender}>`
              : fromSender,
          to: recipients,
          reply_to: replyTo,
          subject: options.subject,
          html: options.html,
          text: plainText,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: true,
          messageId: data.id || "resend_sent",
        };
      }

      const errorText = await response.text();
      console.warn("[Resend] Dispatch notice:", response.status, errorText);
      // If Resend failed and EmailBump is not configured, return error
      if (!emailBumpApiKey) {
        return {
          success: false,
          error: `Resend HTTP ${response.status}: ${errorText}`,
        };
      }
    } catch (resendErr) {
      console.warn("[Resend] Exception, falling back if available:", resendErr);
      if (!emailBumpApiKey) {
        return {
          success: false,
          error: resendErr instanceof Error ? resendErr.message : String(resendErr),
        };
      }
    }
  }

  // 2. Fallback to EmailBump if configured
  if (!emailBumpApiKey) {
    if (!resendApiKey) {
      console.warn("[Email] Neither RESEND_API_KEY nor EMAILBUMP_API_KEY configured. Email skipped.");
    }
    return {
      success: false,
      error: "No email gateway API key configured",
    };
  }

  const recipients = Array.isArray(options.to) ? options.to.join(",") : options.to;

  try {
    const response = await fetch("https://emailbump.com/api/v1/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailBumpApiKey}`,
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
