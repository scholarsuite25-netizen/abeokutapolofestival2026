import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email OTP verification (`verify_email` / token_hash flows).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "signup";
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "email" | "recovery" | "magiclink",
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/dashboard"}`);
    }
  }

  return NextResponse.redirect(`${origin}/verify-email?error=otp_failed`);
}
