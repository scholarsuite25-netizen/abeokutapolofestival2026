import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { GALLERY_DATA } from "@/components/design/public/gallery-showcase";
import {
  bindPassToMobileDevice,
  checkPassDeviceAccess,
  verifyPassDeviceBinding,
  resetPassDeviceBinding,
  getPassBindingRecord,
  isTablePassCode,
} from "@/lib/security/device-binding";
import {
  isMobileBrowser,
  isMobileUserAgent,
  generateMobileDeviceId,
  MobileBindingStation,
  PassDeviceGuard,
} from "@/components/shared/pass-device-guard";
import { submitRegistration } from "@/app/(public)/register/actions";
import { formatWhatsAppUrl } from "@/lib/utils/phone";

// Helper to compute Shannon entropy of a binary buffer to detect dummy files
function calculateEntropy(buffer: Buffer): number {
  const frequencies = new Map<number, number>();
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
  }
  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / buffer.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

describe("CHALLENGER 2 ADVERSARIAL STRESS TEST SUITE: R2 & R3", () => {
  beforeEach(() => {
    vi.stubEnv("EMAIL_FROM", "tickets@guests.abeokutapolofestival2026.org.ng");
    vi.stubEnv("VVIP_INVITATION_CODES", "ROYAL-VIP, SPECIAL-GUEST, VIP2026");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // =========================================================================
  // MISSION 1: R2 Media Gallery Assets & Layout Deep Stress-Testing
  // =========================================================================
  describe("R2 Adversarial Validation: Media Gallery Assets & Layout", () => {
    const EXPECTED_GALLERY_FILES = [
      "alake-groundbreaking.jpg",
      "alake-pioneer-inductions.jpg",
      "chieftaincy-conferment.jpg",
      "kobape-inaugural-chukka.jpg",
      "kobape-turf-inspection.jpg",
      "ogun-executive-endorsement.jpg",
      "ogun-tourism-alliance.jpg",
      "patrons-gala-twilight.jpg",
      "queens-polo-invitational.jpg",
      "royal-procession-100-kings.jpg",
      "vip-chukka-terrace-fashion.jpg",
      "wole-soyinka-amphitheater.jpg",
    ];

    it("R2.1: Exactly 12 gallery image files exist on disk in public/images/gallery/", () => {
      const galleryDir = path.join(process.cwd(), "public", "images", "gallery");
      expect(fs.existsSync(galleryDir)).toBe(true);

      const filesOnDisk = fs.readdirSync(galleryDir).filter((f) => f.endsWith(".jpg"));
      expect(filesOnDisk.sort()).toEqual(EXPECTED_GALLERY_FILES.sort());
      expect(filesOnDisk.length).toBe(12);
    });

    it("R2.2: Every file is a valid JPEG binary (SOI 0xFF 0xD8 0xFF), size > 10,000 bytes, high entropy", () => {
      const galleryDir = path.join(process.cwd(), "public", "images", "gallery");

      for (const fileName of EXPECTED_GALLERY_FILES) {
        const filePath = path.join(galleryDir, fileName);
        const stats = fs.statSync(filePath);
        const buffer = fs.readFileSync(filePath);

        // Size check > 10,000 bytes
        expect(
          stats.size,
          `File ${fileName} size (${stats.size}) is not > 10,000 bytes`
        ).toBeGreaterThan(10000);

        // Binary check: JPEG Start of Image (SOI) marker: FF D8 FF
        expect(buffer[0], `${fileName} byte 0 must be 0xFF`).toBe(0xff);
        expect(buffer[1], `${fileName} byte 1 must be 0xD8`).toBe(0xd8);
        expect(buffer[2], `${fileName} byte 2 must be 0xFF`).toBe(0xff);

        // Dummy file check: High entropy (> 7.0 for real compressed JPEG images)
        const entropy = calculateEntropy(buffer);
        expect(
          entropy,
          `File ${fileName} entropy (${entropy.toFixed(2)}) is too low for authentic photographic JPEG`
        ).toBeGreaterThan(7.0);

        // End of Image marker check (EOI: 0xFF 0xD9) in the last 100 bytes
        const lastBytes = buffer.subarray(buffer.length - 100);
        let hasEOI = false;
        for (let i = 0; i < lastBytes.length - 1; i++) {
          if (lastBytes[i] === 0xff && lastBytes[i + 1] === 0xd9) {
            hasEOI = true;
            break;
          }
        }
        expect(hasEOI, `File ${fileName} must contain valid JPEG End of Image (EOI 0xFF 0xD9)`).toBe(true);
      }
    });

    it("R2.3: Zero Unsplash URLs exist in gallery-showcase.tsx", () => {
      const showcasePath = path.join(
        process.cwd(),
        "components",
        "design",
        "public",
        "gallery-showcase.tsx"
      );
      const content = fs.readFileSync(showcasePath, "utf-8");

      expect(content.toLowerCase()).not.toContain("images.unsplash.com");
      expect(content.toLowerCase()).not.toContain("source.unsplash.com");
      expect(content.toLowerCase()).not.toContain("unsplash");

      // Also verify via GALLERY_DATA
      for (const item of GALLERY_DATA) {
        expect(item.imageUrl.toLowerCase()).not.toContain("unsplash");
      }
    });

    it("R2.4: 100% uniqueness — no duplicate URLs, IDs, or titles across cards", () => {
      const urls = GALLERY_DATA.map((item) => item.imageUrl);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);
      expect(urls.length).toBe(12);

      const ids = GALLERY_DATA.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);

      const titles = GALLERY_DATA.map((item) => item.title);
      expect(new Set(titles).size).toBe(titles.length);
    });

    it("R2.5: Layout containment verification — object-cover and aspect-[16/10] in gallery-showcase.tsx", () => {
      const showcasePath = path.join(
        process.cwd(),
        "components",
        "design",
        "public",
        "gallery-showcase.tsx"
      );
      const content = fs.readFileSync(showcasePath, "utf-8");

      expect(content).toContain("aspect-[16/10]");
      expect(content).toContain("object-cover");
      expect(content).toContain("group-hover:scale-105");
      expect(content).toContain("unoptimized");
    });

    it("R2.6: All 4 required club and historical events are explicitly represented in gallery", () => {
      // 1. Alake Groundbreaking
      const groundbreaking = GALLERY_DATA.find(
        (i) =>
          i.id === "royal-groundbreaking-2025" ||
          (i.title.toLowerCase().includes("groundbreaking") &&
            i.dignitaries.toLowerCase().includes("alake"))
      );
      expect(groundbreaking, "Missing Alake Groundbreaking event").toBeDefined();
      expect(groundbreaking?.imageUrl).toBe("/images/gallery/alake-groundbreaking.jpg");

      // 2. Chieftaincy Conferment
      const chieftaincy = GALLERY_DATA.find(
        (i) =>
          i.id === "president-aare-eleshin-conferment" ||
          i.title.toLowerCase().includes("chieftaincy") ||
          i.title.toLowerCase().includes("aare elesin")
      );
      expect(chieftaincy, "Missing Chieftaincy Conferment event").toBeDefined();
      expect(chieftaincy?.imageUrl).toBe("/images/gallery/chieftaincy-conferment.jpg");

      // 3. Kobape Turf matches
      const turfChukka = GALLERY_DATA.find(
        (i) =>
          i.id === "maiden-festival-chukka-2025" ||
          (i.category === "Official Opening & Chukkas" &&
            i.title.toLowerCase().includes("chukka") &&
            i.title.toLowerCase().includes("kobape"))
      );
      expect(turfChukka, "Missing Kobape Turf matches event").toBeDefined();
      expect(turfChukka?.imageUrl).toBe("/images/gallery/kobape-inaugural-chukka.jpg");

      // 4. Patrons Gala
      const gala = GALLERY_DATA.find(
        (i) =>
          i.id === "aristos-berryola-musical-gala" ||
          i.title.toLowerCase().includes("patrons gala") ||
          i.title.toLowerCase().includes("aristos")
      );
      expect(gala, "Missing Patrons Gala event").toBeDefined();
      expect(gala?.imageUrl).toBe("/images/gallery/patrons-gala-twilight.jpg");
    });
  });

  // =========================================================================
  // MISSION 2: R3 Laptop-to-Mobile Pass Device Binding Security Adversarial Suite
  // =========================================================================
  describe("R3 Adversarial Security Suite: Laptop Registration -> Mobile Binding", () => {
    const testDesktopUA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    const testIPhoneUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    const testAndroidUA =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36";

    it("R3.1: Desktop browser registration issues an UNBOUND pass (bound_device_id = null)", async () => {
      const regResult = await submitRegistration({
        firstName: "Adesola",
        lastName: "Ogundipe",
        email: "adesola.ogundipe@example.com",
        phone: "+234 803 300 1122",
        day1: true,
        day2: false,
        day3: false,
      });

      expect(regResult.success).toBe(true);
      expect(regResult.passes).toBeDefined();
      expect(regResult.passes!.length).toBeGreaterThan(0);

      const passCode = regResult.passes![0].passCode;

      // Verify that upon desktop registration, no device is bound
      const bindingRecord = await getPassBindingRecord(passCode);
      expect(bindingRecord).toBeNull();

      // Check device access evaluation on desktop: Unbound passes are accessible for preview on desktop
      const desktopCheck = await checkPassDeviceAccess(passCode, null, false);
      expect(desktopCheck.isBound).toBe(false);
      expect(desktopCheck.boundDeviceId).toBeNull();
      expect(desktopCheck.isAuthorized).toBe(true);
      expect(desktopCheck.deviceType).toBe("desktop");
    });

    it("R3.2: Desktop Mobile Binding Station generates correct QR code, WhatsApp wa.me link, and email trigger", () => {
      const passCode = "ABK-2026-DESKTEST";
      const phone = "+234 818 188 8884";
      const targetUrl = `https://abeokutapolofestival2026.org.ng/pass/${passCode}?bind=mobile`;

      // 1. WhatsApp wa.me formatted link validation
      const waMessage = `Abeokuta Polo Festival 2026: Claim Pass ${passCode} at ${targetUrl}`;
      const waUrl = formatWhatsAppUrl(phone, waMessage);

      expect(waUrl).toContain("https://wa.me/2348181888884?text=");
      expect(waUrl).toContain(encodeURIComponent(passCode));
      expect(decodeURIComponent(waUrl)).toContain("bind=mobile");
      expect(waUrl).toContain("bind%3Dmobile");

      // 2. Component source code verification
      const guardPath = path.join(
        process.cwd(),
        "components",
        "shared",
        "pass-device-guard.tsx"
      );
      const guardSource = fs.readFileSync(guardPath, "utf-8");

      expect(guardSource).toContain("📱 Scan to bind to your mobile phone");
      expect(guardSource).toContain("Open in WhatsApp (wa.me)");
      expect(guardSource).toContain("sendPassMobileBindingEmail");
      expect(guardSource).toContain("QRCodeLib.toDataURL");
      expect(guardSource).toContain("Turnstile barcode admission requires scanning the QR code");
    });

    it("R3.3: Mobile user agent detection correctly classifies smartphone browsers and rejects desktop browsers", () => {
      // Mobile UAs
      expect(isMobileUserAgent(testIPhoneUA)).toBe(true);
      expect(isMobileUserAgent(testAndroidUA)).toBe(true);
      expect(isMobileUserAgent("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)")).toBe(true);

      // Desktop UAs
      expect(isMobileUserAgent(testDesktopUA)).toBe(false);
      expect(isMobileUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(false);
      expect(isMobileUserAgent("")).toBe(false);
      expect(isMobileUserAgent(undefined)).toBe(false);
    });

    it("R3.4: Smartphone claiming pass successfully binds with MOBILE-... device identifier", async () => {
      const passCode = `ABK-TEST-CLAIM-${crypto.randomUUID().slice(0, 8)}`;
      const mobileDeviceId = `MOBILE-${crypto.randomUUID()}`;

      // Ensure fresh state
      await resetPassDeviceBinding(passCode);

      // Bind pass to mobile device
      const bindResult = await bindPassToMobileDevice(passCode, mobileDeviceId, "Alhaji Bello");
      expect(bindResult.success).toBe(true);
      expect(bindResult.status).toBe("newly_bound");
      expect(bindResult.boundDeviceId).toBe(mobileDeviceId);

      // Confirm binding is stored
      const record = await getPassBindingRecord(passCode);
      expect(record).not.toBeNull();
      expect(record?.deviceId).toBe(mobileDeviceId);
      expect(record?.deviceId).toMatch(/^MOBILE-[0-9a-f-]{36}$/i);

      // Re-accessing from SAME mobile device succeeds
      const sameDeviceCheck = await verifyPassDeviceBinding(passCode, mobileDeviceId);
      expect(sameDeviceCheck.isAuthorized).toBe(true);
      expect(sameDeviceCheck.status).toBe("already_bound_to_this_device");
      expect(sameDeviceCheck.boundDeviceId).toBe(mobileDeviceId);

      // checkPassDeviceAccess for same mobile device
      const accessStatus = await checkPassDeviceAccess(passCode, mobileDeviceId, true);
      expect(accessStatus.isBound).toBe(true);
      expect(accessStatus.isAuthorized).toBe(true);
      expect(accessStatus.boundDeviceId).toBe(mobileDeviceId);
      expect(accessStatus.deviceType).toBe("mobile");
    });

    it("R3.5: Forwarding attack simulation — Pass forwarded to secondary device is rejected with access-locked message", async () => {
      const passCode = `ABK-ATTACK-FWD-${crypto.randomUUID().slice(0, 8)}`;
      const legitimateMobileId = `MOBILE-${crypto.randomUUID()}`;
      const attackerMobileId = `MOBILE-${crypto.randomUUID()}`;

      // Legitimate user binds pass
      await resetPassDeviceBinding(passCode);
      await bindPassToMobileDevice(passCode, legitimateMobileId, "Chief Egba");

      // Attacker receives forwarded link and opens on their mobile device
      const attackAttempt = await verifyPassDeviceBinding(passCode, attackerMobileId);
      expect(attackAttempt.isAuthorized).toBe(false);
      expect(attackAttempt.status).toBe("forwarding_blocked");
      expect(attackAttempt.message).toContain("Pass is non-transferable and locked to another device");
      expect(attackAttempt.boundDeviceId).toBe(legitimateMobileId);

      // Attempting to call bindPassToMobileDevice from attacker device also fails
      const rebindAttempt = await bindPassToMobileDevice(passCode, attackerMobileId);
      expect(rebindAttempt.success).toBe(false);
      expect(rebindAttempt.status).toBe("forwarding_blocked");
      expect(rebindAttempt.error).toContain("Pass is non-transferable and locked to another device");

      // Device access check on attacker device
      const attackerAccess = await checkPassDeviceAccess(passCode, attackerMobileId, true);
      expect(attackerAccess.isBound).toBe(true);
      expect(attackerAccess.isAuthorized).toBe(false);
      expect(attackerAccess.rejectionReason).toBe("FORWARDING_LOCKED");
    });

    it("R3.6: Forwarding attack simulation — Mobile-bound pass opened on desktop is blocked", async () => {
      const passCode = `ABK-DESK-BLOCK-${crypto.randomUUID().slice(0, 8)}`;
      const legitimateMobileId = `MOBILE-${crypto.randomUUID()}`;

      await resetPassDeviceBinding(passCode);
      await bindPassToMobileDevice(passCode, legitimateMobileId, "Otunba Oladipo");

      // Desktop browser accesses the mobile-bound pass (isMobile = false, deviceId = null or empty)
      const desktopCheck = await checkPassDeviceAccess(passCode, null, false);
      expect(desktopCheck.isBound).toBe(true);
      expect(desktopCheck.isAuthorized).toBe(false);
      expect(desktopCheck.deviceType).toBe("desktop");
      expect(desktopCheck.rejectionReason).toBe("DESKTOP_ACCESS_RESTRICTED");

      // Verify PassDeviceGuard source code contains explicit rejection UI for desktop
      const guardPath = path.join(
        process.cwd(),
        "components",
        "shared",
        "pass-device-guard.tsx"
      );
      const guardSource = fs.readFileSync(guardPath, "utf-8");

      expect(guardSource).toContain('authStatus === "desktop_locked"');
      expect(guardSource).toContain("Pass Bound to Mobile Device");
      expect(guardSource).toContain("Pass is non-transferable and locked to another device");
      expect(guardSource).toContain("Access from desktop browsers is restricted under anti-scalping protocol");
    });

    it("R3.7: Bypass stress test — Empty, whitespace, malformed, or injected device IDs are rejected", async () => {
      const passCode = `ABK-INJECT-TEST-${crypto.randomUUID().slice(0, 8)}`;
      const legitimateMobileId = `MOBILE-${crypto.randomUUID()}`;

      await resetPassDeviceBinding(passCode);
      await bindPassToMobileDevice(passCode, legitimateMobileId, "Mrs. Kemi Johnson");

      const maliciousDeviceIds = [
        "",
        "   ",
        "\t\n",
        "DESKTOP-FAKE-ID",
        "MOBILE-' OR '1'='1",
        "MOBILE-<script>alert(1)</script>",
        "../../etc/passwd",
        null as any,
        undefined as any,
        "null",
        "undefined",
        "0",
        legitimateMobileId.toLowerCase(), // case mismatch test
      ];

      for (const badId of maliciousDeviceIds) {
        if (badId === legitimateMobileId) continue;
        const res = await verifyPassDeviceBinding(passCode, badId || "");
        expect(
          res.isAuthorized,
          `Bypass exploit succeeded with ID: ${badId}`
        ).toBe(false);
      }
    });

    it("R3.8: Binding attempt with empty or invalid device ID fails safely", async () => {
      const passCode = `ABK-EMPTY-BIND-${crypto.randomUUID().slice(0, 8)}`;
      await resetPassDeviceBinding(passCode);

      const emptyRes = await bindPassToMobileDevice(passCode, "   ");
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.status).toBe("invalid_device");
      expect(emptyRes.error).toBe("Device identifier cannot be empty");

      // Pass remains unbound
      const record = await getPassBindingRecord(passCode);
      expect(record).toBeNull();
    });

    it("R3.9: Table Host passes (-S01-) retain master access while Table Guest passes (-S02-) enforce strict mobile binding", async () => {
      const hostPass = "ABK-2026-KT-S01-A1B2C3";
      const guestPass = "ABK-2026-KT-S02-D4E5F6";

      // 1. Table code check
      expect(await isTablePassCode(hostPass)).toBe(true);
      expect(await isTablePassCode(guestPass)).toBe(true);

      // 2. Table Host pass is unrestricted
      const hostCheck = await checkPassDeviceAccess(hostPass, null, false);
      expect(hostCheck.isAuthorized).toBe(true);
      expect(hostCheck.isBound).toBe(false);

      // 3. Table Guest pass enforces binding
      await resetPassDeviceBinding(guestPass);
      const guestMobileId = `MOBILE-${crypto.randomUUID()}`;
      await bindPassToMobileDevice(guestPass, guestMobileId, "Table Guest 2");

      // Guest pass on another device is blocked
      const attackCheck = await verifyPassDeviceBinding(guestPass, `MOBILE-${crypto.randomUUID()}`);
      expect(attackCheck.isAuthorized).toBe(false);
      expect(attackCheck.status).toBe("forwarding_blocked");
      expect(attackCheck.message).toContain("Pass is non-transferable and locked to another device");
    });

    it("R3.10: Multiple claim stress test — First legitimate claim succeeds, all subsequent attempts are permanently rejected", async () => {
      const passCode = `ABK-MULTI-CLAIM-${crypto.randomUUID().slice(0, 8)}`;
      await resetPassDeviceBinding(passCode);

      const device1 = `MOBILE-DEVICE-ALPHA-${crypto.randomUUID()}`;
      const device2 = `MOBILE-DEVICE-BETA-${crypto.randomUUID()}`;
      const device3 = `MOBILE-DEVICE-GAMMA-${crypto.randomUUID()}`;

      // Claim 1: Device 1 claims pass
      const claim1 = await bindPassToMobileDevice(passCode, device1, "Legitimate Guest");
      expect(claim1.success).toBe(true);
      expect(claim1.status).toBe("newly_bound");
      expect(claim1.boundDeviceId).toBe(device1);

      // Claim 2: Device 2 attempts to claim same pass -> Blocked!
      const claim2 = await bindPassToMobileDevice(passCode, device2, "Forwarded Recipient B");
      expect(claim2.success).toBe(false);
      expect(claim2.status).toBe("forwarding_blocked");
      expect(claim2.error).toContain("Pass is non-transferable and locked to another device");

      // Claim 3: Device 3 attempts to claim same pass -> Blocked!
      const claim3 = await bindPassToMobileDevice(passCode, device3, "Forwarded Recipient C");
      expect(claim3.success).toBe(false);
      expect(claim3.status).toBe("forwarding_blocked");
      expect(claim3.error).toContain("Pass is non-transferable and locked to another device");

      // Device 1 remains the sole authorized device
      const finalRecord = await getPassBindingRecord(passCode);
      expect(finalRecord?.deviceId).toBe(device1);
    });
  });
});
