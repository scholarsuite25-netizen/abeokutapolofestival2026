import { describe, it, expect, beforeEach } from "vitest";
import {
  generateInvitationCode,
  createInvitationPayload,
  verifyInvitationSeal,
  generateSignedInvitationToken,
  verifyInvitationToken,
  generateWhatsAppInvitationText,
  ROYAL_SECURITY_SEAL,
} from "@/lib/invitations/issuance";
import {
  saveInvitation,
  getInvitationByCode,
  listInvitations,
  bindInvitationToDevice,
  resetInvitationDeviceBinding,
  clearInvitationsMemoryStore,
} from "@/lib/invitations/storage";
import {
  STANDARD_INVITATION_CATEGORIES,
} from "@/lib/invitations/types";

describe("Milestone 1 & 2: Complimentary Invitations Data Engine & Secretariat Issuance", () => {
  beforeEach(() => {
    clearInvitationsMemoryStore();
  });

  describe("Invitation Code & Identifier Generation", () => {
    it("generates an invitation code matching format ABK-2026-INV-XXXX", () => {
      const code = generateInvitationCode();
      expect(code).toMatch(/^ABK-2026-INV-[2-9A-HJ-NP-Z]{4}$/);
    });

    it("generates unique codes across multiple sequential invocations", () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        codes.add(generateInvitationCode());
      }
      expect(codes.size).toBe(50);
    });
  });

  describe("Optional Names & Form Flexibility (Acceptance Criteria R1)", () => {
    it("creates an invitation with BOTH first name and surname provided", () => {
      const payload = createInvitationPayload({
        firstName: "Adewale",
        surname: "Soyinka",
        designation: "Honorary Patron",
        category: "VVIP",
        isCustomCategory: false,
      });

      expect(payload.firstName).toBe("Adewale");
      expect(payload.surname).toBe("Soyinka");
      expect(payload.designation).toBe("Honorary Patron");
      expect(payload.category).toBe("VVIP");
      expect(payload.isCustomCategory).toBe(false);
      expect(payload.invitationCode).toMatch(/^ABK-2026-INV-/);
      expect(payload.securitySeal).toBe("Aare Elesin");
    });

    it("successfully creates an invitation WITHOUT first name and surname (open dignitary pass)", () => {
      const payload = createInvitationPayload({
        firstName: "",
        surname: "",
        designation: "Diplomatic Delegation Envoy",
        category: "VIP",
        isCustomCategory: false,
      });

      expect(payload.firstName).toBeNull();
      expect(payload.surname).toBeNull();
      expect(payload.designation).toBe("Diplomatic Delegation Envoy");
      expect(payload.category).toBe("VIP");
      expect(payload.invitationCode).toMatch(/^ABK-2026-INV-/);
      expect(payload.securitySeal).toBe("Aare Elesin");
    });

    it("successfully creates an invitation with only first name provided", () => {
      const payload = createInvitationPayload({
        firstName: "Fumilayo",
        designation: "Media Director",
        category: "PRESS",
        isCustomCategory: false,
      });

      expect(payload.firstName).toBe("Fumilayo");
      expect(payload.surname).toBeNull();
      expect(payload.designation).toBe("Media Director");
    });

    it("successfully creates an invitation with only surname provided", () => {
      const payload = createInvitationPayload({
        surname: "Balogun",
        designation: "Tournament Official",
        category: "PROGRAMME OFFICIALS",
        isCustomCategory: false,
      });

      expect(payload.firstName).toBeNull();
      expect(payload.surname).toBe("Balogun");
      expect(payload.designation).toBe("Tournament Official");
    });
  });

  describe("Category Selection & Custom Category Input", () => {
    it("supports all 8 required standard categories", () => {
      const expectedCategories = [
        "VVIP",
        "VIP",
        "MEMBER",
        "ABEOKUTA POLO CLUB",
        "PRESS",
        "SPONSORS",
        "VENDORS",
        "PROGRAMME OFFICIALS",
      ];

      expect(STANDARD_INVITATION_CATEGORIES).toEqual(expectedCategories);

      expectedCategories.forEach((cat) => {
        const payload = createInvitationPayload({
          designation: "Representative",
          category: cat,
          isCustomCategory: false,
        });
        expect(payload.category).toBe(cat);
        expect(payload.isCustomCategory).toBe(false);
      });
    });

    it("supports typing and submitting custom categories not in the dropdown", () => {
      const customCategoryName = "ROYAL HERITAGE TRUSTEE";
      const payload = createInvitationPayload({
        designation: "Trustee Member",
        category: customCategoryName,
        isCustomCategory: true,
      });

      expect(payload.category).toBe(customCategoryName);
      expect(payload.isCustomCategory).toBe(true);
    });
  });

  describe("Security QR Code & 'Aare Elesin' Royal Verification Seal (R3)", () => {
    it("embeds 'Aare Elesin' in the cryptographic token and verification link", () => {
      const payload = createInvitationPayload({
        firstName: "Kayode",
        surname: "Alabi",
        designation: "Managing Director",
        category: "VVIP",
        isCustomCategory: false,
      });

      expect(payload.securitySeal).toBe(ROYAL_SECURITY_SEAL);
      expect(payload.qrPayload).toContain("seal=Aare+Elesin");
      expect(payload.qrPayload).toContain(`id=${payload.invitationCode}`);
      expect(payload.qrToken).toBeDefined();
      expect(payload.qrToken?.startsWith("ABK26.")).toBe(true);
    });

    it("verifies the authenticity of the 'Aare Elesin' security seal", async () => {
      const payload = createInvitationPayload({
        designation: "VIP Guest",
        category: "VIP",
        isCustomCategory: false,
      });
      await saveInvitation(payload);

      // Positive check: correct seal
      const validCheck = verifyInvitationSeal(payload.invitationCode, "Aare Elesin");
      expect(validCheck.valid).toBe(true);
      expect(validCheck.securitySeal).toBe("Aare Elesin");

      // Positive check: case-insensitive match
      const caseCheck = verifyInvitationSeal(payload.invitationCode, "aare elesin");
      expect(caseCheck.valid).toBe(true);

      // Negative check: forged or invalid seal
      const forgedCheck = verifyInvitationSeal(payload.invitationCode, "Forged Royal Seal");
      expect(forgedCheck.valid).toBe(false);
      expect(forgedCheck.error).toContain("Expected 'Aare Elesin'");
    });

    it("cryptographically verifies the HMAC-SHA256 signed invitation token", () => {
      const token = generateSignedInvitationToken({
        credentialId: "ABK-2026-INV-DEMO",
        holderName: "Prince Adeleke",
        passType: "complimentary",
        category: "VVIP",
        designation: "Royal Guest",
        securitySeal: "Aare Elesin",
        editionYear: 2026,
        issuedAt: Date.now(),
      });

      const verification = verifyInvitationToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.payload?.securitySeal).toBe("Aare Elesin");
      expect(verification.payload?.credentialId).toBe("ABK-2026-INV-DEMO");
      expect(verification.payload?.holderName).toBe("Prince Adeleke");
    });

    it("rejects tampered or forged invitation tokens", () => {
      const token = generateSignedInvitationToken({
        credentialId: "ABK-2026-INV-DEMO",
        holderName: "Prince Adeleke",
        passType: "complimentary",
        category: "VVIP",
        designation: "Royal Guest",
        securitySeal: "Aare Elesin",
        editionYear: 2026,
        issuedAt: Date.now(),
      });

      // Tamper with signature
      const tampered = token.slice(0, -5) + "ABCDE";
      const check = verifyInvitationToken(tampered);
      expect(check.valid).toBe(false);
      expect(check.error).toContain("Cryptographic signature mismatch");
    });
  });

  describe("Dual-Persistence Storage Engine", () => {
    it("persists and retrieves invitations by code and by ID", async () => {
      const payload = createInvitationPayload({
        firstName: "Chief",
        surname: "Ogunleye",
        designation: "Honorary President",
        category: "MEMBER",
        isCustomCategory: false,
      });

      const saved = await saveInvitation(payload);
      expect(saved.invitationCode).toBe(payload.invitationCode);

      // Fetch by code
      const fetchedByCode = await getInvitationByCode(payload.invitationCode);
      expect(fetchedByCode).not.toBeNull();
      expect(fetchedByCode?.designation).toBe("Honorary President");
      expect(fetchedByCode?.category).toBe("MEMBER");

      // Fetch by UUID ID
      const fetchedById = await getInvitationByCode(payload.id);
      expect(fetchedById).not.toBeNull();
      expect(fetchedById?.invitationCode).toBe(payload.invitationCode);
    });

    it("lists all issued invitations sorted by creation date descending", async () => {
      const inv1 = createInvitationPayload({
        designation: "Press Reporter 1",
        category: "PRESS",
        isCustomCategory: false,
      });
      inv1.createdAt = new Date(Date.now() - 20000).toISOString();
      await saveInvitation(inv1);

      const inv2 = createInvitationPayload({
        designation: "Sponsor Representative",
        category: "SPONSORS",
        isCustomCategory: false,
      });
      inv2.createdAt = new Date(Date.now() - 5000).toISOString();
      await saveInvitation(inv2);

      const list = await listInvitations();
      expect(list.length).toBe(2);
      expect(list[0].invitationCode).toBe(inv2.invitationCode); // newer first
      expect(list[1].invitationCode).toBe(inv1.invitationCode);
    });
  });

  describe("Non-Transferable Mobile Device Binding Guard", () => {
    it("binds an invitation on first access by a mobile device", async () => {
      const payload = createInvitationPayload({
        designation: "Executive Guest",
        category: "VVIP",
        isCustomCategory: false,
      });
      await saveInvitation(payload);

      const initialDevice = "DEV-MOBILE-IPHONE-001";
      const bindResult = await bindInvitationToDevice(payload.invitationCode, initialDevice);

      expect(bindResult.authorized).toBe(true);
      expect(bindResult.status).toBe("newly_bound");
      expect(bindResult.boundDeviceId).toBe(initialDevice);

      // Verify stored record is updated
      const updated = await getInvitationByCode(payload.invitationCode);
      expect(updated?.boundDeviceId).toBe(initialDevice);
      expect(updated?.isLockedToDevice).toBe(true);
      expect(updated?.claimedAt).toBeDefined();
    });

    it("authorizes subsequent opens on the same mobile device", async () => {
      const payload = createInvitationPayload({
        designation: "VIP Guest",
        category: "VIP",
        isCustomCategory: false,
      });
      await saveInvitation(payload);

      const deviceId = "DEV-MOBILE-IPHONE-001";
      await bindInvitationToDevice(payload.invitationCode, deviceId);

      const secondAccess = await bindInvitationToDevice(payload.invitationCode, deviceId);
      expect(secondAccess.authorized).toBe(true);
      expect(secondAccess.status).toBe("already_bound");
    });

    it("blocks unauthorized forwarding when opened on a different second mobile device", async () => {
      const payload = createInvitationPayload({
        designation: "VIP Guest",
        category: "VIP",
        isCustomCategory: false,
      });
      await saveInvitation(payload);

      const recipientDevice = "DEV-RECIPIENT-PHONE";
      await bindInvitationToDevice(payload.invitationCode, recipientDevice);

      // Unauthorized forwarding attempt on another phone
      const forwarderDevice = "DEV-FORWARDED-PHONE-UNKNOWN";
      const forwardedAccess = await bindInvitationToDevice(payload.invitationCode, forwarderDevice);

      expect(forwardedAccess.authorized).toBe(false);
      expect(forwardedAccess.status).toBe("forwarding_blocked");
      expect(forwardedAccess.message).toContain("non-transferable");
    });

    it("allows Secretariat admin override to reset device binding if dignitary changed phones", async () => {
      const payload = createInvitationPayload({
        designation: "VIP Guest",
        category: "VIP",
        isCustomCategory: false,
      });
      await saveInvitation(payload);

      await bindInvitationToDevice(payload.invitationCode, "DEV-OLD-PHONE");

      // Secretariat resets binding
      const reset = await resetInvitationDeviceBinding(payload.invitationCode);
      expect(reset.ok).toBe(true);

      const refreshed = await getInvitationByCode(payload.invitationCode);
      expect(refreshed?.boundDeviceId).toBeNull();
      expect(refreshed?.isLockedToDevice).toBe(false);

      // New phone can now bind
      const newBind = await bindInvitationToDevice(payload.invitationCode, "DEV-NEW-PHONE");
      expect(newBind.authorized).toBe(true);
      expect(newBind.status).toBe("newly_bound");
    });
  });

  describe("WhatsApp Invitation Text Generation", () => {
    it("generates formatted WhatsApp text with designation, category, code, and Aare Elesin seal", () => {
      const payload = createInvitationPayload({
        firstName: "Alhaji",
        surname: "Danjuma",
        designation: "Distinguished Patron",
        category: "VVIP",
        isCustomCategory: false,
      });

      const text = generateWhatsAppInvitationText(payload);

      expect(text).toContain("ABEOKUTA POLO FESTIVAL 2026");
      expect(text).toContain("Alhaji Danjuma");
      expect(text).toContain("Distinguished Patron");
      expect(text).toContain("VVIP");
      expect(text).toContain(payload.invitationCode);
      expect(text).toContain("Aare Elesin");
      expect(text).toContain(`/invitation/${payload.invitationCode}`);
      expect(text).toContain("non-transferable");
    });

    it("generates generic salutation when names are not provided", () => {
      const payload = createInvitationPayload({
        designation: "Special Representative",
        category: "SPONSORS",
        isCustomCategory: false,
      });

      const text = generateWhatsAppInvitationText(payload);
      expect(text).toContain("Dear Distinguished Dignitary");
      expect(text).toContain("Special Representative");
    });
  });
});
