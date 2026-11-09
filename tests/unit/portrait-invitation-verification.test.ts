import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createInvitationPayload,
  verifyInvitationToken,
} from "@/lib/invitations/issuance";
import {
  saveInvitation,
  getInvitationByCode,
  bindInvitationToDevice,
  clearInvitationsMemoryStore,
} from "@/lib/invitations/storage";
import { processGateScan } from "@/app/(ops)/scan/actions";
import { GET as verifyGetRoute, POST as verifyPostRoute } from "@/app/api/credentials/verify/route";

describe("Milestone 3 & 4: Portrait Invitation Card, Non-Transferable Device Guard & 'Aare Elesin' QR Verification", () => {
  beforeEach(() => {
    clearInvitationsMemoryStore();
  });

  describe("R2. Portrait Invitation Card Dimensions & Visual Specifications", () => {
    it("confirms portrait invitation dimensions exceed existing gate pass by >2x surface area", () => {
      // Existing gate pass dimensions (from components/shared/id-access-card.tsx)
      const gatePassMaxWidth = 305;
      const gatePassMinHeight = 500;
      const gatePassSurfaceArea = gatePassMaxWidth * gatePassMinHeight; // 152,500 px²

      // Portrait invitation card dimensions (from components/shared/portrait-invitation-card.tsx)
      const portraitCardMaxWidth = 480;
      const portraitCardMinHeight = 720;
      const portraitCardSurfaceArea = portraitCardMaxWidth * portraitCardMinHeight; // 345,600 px²

      const areaRatio = portraitCardSurfaceArea / gatePassSurfaceArea;
      expect(portraitCardMaxWidth).toBeGreaterThan(gatePassMaxWidth);
      expect(portraitCardMinHeight).toBeGreaterThan(gatePassMinHeight);
      expect(areaRatio).toBeGreaterThan(2.0); // Strictly >2x surface area
      expect(areaRatio).toBeCloseTo(2.266, 2);
    });

    it("creates an invitation with royal obsidian & Aare Elesin seal embedded in QR payload", () => {
      const invitation = createInvitationPayload({
        firstName: "Alani",
        surname: "Gbadebo",
        designation: "High Commissioner",
        category: "VVIP",
        isCustomCategory: false,
      });

      expect(invitation.securitySeal).toBe("Aare Elesin");
      expect(invitation.qrPayload).toContain("seal=Aare+Elesin");
      expect(invitation.qrPayload).toContain(`id=${invitation.invitationCode}`);
      expect(invitation.qrToken).toBeDefined();

      const decoded = verifyInvitationToken(invitation.qrToken!);
      expect(decoded.valid).toBe(true);
      expect(decoded.payload?.securitySeal).toBe("Aare Elesin");
      expect(decoded.payload?.holderName).toBe("Alani Gbadebo");
    });
  });

  describe("Non-Transferable Device Binding Guard", () => {
    it("successfully binds invitation to initial recipient device on first open", async () => {
      const inv = createInvitationPayload({
        firstName: "Adetokunbo",
        surname: "Adeyemi",
        designation: "Executive Director",
        category: "VIP",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const deviceA = "DEV-MOBILE-PHONE-AAA-111";
      const bindResult = await bindInvitationToDevice(inv.invitationCode, deviceA);

      expect(bindResult.authorized).toBe(true);
      expect(bindResult.status).toBe("newly_bound");
      expect(bindResult.boundDeviceId).toBe(deviceA);

      const updated = await getInvitationByCode(inv.invitationCode);
      expect(updated?.boundDeviceId).toBe(deviceA);
      expect(updated?.isLockedToDevice).toBe(true);
    });

    it("authorizes subsequent opens on the same registered device", async () => {
      const inv = createInvitationPayload({
        designation: "Permanent Secretary",
        category: "MEMBER",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const deviceA = "DEV-MOBILE-PHONE-AAA-111";
      await bindInvitationToDevice(inv.invitationCode, deviceA);

      const secondOpen = await bindInvitationToDevice(inv.invitationCode, deviceA);
      expect(secondOpen.authorized).toBe(true);
      expect(secondOpen.status).toBe("already_bound");
    });

    it("strictly BLOCKS forwarding attempt to a secondary mobile phone", async () => {
      const inv = createInvitationPayload({
        firstName: "Folashade",
        surname: "Tinubu",
        designation: "Special Patron",
        category: "VVIP",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const originalDevice = "DEV-ORIGINAL-PHONE-123";
      const forwardedDevice = "DEV-FORWARDED-PHONE-456";

      // Original owner claims pass on device 1
      await bindInvitationToDevice(inv.invitationCode, originalDevice);

      // Third-party receives link and attempts to open on device 2
      const blockResult = await bindInvitationToDevice(inv.invitationCode, forwardedDevice);

      expect(blockResult.authorized).toBe(false);
      expect(blockResult.status).toBe("forwarding_blocked");
      expect(blockResult.boundDeviceId).toBe(originalDevice);
      expect(blockResult.message).toContain("non-transferable");
    });
  });

  describe("R3. 'Aare Elesin' Credential Verification API (/api/credentials/verify)", () => {
    it("validates cryptographic invitation token embedding 'Aare Elesin' via GET", async () => {
      const inv = createInvitationPayload({
        firstName: "Babatunde",
        surname: "Fashola",
        designation: "Former Governor & Honorary Patron",
        category: "VVIP",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const req = new NextRequest(
        `http://localhost:3000/api/credentials/verify?token=${encodeURIComponent(inv.qrToken!)}`
      );
      const res = await verifyGetRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.status).toBe("active");
      expect(data.passType).toBe("complimentary");
      expect(data.securitySeal).toBe("Aare Elesin");
      expect(data.category).toBe("VVIP");
      expect(data.guestName).toBe("Babatunde Fashola");
      expect(data.signatureVerified).toBe(true);
    });

    it("validates invitation code and explicit 'Aare Elesin' seal via GET", async () => {
      const inv = createInvitationPayload({
        designation: "Consular General",
        category: "SPONSORS",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const req = new NextRequest(
        `http://localhost:3000/api/credentials/verify?id=${inv.invitationCode}&seal=Aare+Elesin`
      );
      const res = await verifyGetRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.securitySeal).toBe("Aare Elesin");
      expect(data.category).toBe("SPONSORS");
    });

    it("normalizes and decodes full verification URL in POST body", async () => {
      const inv = createInvitationPayload({
        firstName: "Dapo",
        surname: "Abiodun",
        designation: "Executive Patron",
        category: "VVIP",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const fullUrl = `https://abeokuta-polo.com/invitation/verify?id=${inv.invitationCode}&seal=Aare+Elesin&sig=${inv.qrToken}`;
      const req = new NextRequest("http://localhost:3000/api/credentials/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: fullUrl }),
      });

      const res = await verifyPostRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.securitySeal).toBe("Aare Elesin");
      expect(data.invitationCode).toBe(inv.invitationCode);
    });

    it("rejects invalid or tampered security seal via verification API", async () => {
      const inv = createInvitationPayload({
        designation: "Diplomatic Attache",
        category: "VIP",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const req = new NextRequest(
        `http://localhost:3000/api/credentials/verify?id=${inv.invitationCode}&seal=FakeSeal`
      );
      const res = await verifyGetRoute(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.valid).toBe(false);
      expect(data.status).toBe("invalid_seal");
    });

    it("rejects revoked complimentary invitation", async () => {
      const inv = createInvitationPayload({
        firstName: "Revoked",
        surname: "Guest",
        designation: "Former Delegate",
        category: "PRESS",
        isCustomCategory: false,
      });
      inv.status = "revoked";
      await saveInvitation(inv);

      const req = new NextRequest(
        `http://localhost:3000/api/credentials/verify?id=${inv.invitationCode}&seal=Aare+Elesin`
      );
      const res = await verifyGetRoute(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.valid).toBe(false);
      expect(data.status).toBe("revoked");
    });
  });

  describe("Turnstile Scanner Gate Admission (app/(ops)/scan/actions.ts)", () => {
    it("admits complimentary invitation at Gate 1 on Day 1, Day 2, and Day 3", async () => {
      const inv = createInvitationPayload({
        firstName: "Kayode",
        surname: "Fayemi",
        designation: "Distinguished Statesman",
        category: "VVIP",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      // Day 1 Admission
      const scanDay1 = await processGateScan({
        passIdentifier: inv.invitationCode,
        gate: "Gate 1 - Royal Box & VVIP Enclosure",
        eventDay: 1,
      });
      expect(scanDay1.result).toBe("admitted");
      expect(scanDay1.status).toBe("valid");
      expect(scanDay1.day1CheckedIn).toBe(true);
      expect(scanDay1.passType).toContain("Complimentary (VVIP)");
      expect(scanDay1.message).toContain("Day 1");

      // Day 1 Duplicate Scan (Blocked)
      const scanDay1Duplicate = await processGateScan({
        passIdentifier: inv.invitationCode,
        gate: "Gate 1 - Royal Box & VVIP Enclosure",
        eventDay: 1,
      });
      expect(scanDay1Duplicate.result).toBe("already_admitted");
      expect(scanDay1Duplicate.status).toBe("duplicate");

      // Day 2 Admission
      const scanDay2 = await processGateScan({
        passIdentifier: inv.invitationCode,
        gate: "Gate 1 - Royal Box & VVIP Enclosure",
        eventDay: 2,
      });
      expect(scanDay2.result).toBe("admitted");
      expect(scanDay2.day2CheckedIn).toBe(true);

      // Day 3 Admission (Royal Finals Day)
      const scanDay3 = await processGateScan({
        passIdentifier: inv.invitationCode,
        gate: "Gate 1 - Royal Box & VVIP Enclosure",
        eventDay: 3,
      });
      expect(scanDay3.result).toBe("admitted");
      expect(scanDay3.day3CheckedIn).toBe(true);
      expect(scanDay3.message).toContain("Aare Elesin Seal");
    });

    it("admits complimentary invitation when turnstile scans full verification URL", async () => {
      const inv = createInvitationPayload({
        firstName: "Simi",
        surname: "Osigwe",
        designation: "Polo Club Patron",
        category: "ABEOKUTA POLO CLUB",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const scannedUrl = `https://festival.abeokutapolo.com/invitation/verify?id=${inv.invitationCode}&seal=Aare+Elesin`;
      const result = await processGateScan({
        passIdentifier: scannedUrl,
        gate: "Gate 2 - General Turnstiles",
        eventDay: 1,
      });

      expect(result.result).toBe("admitted");
      expect(result.status).toBe("valid");
      expect(result.holderName).toBe("Simi Osigwe");
    });

    it("admits complimentary invitation when turnstile scans signed HMAC token directly", async () => {
      const inv = createInvitationPayload({
        firstName: "Tunde",
        surname: "Bakare",
        designation: "Honorary Guest",
        category: "VIP",
        isCustomCategory: false,
      });
      await saveInvitation(inv);

      const result = await processGateScan({
        passIdentifier: inv.qrToken!,
        gate: "Gate 1 - Royal Box & VVIP Enclosure",
        eventDay: 3,
      });

      expect(result.result).toBe("admitted");
      expect(result.status).toBe("valid");
      expect(result.holderName).toBe("Tunde Bakare");
      expect(result.passType).toContain("VIP");
    });

    it("rejects revoked complimentary invitation at turnstile gates", async () => {
      const inv = createInvitationPayload({
        firstName: "Sanctioned",
        surname: "Visitor",
        designation: "Banned Individual",
        category: "VENDORS",
        isCustomCategory: false,
      });
      inv.status = "revoked";
      await saveInvitation(inv);

      const result = await processGateScan({
        passIdentifier: inv.invitationCode,
        gate: "Gate 2 - General Turnstiles",
        eventDay: 1,
      });

      expect(result.result).toBe("rejected");
      expect(result.status).toBe("revoked");
      expect(result.message).toContain("revoked");
    });
  });
});
