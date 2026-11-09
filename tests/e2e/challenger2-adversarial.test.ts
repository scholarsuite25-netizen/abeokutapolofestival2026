import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
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

describe("CHALLENGER 2 ADVERSARIAL STRESS TEST SUITE: R2 & R3", () => {
  beforeEach(() => {
    vi.stubEnv("EMAIL_FROM", "tickets@guests.abeokutapolofestival2026.org.ng");
    vi.stubEnv("VVIP_INVITATION_CODES", "ROYAL-VIP, SPECIAL-GUEST, VIP2026");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // =========================================================================
  // MISSION 1: R2 Media Gallery Unoriginal Asset Removal
  // =========================================================================
  describe("R2 Adversarial Validation: Media Gallery Unoriginal Asset Removal", () => {
    it("R2.1: Zero unoriginal/AI-generated images exist on disk in public/images/gallery/", () => {
      const galleryDir = path.join(process.cwd(), "public", "images", "gallery");
      if (fs.existsSync(galleryDir)) {
        const filesOnDisk = fs.readdirSync(galleryDir).filter((f) => f.endsWith(".jpg") || f.endsWith(".png"));
        expect(filesOnDisk.length).toBe(0);
      }
    });

    it("R2.2: Zero Unsplash or unverified external image URLs exist in gallery-showcase.tsx", () => {
      const filePath = path.join(process.cwd(), "components", "design", "public", "gallery-showcase.tsx");
      const content = fs.readFileSync(filePath, "utf8");
      expect(content).not.toContain("unsplash.com");
      expect(content).not.toContain("googleusercontent.com");
    });

    it("R2.3: app/(public)/gallery/page.tsx displays the curatorial holding notice without unverified stock imagery", () => {
      const galleryPage = fs.readFileSync(
        path.join(process.cwd(), "app/(public)/gallery/page.tsx"),
        "utf8"
      );
      expect(galleryPage).toContain("Official Photographic Archives in Curation");
      expect(galleryPage).not.toContain("abeokuta-polo-trailer.mp4");
    });
  });

  // =========================================================================
  // MISSION 2: R3 Laptop Registration -> Mobile Binding Adversarial Matrix
  // =========================================================================
  describe("R3 Adversarial Security Suite: Laptop Registration -> Mobile Binding", () => {
    it("R3.1: Desktop browser registration issues an UNBOUND pass (bound_device_id = null)", async () => {
      const reg = await submitRegistration({
        firstName: "Adewale",
        lastName: "Tinubu",
        email: "adewale.tinubu@example.org",
        phone: "+234 802 333 4444",
        day1: true,
        day2: true,
        day3: false,
      });

      expect(reg.success).toBe(true);
      expect(reg.passes).toBeDefined();
      expect(reg.passes!.length).toBeGreaterThan(0);

      const pass = reg.passes![0];
      const record = await getPassBindingRecord(pass.passCode);
      expect(record, "Pass issued on desktop must not be pre-bound").toBeNull();

      const accessCheck = await checkPassDeviceAccess(pass.passCode, "DESKTOP-CHROME-WIN11-SESSION", false);
      expect(accessCheck.isAuthorized).toBe(true);
      expect(accessCheck.isBound).toBe(false);
    });

    it("R3.2: Mobile phone access binds the pass to the phone with an authoritative MOBILE-... identifier", async () => {
      const reg = await submitRegistration({
        firstName: "Folashade",
        lastName: "Alakija",
        email: "folashade@example.org",
        phone: "+234 803 555 7777",
        day1: true,
        day2: false,
        day3: false,
      });

      expect(reg.success).toBe(true);
      const pass = reg.passes![0];

      const mobileId = generateMobileDeviceId();
      expect(mobileId).toMatch(/^MOBILE-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      const bindResult = await bindPassToMobileDevice(pass.passCode, mobileId);
      expect(bindResult.success).toBe(true);
      expect(bindResult.status).toBe("newly_bound");
      expect(bindResult.boundDeviceId).toBe(mobileId);

      const record = await getPassBindingRecord(pass.passCode);
      expect(record?.deviceId).toBe(mobileId);
    });

    it("R3.3: Unauthorized second mobile device is strictly rejected with locked status", async () => {
      const reg = await submitRegistration({
        firstName: "Femi",
        lastName: "Otedola",
        email: "femi.otedola@example.org",
        phone: "+234 803 888 9999",
        day1: false,
        day2: true,
        day3: false,
      });

      const pass = reg.passes![0];
      const legitimatePhone = generateMobileDeviceId();
      const unauthorizedPhone = generateMobileDeviceId();

      await bindPassToMobileDevice(pass.passCode, legitimatePhone);

      const legitimateCheck = await checkPassDeviceAccess(pass.passCode, legitimatePhone, true);
      expect(legitimateCheck.isAuthorized).toBe(true);
      expect(legitimateCheck.isBound).toBe(true);

      const hostileCheck = await checkPassDeviceAccess(pass.passCode, unauthorizedPhone, true);
      expect(hostileCheck.isAuthorized).toBe(false);
      expect(hostileCheck.rejectionReason).toBe("FORWARDING_LOCKED");
    });

    it("R3.4: Desktop session access to an already mobile-bound pass is rejected", async () => {
      const reg = await submitRegistration({
        firstName: "Jim",
        lastName: "Ovia",
        email: "jim.ovia@example.org",
        phone: "+234 802 111 2222",
        day1: true,
        day2: false,
        day3: false,
      });

      const pass = reg.passes![0];
      const authorizedMobile = generateMobileDeviceId();
      await bindPassToMobileDevice(pass.passCode, authorizedMobile);

      const desktopAccess = await checkPassDeviceAccess(pass.passCode, "DESKTOP-FIREFOX-UBUNTU", false);
      expect(desktopAccess.isAuthorized).toBe(false);
      expect(desktopAccess.rejectionReason).toBe("DESKTOP_ACCESS_RESTRICTED");
    });

    it("R3.5: User agent classification deterministically distinguishes mobile vs desktop", () => {
      const iphoneUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
      const androidUA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36";
      const desktopMacUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
      const desktopWinUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0";

      expect(isMobileUserAgent(iphoneUA)).toBe(true);
      expect(isMobileUserAgent(androidUA)).toBe(true);
      expect(isMobileUserAgent(desktopMacUA)).toBe(false);
      expect(isMobileUserAgent(desktopWinUA)).toBe(false);
    });

    it("R3.6: Table VIP passes (TAB-...) inherit strict single-device mobile lock", async () => {
      const tablePassCode = "ABK-2026-KT-SEAT-02";
      expect(await isTablePassCode(tablePassCode)).toBe(true);

      const primaryPhone = generateMobileDeviceId();
      const secondaryPhone = generateMobileDeviceId();

      const bindRes = await bindPassToMobileDevice(tablePassCode, primaryPhone);
      expect(bindRes.success).toBe(true);

      const hostileCheck = await checkPassDeviceAccess(tablePassCode, secondaryPhone, true);
      expect(hostileCheck.isAuthorized).toBe(false);
      expect(hostileCheck.rejectionReason).toBe("FORWARDING_LOCKED");
    });
  });
});
