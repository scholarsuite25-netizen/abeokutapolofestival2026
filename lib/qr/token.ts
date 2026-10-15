import "server-only";
import { createHmac, createHash } from "node:crypto";
import { requireServerEnv } from "@/lib/env";

export interface PassPayload {
  credentialId: string;
  holderName: string;
  passType: string;
  editionYear: number;
  issuedAt: number;
}

/**
 * Creates a cryptographically signed QR pass token.
 * Token format: ABK26.<base64url-encoded-payload>.<signature>
 */
export function generateSignedPassToken(payload: PassPayload): string {
  const env = requireServerEnv();
  const secret = env.QR_SIGNING_SECRET || "fallback-secret-for-signing-pass-tokens-32-chars";

  const jsonPayload = JSON.stringify(payload);
  const encodedPayload = Buffer.from(jsonPayload).toString("base64url");

  const hmac = createHmac("sha256", secret);
  hmac.update(`ABK26.${encodedPayload}`);
  const signature = hmac.digest("base64url");

  return `ABK26.${encodedPayload}.${signature}`;
}

/**
 * Generates a SHA-256 hash of a pass token for safe at-rest storage and index lookup.
 */
export function hashPassToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verifies a pass token's HMAC signature.
 */
export function verifyPassToken(token: string): { valid: boolean; payload?: PassPayload; error?: string } {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "ABK26") {
    return { valid: false, error: "Malformed pass token format." };
  }

  const [, encodedPayload, providedSig] = parts;
  const env = requireServerEnv();
  const secret = env.QR_SIGNING_SECRET || "fallback-secret-for-signing-pass-tokens-32-chars";

  const hmac = createHmac("sha256", secret);
  hmac.update(`ABK26.${encodedPayload}`);
  const expectedSig = hmac.digest("base64url");

  if (providedSig !== expectedSig) {
    return { valid: false, error: "Cryptographic signature mismatch. Token may be forged." };
  }

  try {
    const rawJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(rawJson) as PassPayload;
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to parse token payload." };
  }
}
