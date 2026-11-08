/**
 * In-memory registry of unverified bank transfer passes.
 * Used for local/preview environments and instant runtime gate turnstile enforcement.
 */

const unverifiedPassCodes = new Set<string>();

export function registerUnverifiedPass(passCode: string) {
  if (passCode) {
    unverifiedPassCodes.add(passCode.trim().toUpperCase());
  }
}

export function registerUnverifiedPasses(passCodes: string[]) {
  for (const code of passCodes) {
    registerUnverifiedPass(code);
  }
}

export function markPassVerified(passCode: string) {
  if (passCode) {
    unverifiedPassCodes.delete(passCode.trim().toUpperCase());
  }
}

export function isPassPendingVerification(passCode: string): boolean {
  if (!passCode) return false;
  const upper = passCode.trim().toUpperCase();
  if (unverifiedPassCodes.has(upper)) return true;
  if (upper.includes("PENDING") || upper.includes("UNVERIFIED")) return true;
  return false;
}
