import { NextRequest, NextResponse } from "next/server";
import { verifyPassToken, hashPassToken } from "@/lib/qr/token";
import { verifyInvitationToken, verifyInvitationSeal, ROYAL_SECURITY_SEAL } from "@/lib/invitations/issuance";
import { getInvitationByCode } from "@/lib/invitations/storage";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isPassPendingVerification } from "@/lib/storage/unverified-passes";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * Verification-oracle throttling (Plan §13.3, review findings L1 + L2):
 * client-IP bucketing with a durable database-backed counter — see
 * lib/security/rate-limit.ts.
 */
const RATE_LIMIT_BUCKET_PREFIX = "credentials-verify";

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

/**
 * Normalizes input strings, URLs, or query parameters into canonical verification target.
 */
function normalizeVerificationTarget(raw: string): {
  normalized: string;
  seal?: string;
} {
  let target = raw.trim();
  let extractedSeal: string | undefined;

  // Check if target is a full URL or contains query parameters
  if (target.includes("?") || target.startsWith("http://") || target.startsWith("https://")) {
    try {
      // Use dummy origin if relative path
      const url = target.startsWith("http") ? new URL(target) : new URL(target, "https://abeokuta-polo.local");
      const sigParam = url.searchParams.get("sig") || url.searchParams.get("token");
      const idParam = url.searchParams.get("id") || url.searchParams.get("code");
      const sealParam = url.searchParams.get("seal");

      if (sealParam) {
        extractedSeal = decodeURIComponent(sealParam).trim();
      }

      if (sigParam) {
        target = decodeURIComponent(sigParam).trim();
      } else if (idParam) {
        target = decodeURIComponent(idParam).trim();
      }
    } catch {
      // Keep target as is
    }
  }

  return { normalized: target, seal: extractedSeal };
}

async function processVerification(token: string, explicitSeal?: string) {
  const { normalized, seal: parsedSeal } = normalizeVerificationTarget(token);
  const sealToCheck = explicitSeal || parsedSeal;

  // Instant check: unverified / pending accounts registry
  if (isPassPendingVerification(normalized)) {
    return NextResponse.json(
      {
        valid: false,
        status: "pending_verification",
        error: "Admission Pending Accounts Verification",
        message: "Admission Pending Accounts Verification",
      },
      { status: 403 },
    );
  }

  // 1. Structured signed token (ABK26.)
  if (normalized.startsWith("ABK26.")) {
    // 1a. First, check if this is a Complimentary Invitation Token embedding "Aare Elesin" seal
    const inviteSig = verifyInvitationToken(normalized);
    if (inviteSig.valid && inviteSig.payload) {
      const payload = inviteSig.payload;
      if (payload.securitySeal === ROYAL_SECURITY_SEAL) {
        const inv = await getInvitationByCode(payload.credentialId);
        if (inv && inv.status === "revoked") {
          return NextResponse.json(
            {
              valid: false,
              status: "revoked",
              error: "This complimentary invitation has been revoked by festival security.",
            },
            { status: 403 },
          );
        }

        return NextResponse.json({
          valid: true,
          status: "active",
          passType: "complimentary",
          category: payload.category,
          designation: payload.designation,
          guestName: payload.holderName,
          invitationCode: payload.credentialId,
          securitySeal: ROYAL_SECURITY_SEAL,
          editionYear: payload.editionYear || 2026,
          signatureVerified: true,
        });
      }
    }

    // 1b. Fallback to standard pass token verification
    const sigResult = verifyPassToken(normalized);
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
      const hashed = hashPassToken(normalized);
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
            error: "Admission Pending Accounts Verification",
            message: "Admission Pending Accounts Verification",
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

  // 2. Complimentary Invitation Code lookup (ABK-2026-INV-XXXX or ABK-COMP-)
  if (normalized.toUpperCase().startsWith("ABK-2026-INV-") || normalized.toUpperCase().startsWith("ABK-COMP-")) {
    const inv = await getInvitationByCode(normalized);
    if (inv) {
      if (inv.status === "revoked") {
        return NextResponse.json(
          {
            valid: false,
            status: "revoked",
            error: "This complimentary invitation has been revoked by festival security.",
          },
          { status: 403 },
        );
      }

      // If seal was explicitly provided, verify it matches "Aare Elesin"
      if (sealToCheck && sealToCheck.trim().toLowerCase() !== ROYAL_SECURITY_SEAL.toLowerCase()) {
        return NextResponse.json(
          {
            valid: false,
            status: "invalid_seal",
            error: `Security seal mismatch. Expected '${ROYAL_SECURITY_SEAL}'.`,
          },
          { status: 403 },
        );
      }

      const holderName =
        [inv.firstName, inv.surname].filter(Boolean).join(" ") ||
        inv.designation ||
        "Distinguished Guest";

      return NextResponse.json({
        valid: true,
        status: inv.status || "active",
        passType: "complimentary",
        category: inv.category,
        designation: inv.designation,
        guestName: holderName,
        invitationCode: inv.invitationCode,
        securitySeal: ROYAL_SECURITY_SEAL,
        signatureVerified: false,
      });
    }
  }

  // 3. Payload containing "Aare Elesin" seal
  if (sealToCheck || normalized.includes("Aare Elesin") || normalized.includes("AARE_ELESIN")) {
    const codeMatch = normalized.match(/ABK-2026-INV-[2-9A-HJ-NP-Z]{4}/i);
    if (codeMatch) {
      const code = codeMatch[0].toUpperCase();
      const sealCheck = verifyInvitationSeal(code, sealToCheck || "Aare Elesin");
      if (sealCheck.valid) {
        const inv = await getInvitationByCode(code);
        if (inv) {
          if (inv.status === "revoked") {
            return NextResponse.json(
              {
                valid: false,
                status: "revoked",
                error: "This complimentary invitation has been revoked by festival security.",
              },
              { status: 403 },
            );
          }
          const holderName =
            [inv.firstName, inv.surname].filter(Boolean).join(" ") ||
            inv.designation ||
            "Distinguished Guest";

          return NextResponse.json({
            valid: true,
            status: "active",
            passType: "complimentary",
            category: inv.category,
            designation: inv.designation,
            guestName: holderName,
            invitationCode: inv.invitationCode,
            securitySeal: ROYAL_SECURITY_SEAL,
            signatureVerified: false,
          });
        }
      }
    }
  }

  // 4. Plain standard pass code database lookup
  if (isSupabaseConfigured()) {
    try {
      const cred = await lookupCredential(normalized);
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
              error: "Admission Pending Accounts Verification",
              message: "Admission Pending Accounts Verification",
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
  const token =
    req.nextUrl.searchParams.get("token") ||
    req.nextUrl.searchParams.get("id") ||
    req.nextUrl.searchParams.get("sig") ||
    req.nextUrl.searchParams.get("code");
  const seal = req.nextUrl.searchParams.get("seal") || undefined;

  if (!token) {
    return NextResponse.json(
      { valid: false, status: "invalid", error: "Missing token parameter (?token=...)" },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const rateCheck = await consumeRateLimit(`${RATE_LIMIT_BUCKET_PREFIX}:${ip}`);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { valid: false, status: "rate_limited", error: "Too many verification attempts." },
      { status: 429 },
    );
  }

  return processVerification(token, seal);
}

export async function POST(req: NextRequest) {
  let body: {
    token?: string;
    tokenId?: string;
    passIdentifier?: string;
    id?: string;
    sig?: string;
    seal?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { valid: false, status: "invalid", error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const token =
    body.token ||
    body.tokenId ||
    body.passIdentifier ||
    body.id ||
    body.sig;
  const seal = body.seal;

  if (!token) {
    return NextResponse.json(
      { valid: false, status: "invalid", error: "Missing token field in JSON payload" },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const rateCheck = await consumeRateLimit(`${RATE_LIMIT_BUCKET_PREFIX}:${ip}`);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { valid: false, status: "rate_limited", error: "Too many verification attempts." },
      { status: 429 },
    );
  }

  return processVerification(token, seal);
}
