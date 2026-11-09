import { randomBytes, createHmac, randomUUID } from "node:crypto";
import type { ComplimentaryInvitation, InvitationSealVerificationResult } from "./types";
import { getInvitationByCodeSync } from "./storage";

export const ROYAL_SECURITY_SEAL = "Aare Elesin" as const;

/**
 * Resolves the signing secret for HMAC-SHA256 tokens.
 */
function getSigningSecret(): string {
  return (
    process.env.QR_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "abk-polo-2026-production-qr-signing-key-32-chars"
  );
}

/**
 * Generates an official unique invitation code in format ABK-2026-INV-XXXX.
 * Uses 4 alphanumeric characters (excluding visually ambiguous 0, O, 1, I).
 */
export function generateInvitationCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(4);
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return `ABK-2026-INV-${suffix}`;
}

export interface InvitationTokenPayload {
  credentialId: string;
  holderName: string;
  passType: "complimentary";
  category: string;
  designation: string;
  securitySeal: "Aare Elesin";
  editionYear: 2026;
  issuedAt: number;
}

/**
 * Generates an HMAC-SHA256 cryptographic token embedding the "Aare Elesin" royal seal.
 * Token format: ABK26.<base64url-payload>.<signature>
 */
export function generateSignedInvitationToken(payload: InvitationTokenPayload): string {
  const secret = getSigningSecret();
  const jsonPayload = JSON.stringify(payload);
  const encodedPayload = Buffer.from(jsonPayload).toString("base64url");

  const hmac = createHmac("sha256", secret);
  hmac.update(`ABK26.${encodedPayload}`);
  const signature = hmac.digest("base64url");

  return `ABK26.${encodedPayload}.${signature}`;
}

/**
 * Verifies a cryptographic invitation token and decodes the embedded payload.
 */
export function verifyInvitationToken(
  token: string
): { valid: boolean; payload?: InvitationTokenPayload; error?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token is empty or invalid." };
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "ABK26") {
    return { valid: false, error: "Malformed invitation token format." };
  }

  const [, encodedPayload, providedSig] = parts;
  const secret = getSigningSecret();

  const hmac = createHmac("sha256", secret);
  hmac.update(`ABK26.${encodedPayload}`);
  const expectedSig = hmac.digest("base64url");

  if (providedSig !== expectedSig) {
    return { valid: false, error: "Cryptographic signature mismatch. Token may be forged." };
  }

  try {
    const rawJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(rawJson) as InvitationTokenPayload;

    if (payload.securitySeal !== ROYAL_SECURITY_SEAL) {
      return { valid: false, error: "Token does not contain the authentic Aare Elesin security seal." };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to parse token payload JSON." };
  }
}

/**
 * Builds the canonical public verification link combining "Aare Elesin" and unique invitation ID.
 */
export function buildInvitationVerificationUrl(
  invitationCode: string,
  token?: string,
  origin?: string
): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://abeokuta-polo-festival-2026.vercel.app");

  const cleanBase = base.replace(/\/+$/, "");
  const params = new URLSearchParams({
    id: invitationCode,
    seal: ROYAL_SECURITY_SEAL,
  });

  if (token) {
    params.set("sig", token);
  }

  return `${cleanBase}/invitation/verify?${params.toString()}`;
}

/**
 * Creates the complete ComplimentaryInvitation model instance.
 * Generates ID, Code, "Aare Elesin" seal, cryptographic token, and scannable QR payload.
 */
export function createInvitationPayload(
  data: Omit<
    ComplimentaryInvitation,
    "id" | "invitationCode" | "securitySeal" | "qrPayload" | "createdAt" | "isLockedToDevice" | "isCustomCategory"
  > & {
    id?: string;
    invitationCode?: string;
    origin?: string;
    isCustomCategory?: boolean;
  }
): ComplimentaryInvitation {
  const id = data.id || randomUUID();
  const invitationCode = (data.invitationCode || generateInvitationCode()).toUpperCase().trim();
  const firstName = data.firstName?.trim() || null;
  const surname = data.surname?.trim() || null;
  const designation = data.designation.trim();
  const category = data.category.trim();
  const standardCategories = [
    "VVIP",
    "VIP",
    "MEMBER",
    "ABEOKUTA POLO CLUB",
    "PRESS",
    "SPONSORS",
    "VENDORS",
    "PROGRAMME OFFICIALS",
  ];
  const isCustomCategory =
    typeof data.isCustomCategory === "boolean"
      ? data.isCustomCategory
      : !standardCategories.includes(category.toUpperCase());
  const createdAt = new Date().toISOString();

  const holderName = [firstName, surname].filter(Boolean).join(" ") || designation || "Distinguished Guest";

  const qrToken = generateSignedInvitationToken({
    credentialId: invitationCode,
    holderName,
    passType: "complimentary",
    category,
    designation,
    securitySeal: ROYAL_SECURITY_SEAL,
    editionYear: 2026,
    issuedAt: Date.now(),
  });

  const qrPayload = buildInvitationVerificationUrl(invitationCode, qrToken, data.origin);

  return {
    id,
    invitationCode,
    firstName,
    surname,
    designation,
    category,
    isCustomCategory,
    securitySeal: ROYAL_SECURITY_SEAL,
    qrPayload,
    qrToken,
    boundDeviceId: null,
    isLockedToDevice: false,
    claimedAt: null,
    status: "active",
    createdAt,
  };
}

/**
 * Validates the security seal for a given invitation code.
 * Fulfills Interface Contract: verifyInvitationSeal(code, seal).
 */
export function verifyInvitationSeal(
  code: string,
  seal: string
): InvitationSealVerificationResult {
  if (!code) {
    return { valid: false, error: "Invitation code is required." };
  }

  if (!seal || seal.trim().toLowerCase() !== ROYAL_SECURITY_SEAL.toLowerCase()) {
    return {
      valid: false,
      error: `Invalid security seal. Expected '${ROYAL_SECURITY_SEAL}'.`,
    };
  }

  const existing = getInvitationByCodeSync(code);
  return {
    valid: true,
    invitation: existing || undefined,
    securitySeal: ROYAL_SECURITY_SEAL,
  };
}

/**
 * Generates formatted WhatsApp invitation dispatch text.
 */
export function generateWhatsAppInvitationText(
  invitation: ComplimentaryInvitation,
  origin?: string
): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://abeokuta-polo-festival-2026.vercel.app");

  const cleanBase = base.replace(/\/+$/, "");
  const directLink = `${cleanBase}/invitation/${invitation.invitationCode}`;
  const dignitaryName = [invitation.firstName, invitation.surname].filter(Boolean).join(" ");
  const salutation = dignitaryName ? dignitaryName : "Distinguished Dignitary";

  return `🐎 *ABEOKUTA POLO FESTIVAL 2026*
*Royal Complimentary Access & Formal Invitation*

Dear ${salutation},

The Abeokuta Polo Club Secretariat cordially presents your official complimentary admission for the *Abeokuta Polo Festival 2026*.

📋 *INVITATION DETAILS:*
• *Designation:* ${invitation.designation}
• *Access Category:* ${invitation.category}
• *Pass Reference:* \`${invitation.invitationCode}\`
• *Security Seal:* 🛡️ *${invitation.securitySeal}* (Royal Verification Check)

🎫 *OFFICIAL ACCESS CARD:*
Please open your official digital portrait invitation card below:
${directLink}

⚠️ *SECURITY PROTOCOL:*
_This invitation is strictly non-transferable. Upon first access, this credential binds exclusively to your mobile device for turnstile gate admission._

We look forward to welcoming you to the Kingdom of Egba.

*Secretariat of the Abeokuta Polo Club*`;
}
