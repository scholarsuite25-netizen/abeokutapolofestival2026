import { NextRequest, NextResponse } from "next/server";
import { verifyPassToken, hashPassToken } from "@/lib/qr/token";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token") || searchParams.get("id");

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Missing token parameter (?token=ABK26...)" },
      { status: 400 }
    );
  }

  return processVerification(token);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token || body.tokenId || body.passIdentifier;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Missing token field in JSON payload" },
        { status: 400 }
      );
    }

    return processVerification(token);
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid JSON request body" },
      { status: 400 }
    );
  }
}

async function processVerification(token: string) {
  const trimmed = token.trim();

  // 1. Verify Cryptographic Signature if structured token
  const sigResult = verifyPassToken(trimmed);
  if (sigResult.valid && sigResult.payload) {
    // If DB is configured, check revocation status
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const tokenHash = hashPassToken(trimmed);

        const { data: cred } = await supabase
          .from("credentials")
          .select("id, status, category, guest_name, expires_at")
          .or(`token_hash.eq.${tokenHash},token_id.eq.${trimmed}`)
          .maybeSingle();

        if (cred) {
          if (cred.status === "revoked") {
            return NextResponse.json({
              valid: false,
              status: "revoked",
              error: "This accreditation pass has been revoked by festival security.",
            });
          }

          return NextResponse.json({
            valid: true,
            status: cred.status,
            category: cred.category,
            guestName: cred.guest_name,
            expiresAt: cred.expires_at,
            editionYear: sigResult.payload.editionYear,
            signatureVerified: true,
          });
        }
      } catch {
        // Fallback to signature payload if DB query is unreachable
      }
    }

    // Return verified HMAC signature payload
    return NextResponse.json({
      valid: true,
      status: "active",
      category: sigResult.payload.passType,
      guestName: sigResult.payload.holderName,
      editionYear: sigResult.payload.editionYear,
      signatureVerified: true,
    });
  }

  // 2. Fallback: Query by token_id in Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: cred } = await supabase
        .from("credentials")
        .select("id, status, category, guest_name, expires_at")
        .eq("token_id", trimmed)
        .maybeSingle();

      if (cred) {
        return NextResponse.json({
          valid: cred.status === "active",
          status: cred.status,
          category: cred.category,
          guestName: cred.guest_name,
          expiresAt: cred.expires_at,
          signatureVerified: false,
        });
      }
    } catch {
      // Ignored
    }
  }

  return NextResponse.json(
    {
      valid: false,
      status: "invalid",
      error: sigResult.error || "Unrecognized or forged pass token.",
    },
    { status: 404 }
  );
}
