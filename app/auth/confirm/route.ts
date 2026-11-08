import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Email OTP verification (`verify_email` / token_hash flows).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "signup") as EmailOtpType;
  const next = searchParams.get("next") ?? "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin = (!isLocalEnv && forwardedHost) ? `${forwardedProto}://${forwardedHost}` : origin;
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (token_hash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${redirectOrigin}${safeNext}`);
    }
  }

  if (safeNext.startsWith("/reset-password") || type === "recovery") {
    return NextResponse.redirect(`${redirectOrigin}/reset-password?error=otp_failed`);
  }

  return NextResponse.redirect(`${redirectOrigin}/verify-email?error=otp_failed`);
}
