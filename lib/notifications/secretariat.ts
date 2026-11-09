import { sendEmail } from "@/lib/email/client";
import { formatWhatsAppUrl } from "@/lib/utils/phone";
import { CLUB_BANK_DETAILS } from "@/lib/config/checkout-config";

export interface BankPaymentNotificationPayload {
  amountNgn: number;
  buyerName: string;
  phone: string;
  email: string;
  ref: string;
  ticketCount?: number;
  flow?: "vvip_pass" | "sponsorship" | "hospitality";
  tierName?: string;
  siteUrl?: string;
}

/**
 * Formats the exact instant notification message required for the Secretariat desk:
 * 🚨 NEW BANK PAYMENT NOTIFICATION: ₦[Amount] from [Buyer Name] (Phone: [Phone]). Ref: [ABK-WEMA-XXXX]. 1-Click Verification Link: [URL]
 */
export function formatBankPaymentSecretariatMessage(payload: BankPaymentNotificationPayload): string {
  const siteUrl =
    payload.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://abeokuta-polo-festival-2026.vercel.app";
  const verificationLink = `${siteUrl}/abawole/registrations?ref=${encodeURIComponent(payload.ref)}`;

  return (
    `🚨 NEW BANK PAYMENT NOTIFICATION: ₦${payload.amountNgn.toLocaleString()} ` +
    `from ${payload.buyerName} (Phone: ${payload.phone}). ` +
    `Ref: ${payload.ref}. ` +
    `1-Click Verification Link: ${verificationLink}`
  );
}

/**
 * Generates unique reference code for different payment flows.
 */
export function generateFlowReference(flow: "vvip" | "sponsorship" | "hospitality"): string {
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  switch (flow) {
    case "sponsorship":
      return `ABK-SPON-${hex}`;
    case "hospitality":
      return `ABK-HOSP-${hex}`;
    case "vvip":
    default:
      return `${CLUB_BANK_DETAILS.referencePrefix}${hex}`;
  }
}

/**
 * Automated Secretariat Notification Dispatch:
 * Sends instant email to Secretariat desk, dispatches webhook (if configured),
 * and prepares WhatsApp direct reconciliation payload.
 */
export async function notifySecretariatOfBankPayment(payload: BankPaymentNotificationPayload): Promise<{
  message: string;
  verificationLink: string;
  whatsappUrl: string;
}> {
  const message = formatBankPaymentSecretariatMessage(payload);
  const siteUrl =
    payload.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://abeokuta-polo-festival-2026.vercel.app";
  const verificationLink = `${siteUrl}/abawole/registrations?ref=${encodeURIComponent(payload.ref)}`;
  const whatsappUrl = formatWhatsAppUrl(CLUB_BANK_DETAILS.secretariatWhatsApp, message);

  // 1. Dispatch Email to Secretariat accreditation desk
  const secretariatEmail =
    process.env.SECRETARIAT_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "abeokutapolo@gmail.com";

  try {
    await sendEmail({
      to: secretariatEmail,
      subject: `🚨 NEW BANK PAYMENT: ₦${payload.amountNgn.toLocaleString()} from ${payload.buyerName} (${payload.ref})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #111827; background-color: #FAF9F5; border-radius: 12px; border: 1px solid #DCD5C2;">
          <div style="background-color: #7F1D1D; color: #FEF2F2; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="text-transform: uppercase; letter-spacing: 0.15em; font-size: 11px; margin: 0 0 6px 0; font-weight: bold; color: #FECACA;">⚡ Secretariat Immediate Action Required</p>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🚨 New Bank Payment Notification</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #FCA5A5;">Awaiting Bursary Confirmation & Pass Release</p>
          </div>

          <div style="padding: 24px 0;">
            <p style="font-size: 15px; margin: 0 0 16px 0; line-height: 1.5;">
              A buyer has submitted a direct bank wire transfer claim to the official <strong>Abeokuta Polo Club WEMA Bank</strong> account. Passes currently remain strictly <strong>UNVERIFIED</strong> until bursary confirmation.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Amount Transferred:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 800; font-size: 16px; color: #111827;">₦${payload.amountNgn.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Payment Reference:</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: 700; color: #B45309;">${payload.ref}</td>
              </tr>
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Buyer Name:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${payload.buyerName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Buyer Phone:</td>
                <td style="padding: 8px 0; text-align: right;"><a href="tel:${payload.phone}" style="color: #047857;">${payload.phone}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Buyer Email:</td>
                <td style="padding: 8px 0; text-align: right;">${payload.email}</td>
              </tr>
              ${payload.ticketCount ? `
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Tickets Claimed:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${payload.ticketCount} Day 3 VVIP Pass(es)</td>
              </tr>` : ""}
            </table>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${verificationLink}" style="display: inline-block; background-color: #065F46; color: #FFFFFF; font-weight: 700; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ⚡ Open 1-Click Verification Link
              </a>
            </div>

            <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 12px; font-size: 12px; color: #92400E;">
              <strong>🛡️ Anti-Fraud Protocol:</strong> Turnstiles will deny gate access for this pass until an administrator or bursary officer clicks Approve in the Command Centre.
            </div>
          </div>

          <div style="border-top: 1px solid #DCD5C2; padding-top: 14px; font-size: 11px; color: #6B7280; text-align: center;">
            Abeokuta Polo Club Secretariat · Notification System
          </div>
        </div>
      `,
    });
  } catch {
    // Non-blocking
  }

  // 2. Dispatch automated Webhook if configured
  const webhookUrl = process.env.SECRETARIAT_WEBHOOK_URL || process.env.ADMIN_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "bank_payment.notification",
          message,
          verificationLink,
          payload,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Non-blocking
    }
  }

  return { message, verificationLink, whatsappUrl };
}
