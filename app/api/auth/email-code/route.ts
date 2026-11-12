import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * Passwordless sign-in code by email.
 *
 * The club asked for a simple "send me a code" sign-in rather than an
 * authenticator app. This route:
 *
 *   1. throttles the request (per mailbox and per network),
 *   2. mints a single-use 6-digit code for a real staff account,
 *   3. emails it through the club's own mailer (Resend / EmailBump).
 *
 * The guest then types the code into the sign-in form, where the browser
 * exchanges it for a session (supabase.auth.verifyOtp). Nothing depends on
 * Supabase's own email quota, and no redirect allow-list is needed.
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
    consumeRateLimit(`email-code:mailbox:${email}`, { windowSeconds: 600, maxAttempts: 5 }),
    consumeRateLimit(`email-code:network:${ip}`, { windowSeconds: 600, maxAttempts: 20 }),
  ]);

  if (!perMailbox.allowed || !perNetwork.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many codes requested from this network. Please wait a few minutes, or sign in with your password.",
      },
      { status: 429 },
    );
  }

  try {
    const admin = createAdminClient();

    // Only genuine staff accounts (those with a console profile) may receive
    // a code. We answer identically either way so the form never reveals
    // which addresses exist.
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ sent: true });
    }

    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const code = data?.properties?.email_otp;
    if (error || !code) {
      // A generic answer — the club member may simply have the wrong address.
      return NextResponse.json({ sent: true });
    }

    const minutes = 15;
    const delivery = await sendEmail({
      to: email,
      subject: "Your Abeokuta Polo Festival console sign-in code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #141f18; background-color: #faf8f5; border-radius: 12px; border: 1px solid #dcd5c2;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 4px 12px; background-color: #062d1d; color: #dfbe75; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em;">
              Abeokuta Polo Festival 2026
            </div>
            <h1 style="margin: 12px 0 4px; font-size: 24px; font-weight: 600; color: #062d1d;">Your sign-in code</h1>
            <p style="margin: 0; font-size: 13px; color: #414843;">Use this code on the console sign-in page.</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; padding: 18px 28px; background-color: #062d1d; border-radius: 12px;">
              <span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 34px; font-weight: 700; letter-spacing: 0.24em; color: #dfbe75;">${code}</span>
            </div>
          </div>

          <div style="font-size: 12px; line-height: 1.6; color: #414843; background-color: #f4f4f0; border-radius: 8px; padding: 14px;">
            <strong style="color: #062d1d;">How to use it</strong>
            <ol style="margin: 8px 0 0; padding-left: 18px;">
              <li>Go to the festival website and choose <strong>Sign in</strong>.</li>
              <li>Enter this email address and press <strong>Email me a code</strong>.</li>
              <li>Type the code above and press <strong>Enter code</strong>.</li>
            </ol>
            <p style="margin: 12px 0 0;">The code works once and expires in about ${minutes} minutes. If you did not ask for it, you can ignore this email — nobody can sign in without it.</p>
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
            "We could not send the code just now. Please sign in with your password, or contact the Secretariat.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[email-code] Failed to send a sign-in code:", err);
    return NextResponse.json(
      {
        error:
          "We could not send the code just now. Please sign in with your password, or contact the Secretariat.",
      },
      { status: 500 },
    );
  }
}
