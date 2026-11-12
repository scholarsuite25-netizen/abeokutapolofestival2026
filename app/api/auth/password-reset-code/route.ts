import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { deliveryAddressFor, sharedMailbox } from "@/lib/email/shared-mailbox";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * Password reset by code.
 *
 * The club signs in with a password, so a forgotten password must be
 * recoverable without a working mailbox on the club's own domain. This route
 * mints a single-use recovery code for a real staff account and sends it the
 * same way sign-in codes are sent — to the club's shared mailbox for club
 * addresses, and directly for personal addresses.
 *
 * The browser exchanges the code for a session (supabase.auth.verifyOtp with
 * type "recovery") and then sets the new password. Nothing depends on
 * Supabase's own mailer or on a redirect allow-list.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter the email address the club gave you." },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const [perMailbox, perNetwork] = await Promise.all([
    consumeRateLimit(`password-reset:mailbox:${email}`, { windowSeconds: 900, maxAttempts: 3 }),
    consumeRateLimit(`password-reset:network:${ip}`, { windowSeconds: 900, maxAttempts: 10 }),
  ]);

  if (!perMailbox.allowed || !perNetwork.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many reset codes requested from this network. Please wait a few minutes, or ask a Super Admin to reset your password.",
      },
      { status: 429 },
    );
  }

  try {
    const admin = createAdminClient();

    // Only genuine staff accounts may receive a code. We answer identically
    // either way so the form never reveals which addresses exist.
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ sent: true });
    }

    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
    const code = data?.properties?.email_otp;
    if (error || !code) {
      return NextResponse.json({ sent: true });
    }

    const deliverTo = deliveryAddressFor(email);
    const isShared = deliverTo !== email;

    const delivery = await sendEmail({
      to: deliverTo,
      subject: "Your Abeokuta Polo Festival password reset code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #141f18; background-color: #faf8f5; border-radius: 12px; border: 1px solid #dcd5c2;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 4px 12px; background-color: #062d1d; color: #dfbe75; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em;">
              Abeokuta Polo Festival 2026
            </div>
            <h1 style="margin: 12px 0 4px; font-size: 24px; font-weight: 600; color: #062d1d;">Your password reset code</h1>
            <p style="margin: 0; font-size: 13px; color: #414843;">Use this code to choose a new password.</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; padding: 18px 28px; background-color: #062d1d; border-radius: 12px;">
              <span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 34px; font-weight: 700; letter-spacing: 0.24em; color: #dfbe75;">${code}</span>
            </div>
          </div>

          <div style="font-size: 12px; line-height: 1.6; color: #414843; background-color: #f4f4f0; border-radius: 8px; padding: 14px;">
            <strong style="color: #062d1d;">How to use it</strong>
            <ol style="margin: 8px 0 0; padding-left: 18px;">
              <li>Go to the festival website and choose <strong>Forgot password</strong>.</li>
              <li>Enter this email address and press <strong>Email me a reset code</strong>.</li>
              <li>Type the code above, choose a new password, and press <strong>Save new password</strong>.</li>
            </ol>
            <p style="margin: 12px 0 0;">The code works once and expires in about 60 minutes. If you did not ask for it, ignore this email — nobody can change a password without it.</p>
            ${
              isShared
                ? `<p style="margin: 8px 0 0;"><strong>Note:</strong> club addresses share one mailbox, so this code was sent to <strong>${sharedMailbox()}</strong>. Ask the Secretariat if you cannot see it.</p>`
                : ""
            }
          </div>

          <div style="margin-top: 20px; text-align: center; font-size: 11px; color: #727973;">
            Abeokuta Polo Club · Kobape, Ogun State · +234 818 188 8884
          </div>
        </div>
      `,
    });

    if (!delivery.success) {
      return NextResponse.json(
        {
          error:
            "We could not send the code just now. Please try again shortly, or ask a Super Admin to reset your password.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[password-reset-code] Failed to send a reset code:", err);
    return NextResponse.json(
      {
        error:
          "We could not send the code just now. Please try again shortly, or ask a Super Admin to reset your password.",
      },
      { status: 500 },
    );
  }
}
