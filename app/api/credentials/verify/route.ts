import { NextRequest, NextResponse } from "next/server";
import { verifyPassToken, hashPassToken } from "@/lib/qr/token";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isPassPendingVerification } from "@/lib/storage/unverified-passes";

/**
 * Minimal in-memory token bucket (per Vercel instance).
 * Plan §13.3 — credential oracle must be throttled.
 */
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}

const invalid = (message: string) =>
  NextResponse.json({ valid: false, status: "invalid", error: message }, { status: 404 });

async function lookupCredential(identifier: string) {
  const supabase = await createClient();
  const query = supabase
    .from("credentials")
    .select("id, status, pass_type, holder_name, pass_code")
    .or(`token_hash.eq.${identifier},pass_code.eq.${identifier.toUpperCase()}`)
    .maybeSingle();

  const { data } = await query;
  return data as
    | { id: string; status: string; pass_type: string; holder_name: string; pass_code: string }
    | null;
}

async function processVerification(token: string) {
  const trimmed = token.trim();

  // Instant check: unverified / pending bursary registry
  if (isPassPendingVerification(trimmed)) {
    return NextResponse.json(
      {
        valid: false,
        status: "pending_verification",
        error: "Admission Pending Bursary Verification",
        message: "Admission Pending Bursary Verification",
      },
      { status: 403 },
    );
  }

  // 1. Structured signed token — verify HMAC first, then require a DB row.
  if (trimmed.startsWith("ABK26.")) {
    const sigResult = verifyPassToken(trimmed);
    if (!sigResult.valid) {
      return NextResponse.json(
        {
          valid: false,
          status: "invalid",
          error: sigResult.error || "Malformed or forged pass token.",
        },
        { status: 404 },
      );
    }

    if (!isSupabaseConfigured()) {
      return invalid("Credential service unavailable.");
    }

    try {
      const hashed = hashPassToken(trimmed);
      const cred = await lookupCredential(hashed);

      // Fail closed: a valid signature without a database row is NOT proof of
      // accreditation — the row is the source of truth.
      if (!cred) {
        return invalid("Credential not found in the accreditation registry.");
      }

      if (
        cred.status === "pending_verification" ||
        cred.status === "pending_bank_verification" ||
        cred.status === "pending_approval" ||
        isPassPendingVerification(cred.pass_code)
      ) {
        return NextResponse.json(
          {
            valid: false,
            status: "pending_verification",
            error: "Admission Pending Bursary Verification",
            message: "Admission Pending Bursary Verification",
            passType: cred.pass_type,
            guestName: cred.holder_name,
          },
          { status: 403 },
        );
      }

      if (cred.status === "revoked") {
        return NextResponse.json(
          {
            valid: false,
            status: "revoked",
            error: "This accreditation pass has been revoked by festival security.",
          },
          { status: 403 },
        );
      }

      return NextResponse.json({
        valid: cred.status === "active",
        status: cred.status,
        passType: cred.pass_type,
        guestName: cred.holder_name,
        editionYear: sigResult.payload?.editionYear,
        signatureVerified: true,
      });
    } catch {
      return invalid("Credential service unavailable.");
    }
  }

  // 2. Plain pass code lookup.
  if (isSupabaseConfigured()) {
    try {
      const cred = await lookupCredential(trimmed);
      if (cred) {
        if (
          cred.status === "pending_verification" ||
          cred.status === "pending_bank_verification" ||
          cred.status === "pending_approval" ||
          isPassPendingVerification(cred.pass_code)
        ) {
          return NextResponse.json(
            {
              valid: false,
              status: "pending_verification",
              error: "Admission Pending Bursary Verification",
              message: "Admission Pending Bursary Verification",
              passType: cred.pass_type,
              guestName: cred.holder_name,
            },
            { status: 403 },
          );
        }

        if (cred.status === "revoked") {
          return NextResponse.json(
            {
              valid: false,
              status: "revoked",
              error: "This accreditation pass has been revoked by festival security.",
            },
            { status: 403 },
          );
        }

        return NextResponse.json({
          valid: cred.status === "active",
          status: cred.status,
          passType: cred.pass_type,
          guestName: cred.holder_name,
          signatureVerified: false,
        });
      }
    } catch {
      return invalid("Credential service unavailable.");
    }
  }

  return invalid("Unrecognized pass code.");
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("id");
  if (!token) {
    return NextResponse.json(
      { valid: false, status: "invalid", error: "Missing token parameter (?token=...)" },
      { status: 400 },
    );
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { valid: false, status: "rate_limited", error: "Too many verification attempts." },
      { status: 429 },
    );
  }

  return processVerification(token);
}

export async function POST(req: NextRequest) {
  let body: { token?: string; tokenId?: string; passIdentifier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { valid: false, status: "invalid", error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const token = body.token || body.tokenId || body.passIdentifier;
  if (!token) {
    return NextResponse.json(
      { valid: false, status: "invalid", error: "Missing token field in JSON payload" },
      { status: 400 },
    );
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { valid: false, status: "rate_limited", error: "Too many verification attempts." },
      { status: 429 },
    );
  }

  return processVerification(token);
}
