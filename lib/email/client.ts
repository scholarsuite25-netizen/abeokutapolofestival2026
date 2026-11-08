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
 * Dispatches transactional email through Resend or EmailBump API.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const env = requireServerEnv();
  const resendApiKey = env.RESEND_API_KEY;
  const emailBumpApiKey = env.EMAILBUMP_API_KEY;
  const defaultFrom = env.EMAIL_FROM || "tickets@abeokutapolofestival.com";

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
          from: fromSender.includes("@") && !fromSender.includes("<")
            ? `Abeokuta Polo Festival 2026 <${fromSender}>`
            : fromSender,
          to: recipients,
          subject: options.subject,
          html: options.html,
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
