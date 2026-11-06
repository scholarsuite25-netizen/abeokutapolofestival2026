import "server-only";

/**
 * Special Invitation Codes for complimentary Day 3 VVIP passes.
 *
 * Codes come ONLY from the server environment variable VVIP_INVITATION_CODES
 * (comma-separated). They are never hard-coded, never shown in the UI and never
 * guessed from a prefix or length. Each code must be at least 6 characters.
 * Matching ignores case and surrounding spaces.
 */

const MIN_CODE_LENGTH = 6;

export function getAuthorizedInvitationCodes(): Set<string> {
  const raw = process.env.VVIP_INVITATION_CODES ?? "";
  return new Set(
    raw
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter((code) => code.length >= MIN_CODE_LENGTH),
  );
}

export function isValidSpecialInvitation(code?: string | null): boolean {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  if (normalized.length < MIN_CODE_LENGTH) return false;
  return getAuthorizedInvitationCodes().has(normalized);
}
