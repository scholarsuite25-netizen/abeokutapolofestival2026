import { describe, it, expect, afterEach } from "vitest";
import { generateSignedPassToken, verifyPassToken, type PassPayload } from "@/lib/qr/token";
import {
  generateSignedInvitationToken,
  verifyInvitationToken,
  type InvitationTokenPayload,
} from "@/lib/invitations/issuance";

/**
 * Regression tests for the signing-secret fail-closed fix (C1):
 * production must refuse to sign or verify credentials without an explicit
 * QR_SIGNING_SECRET instead of falling back to the committed dev literal.
 */
const originalNodeEnv = process.env.NODE_ENV;
const originalQrSecret = process.env.QR_SIGNING_SECRET;

const passPayload: PassPayload = {
  credentialId: "ABK-2026-D3-TEST",
  holderName: "Test Holder",
  passType: "VVIP",
  editionYear: 2026,
  issuedAt: Date.now(),
};

const invitationPayload: InvitationTokenPayload = {
  credentialId: "ABK-2026-INV-TEST",
  holderName: "Test Guest",
  passType: "complimentary",
  category: "VVIP",
  designation: "Chairman",
  securitySeal: "Aare Elesin",
  editionYear: 2026,
  issuedAt: Date.now(),
};

function setProductionWithoutSecret() {
  // @ts-expect-error test override
  process.env.NODE_ENV = "production";
  // A blank value means "not set" (see lib/env.ts requireServerEnv).
  process.env.QR_SIGNING_SECRET = "";
}

afterEach(() => {
  // @ts-expect-error test restore
  process.env.NODE_ENV = originalNodeEnv;
  if (originalQrSecret === undefined) {
    delete process.env.QR_SIGNING_SECRET;
  } else {
    process.env.QR_SIGNING_SECRET = originalQrSecret;
  }
});

describe("QR Signing Secret Fail-Closed Behaviour", () => {
  it("refuses to sign pass tokens in production without QR_SIGNING_SECRET", () => {
    setProductionWithoutSecret();

    expect(() => generateSignedPassToken(passPayload)).toThrow(
      /QR_SIGNING_SECRET is not configured/,
    );
  });

  it("rejects pass token verification in production without the secret instead of using the shared dev key", () => {
    // Sign outside production (dev/test fallback path), then simulate a
    // production runtime missing the secret: verification must refuse.
    const token = generateSignedPassToken(passPayload);

    setProductionWithoutSecret();

    const res = verifyPassToken(token);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/QR_SIGNING_SECRET is not configured/);
  });

  it("refuses to sign invitation tokens in production without QR_SIGNING_SECRET", () => {
    setProductionWithoutSecret();

    expect(() => generateSignedInvitationToken(invitationPayload)).toThrow(
      /QR_SIGNING_SECRET is not configured/,
    );
  });

  it("rejects invitation token verification in production without the secret", () => {
    const token = generateSignedInvitationToken(invitationPayload);

    setProductionWithoutSecret();

    const res = verifyInvitationToken(token);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/QR_SIGNING_SECRET is not configured/);
  });

  it("keeps signing and verifying end-to-end outside production (dev/test fallback unchanged)", () => {
    const passToken = generateSignedPassToken(passPayload);
    expect(verifyPassToken(passToken).valid).toBe(true);

    const inviteToken = generateSignedInvitationToken(invitationPayload);
    const verified = verifyInvitationToken(inviteToken);
    expect(verified.valid).toBe(true);
    expect(verified.payload?.securitySeal).toBe("Aare Elesin");
  });
});
