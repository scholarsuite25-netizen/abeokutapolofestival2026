import { describe, expect, it } from "vitest";
import { generateSignedPassToken, hashPassToken, verifyPassToken } from "@/lib/qr/token";
import { submitRegistration } from "@/app/(public)/register/actions";
import { processGateScan } from "@/app/(ops)/scan/actions";

describe("Event Registration, Guest Affiliation & 3-Day Attendance", () => {
  describe("Cryptographic QR Token Security", () => {
    it("generates an authentic signed pass token and verifies HMAC signature", () => {
      const payload = {
        credentialId: "550e8400-e29b-41d4-a716-446655440000",
        holderName: "Olumide Adeleke",
        passType: "Guest of Member",
        editionYear: 2026,
        issuedAt: Date.now(),
      };

      const token = generateSignedPassToken(payload);
      expect(token).toMatch(/^ABK26\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

      const verified = verifyPassToken(token);
      expect(verified.valid).toBe(true);
      expect(verified.payload?.holderName).toBe("Olumide Adeleke");
      expect(verified.payload?.passType).toBe("Guest of Member");
      expect(verified.payload?.editionYear).toBe(2026);
    });

    it("rejects tampered QR tokens and mismatched signatures", () => {
      const payload = {
        credentialId: "fake-id",
        holderName: "Legitimate Guest",
        passType: "Individual Attendee",
        editionYear: 2026,
        issuedAt: Date.now(),
      };

      const token = generateSignedPassToken(payload);
      // Tamper with the encoded payload portion
      const parts = token.split(".");
      const forgedPayload = Buffer.from(JSON.stringify({ ...payload, holderName: "Intruder" })).toString("base64url");
      const forgedToken = `${parts[0]}.${forgedPayload}.${parts[2]}`;

      const check = verifyPassToken(forgedToken);
      expect(check.valid).toBe(false);
      expect(check.error).toContain("Cryptographic signature mismatch");
    });

    it("hashes pass token to deterministic SHA-256 for at-rest storage", () => {
      const token = "ABK26.test-payload.test-sig";
      const hash1 = hashPassToken(token);
      const hash2 = hashPassToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe("Registration Workflow with Guest Affiliation", () => {
    it("issues digital access card for Individual Attendee", async () => {
      const result = await submitRegistration({
        firstName: "Adebayo",
        lastName: "Balogun",
        email: "adebayo.balogun@example.com",
        phone: "+234 803 111 2233",
        affiliationType: "individual",
        groupSize: 1,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("confirmed");
      expect(result.passCode).toMatch(/^ABK-2026-[A-Z0-9]+$/);
      expect(result.holderName).toBe("Adebayo Balogun");
      expect(result.category).toBe("Individual Attendee");
      expect(result.zoneAccess).toContain("Festival Grounds & Grandstand");
    });

    it("issues digital access card with guest of affiliation", async () => {
      const result = await submitRegistration({
        firstName: "Chief",
        lastName: "Ogunbiyi",
        email: "chief.ogunbiyi@example.com",
        phone: "+234 802 333 4455",
        affiliationType: "guest_of",
        hostName: "Chief Olumide",
        groupSize: 2,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("confirmed");
      expect(result.passCode).toMatch(/^ABK-2026-[A-Z0-9]+$/);
      expect(result.affiliationType).toBe("guest_of");
      expect(result.hostName).toBe("Chief Olumide");
      expect(result.category).toBe("Guest of Chief Olumide");
    });

    it("issues digital access card with corporate company affiliation", async () => {
      const result = await submitRegistration({
        firstName: "Folake",
        lastName: "Solanke",
        email: "folake.s@firstbank.com.ng",
        phone: "+234 818 555 6677",
        affiliationType: "corporate",
        organization: "First Bank of Nigeria",
        groupSize: 3,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("confirmed");
      expect(result.passCode).toMatch(/^ABK-2026-[A-Z0-9]+$/);
      expect(result.affiliationType).toBe("corporate");
      expect(result.organization).toBe("First Bank of Nigeria");
      expect(result.category).toBe("Corporate Guest (First Bank of Nigeria)");
    });

    it("rejects invalid input with descriptive errors", async () => {
      const result = await submitRegistration({
        firstName: "A", // too short
        lastName: "",
        email: "not-an-email",
        phone: "123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("3-Day Daily Gate Check-In & Duplicate Prevention", () => {
    it("admits on Day 1, blocks second scan on Day 1, and admits on Day 2", async () => {
      const testPassCode = `ABK-2026-T${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. First scan on Day 1
      const scanDay1First = await processGateScan({
        passIdentifier: testPassCode,
        gate: "Gate 2 - General Turnstiles",
        eventDay: 1,
      });
      expect(scanDay1First.result).toBe("admitted");
      expect(scanDay1First.day1CheckedIn).toBe(true);

      // 2. Duplicate scan on Day 1
      const scanDay1Second = await processGateScan({
        passIdentifier: testPassCode,
        gate: "Gate 2 - General Turnstiles",
        eventDay: 1,
      });
      expect(scanDay1Second.result).toBe("already_admitted");
      expect(scanDay1Second.status).toBe("duplicate");

      // 3. First scan on Day 2 (should succeed for new tournament day!)
      const scanDay2First = await processGateScan({
        passIdentifier: testPassCode,
        gate: "Gate 2 - General Turnstiles",
        eventDay: 2,
      });
      expect(scanDay2First.result).toBe("admitted");
      expect(scanDay2First.day2CheckedIn).toBe(true);

      // 4. Duplicate scan on Day 2
      const scanDay2Second = await processGateScan({
        passIdentifier: testPassCode,
        gate: "Gate 2 - General Turnstiles",
        eventDay: 2,
      });
      expect(scanDay2Second.result).toBe("already_admitted");

      // 5. First scan on Day 3
      const scanDay3First = await processGateScan({
        passIdentifier: testPassCode,
        gate: "Gate 2 - General Turnstiles",
        eventDay: 3,
      });
      expect(scanDay3First.result).toBe("admitted");
      expect(scanDay3First.day3CheckedIn).toBe(true);
    });

    it("rejects unrecognized or malformed pass code", async () => {
      const result = await processGateScan({
        passIdentifier: "INVALID-CODE-XYZ",
        gate: "Gate 2 - General Turnstiles",
        eventDay: 1,
      });
      expect(result.result).toBe("rejected");
      expect(result.status).toBe("invalid");
    });
  });
});

