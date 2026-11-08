import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link / password-reset / email confirmation callback.
 * Supports both PKCE `code` exchange and token_hash verification.
 * Preserves load balancer origin and routes failures to dedicated views.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";
  const incomingError = searchParams.get("error_description") || searchParams.get("error");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin = (!isLocalEnv && forwardedHost) ? `${forwardedProto}://${forwardedHost}` : origin;
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  // If Supabase passed an error directly (e.g. link expired, access denied)
  if (incomingError) {
    if (safeNext.startsWith("/reset-password") || type === "recovery") {
      return NextResponse.redirect(
        `${redirectOrigin}/reset-password?error=${encodeURIComponent(incomingError)}`,
      );
    }
    return NextResponse.redirect(
      `${redirectOrigin}/sign-in?error=${encodeURIComponent(incomingError)}`,
    );
  }

  // 1. Verify token_hash if present
  if (token_hash && type) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error) {
        return NextResponse.redirect(`${redirectOrigin}${safeNext}`);
      }
      if (safeNext.startsWith("/reset-password") || type === "recovery") {
        return NextResponse.redirect(
          `${redirectOrigin}/reset-password?error=${encodeURIComponent(error.message)}`,
        );
      }
    } catch {
      // Fall through to error redirect
    }
  }

  // 2. Exchange PKCE code if present
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${redirectOrigin}${safeNext}`);
      }
      if (safeNext.startsWith("/reset-password") || type === "recovery") {
        return NextResponse.redirect(
          `${redirectOrigin}/reset-password?error=${encodeURIComponent(error.message)}`,
        );
      }
    } catch {
      // Fall through to error redirect
    }
  }

  if (safeNext.startsWith("/reset-password") || type === "recovery") {
    return NextResponse.redirect(
      `${redirectOrigin}/reset-password?error=auth_callback_failed`,
    );
  }

  return NextResponse.redirect(`${redirectOrigin}/sign-in?error=auth_callback_failed`);
}

