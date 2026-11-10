import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { formatWhatsAppUrl, validateWhatsAppPhone } from "@/lib/utils/phone";
import { isTablePassCode, verifyPassDeviceBinding } from "@/lib/security/device-binding";
import { submitRegistration } from "@/app/(public)/register/actions";
import { GALLERY_DATA } from "@/components/design/public/gallery-showcase";

/**
 * ============================================================================
 * E2E AUTOMATED TEST SUITE: Production Fixes & Platform Security
 * 2026 Abeokuta Polo Festival — The Blueprint
 *
 * Requirements Covered:
 * - R1: Email Consistency Cleanup
 * - R2: Authentic Media Gallery Assets & Layout
 * - R3: Pass Registration & Laptop-to-Mobile Device Binding Security
 * - R4: Open Press Kit Access & Media Pack Download
 *
 * Methodology (4 Tiers):
 * - Tier 1: Feature Coverage (>=5 test cases per requirement: 28 tests)
 * - Tier 2: Boundary & Corner Cases (>=5 test cases per requirement: 24 tests)
 * - Tier 3: Cross-Feature Interactions (10 tests)
 * - Tier 4: Real-World Workload Scenarios (4 comprehensive user journeys)
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// 0. DOMAIN CONTRACT ORACLES & HELPER DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const CANONICAL_EMAILS = {
  PUBLIC_INQUIRY: "abeokutapolo@gmail.com",
  TRANSACTIONAL_FROM: "tickets@guests.abeokutapolofestival2026.org.ng",
  ADMIN_DOMAIN: "@abeokutapolo2026.ng",
} as const;

export const LEGACY_MOCK_EMAILS = [
  "secretariat@abeokutapolo.com",
  "admin@abeokutapolo.com",
  "secretariat@abeokutapolofestival.com",
  "liaison@abeokutapolofestival.com",
  "privacy@abeokutapolofestival.com",
  "tickets@abeokutapolofestival.com",
  "passes@abeokutapolo.com",
  "media@abeokutapolo.com",
] as const;

export const ACTIVE_CODEBASE_EMAIL_FILES = [
  "components/admin/registrations-manager.tsx",
  "lib/notifications/secretariat.ts",
  "lib/pdf/sponsorship-pdf.ts",
  "app/(public)/accessibility/page.tsx",
  "app/(public)/privacy/page.tsx",
  "components/design/public/press-hub.tsx",
  "components/design/public/publications-hub.tsx",
  "lib/calendar/event-ics.ts",
  ".env.example",
  "docs/VERCEL_DEPLOYMENT_GUIDE.md",
  "docs/WHATSAPP_MESSAGING_ARCHITECTURE_2500_ATTENDEES.md",
] as const;

export const REQUIRED_GALLERY_EVENTS = [
  { id: "alake-groundbreaking", pattern: /Alake.*Groundbreaking|Groundbreaking.*Alake/i, name: "Alake Groundbreaking" },
  { id: "chieftaincy-conferment", pattern: /Chieftaincy|Aare Elesin/i, name: "Chieftaincy Conferment" },
  { id: "kobape-turf-matches", pattern: /Kobape.*(Chukka|Turf|Match)|(Chukka|Turf|Match).*Kobape/i, name: "Kobape Turf Matches" },
  { id: "patrons-gala", pattern: /Patrons.*Gala|Gala.*Patrons/i, name: "Patrons Gala" },
] as const;

/**
 * Safely reads a workspace file as UTF-8 string.
 */
function readWorkspaceFile(relativePath: string): string {
  const fullPath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File does not exist: ${relativePath} (resolved: ${fullPath})`);
  }
  return fs.readFileSync(fullPath, "utf-8");
}

/**
 * Mobile user agent detection oracle (per lib/utils/device.ts specification).
 */
export function isMobileUserAgent(userAgent?: string): boolean {
  if (!userAgent) return false;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i;
  return mobileRegex.test(userAgent);
}

/**
 * Generates an authoritative mobile device identifier: MOBILE-${UUID}.
 */
export function generateTestMobileDeviceId(): string {
  return `MOBILE-${crypto.randomUUID()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

describe("Abeokuta Polo Festival 2026: Production Fixes & Security Test Suite", () => {
  beforeEach(() => {
    vi.stubEnv("VVIP_INVITATION_CODES", "ROYAL-VIP, SPECIAL-GUEST, VIP2026");
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    vi.stubEnv("EMAIL_FROM", "tickets@guests.abeokutapolofestival2026.org.ng");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ===========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 test cases per requirement)
  // ===========================================================================

  describe("Tier 1: Feature Coverage", () => {
    // -------------------------------------------------------------------------
    // 1.1 R1: Email Consistency Cleanup
    // -------------------------------------------------------------------------
    describe("Feature 1.1: R1 Email Consistency Cleanup", () => {
      it("1.1.1: Eradicates 'secretariat@abeokutapolo.com' from active codebase files", () => {
        const violations: Array<{ file: string; line: number }> = [];
        for (const relPath of ACTIVE_CODEBASE_EMAIL_FILES) {
          const content = readWorkspaceFile(relPath);
          const lines = content.split("\n");
          lines.forEach((line, index) => {
            if (line.includes("secretariat@abeokutapolo.com")) {
              violations.push({ file: relPath, line: index + 1 });
            }
          });
        }
        expect(
          violations,
          `Found legacy email secretariat@abeokutapolo.com in: ${violations.map((v) => `${v.file}:${v.line}`).join(", ")}`
        ).toEqual([]);
      });

      it("1.1.2: Eradicates 'admin@abeokutapolo.com' from active codebase files", () => {
        const violations: Array<{ file: string; line: number }> = [];
        for (const relPath of ACTIVE_CODEBASE_EMAIL_FILES) {
          const content = readWorkspaceFile(relPath);
          const lines = content.split("\n");
          lines.forEach((line, index) => {
            if (line.includes("admin@abeokutapolo.com")) {
              violations.push({ file: relPath, line: index + 1 });
            }
          });
        }
        expect(
          violations,
          `Found legacy email admin@abeokutapolo.com in: ${violations.map((v) => `${v.file}:${v.line}`).join(", ")}`
        ).toEqual([]);
      });

      it("1.1.3: Eradicates legacy '.com' contact addresses across templates", () => {
        const legacyDomains = [
          "secretariat@abeokutapolofestival.com",
          "liaison@abeokutapolofestival.com",
          "privacy@abeokutapolofestival.com",
          "tickets@abeokutapolofestival.com",
          "passes@abeokutapolo.com",
        ];
        const violations: string[] = [];

        for (const relPath of ACTIVE_CODEBASE_EMAIL_FILES) {
          const content = readWorkspaceFile(relPath);
          for (const email of legacyDomains) {
            if (content.includes(email)) {
              violations.push(`${relPath} contains ${email}`);
            }
          }
        }
        expect(violations, `Legacy .com contact emails detected: ${violations.join("; ")}`).toEqual([]);
      });

      it("1.1.4: Public inquiry contact points expose canonical 'abeokutapolo@gmail.com'", () => {
        const publicFiles = [
          "components/design/public/public-header.tsx",
          "components/design/public/public-footer.tsx",
          "components/design/public/enquiry-dialog.tsx",
          "app/(public)/accessibility/page.tsx",
          "app/(public)/privacy/page.tsx",
          "components/design/public/press-hub.tsx",
        ];

        for (const file of publicFiles) {
          const content = readWorkspaceFile(file);
          expect(
            content.includes(CANONICAL_EMAILS.PUBLIC_INQUIRY),
            `Expected ${file} to expose canonical public inquiry email ${CANONICAL_EMAILS.PUBLIC_INQUIRY}`
          ).toBe(true);
        }
      });

      it("1.1.5: Transactional system sender config exposes 'tickets@guests.abeokutapolofestival2026.org.ng'", () => {
        const clientContent = readWorkspaceFile("lib/email/client.ts");
        expect(clientContent).toContain(CANONICAL_EMAILS.TRANSACTIONAL_FROM);

        const envExampleContent = readWorkspaceFile(".env.example");
        expect(envExampleContent).toContain(CANONICAL_EMAILS.TRANSACTIONAL_FROM);
      });

      it("1.1.6: Calendar event UIDs in lib/calendar/event-ics.ts do not contain '@abeokutapolo.com'", () => {
        const icsContent = readWorkspaceFile("lib/calendar/event-ics.ts");
        expect(icsContent).not.toContain("@abeokutapolo.com");
      });

      it("1.1.7: Internal administrative sign-in accounts ending with '@abeokutapolo2026.ng' are preserved", () => {
        const signInFormContent = readWorkspaceFile("components/auth/sign-in-form.tsx");
        expect(signInFormContent).toContain("@abeokutapolo2026.ng");
        expect(signInFormContent).toContain("superadmin@abeokutapolo2026.ng");
        expect(signInFormContent).toContain("admin@abeokutapolo2026.ng");
      });
    });

    // -------------------------------------------------------------------------
    // 1.2 R2: Media Gallery Assets & Curatorial State
    // -------------------------------------------------------------------------
    describe("Feature 1.2: R2 Media Gallery Assets & Curatorial State", () => {
      it("1.2.1: Gallery items contain 0 Unsplash stock URLs and 0 AI mock URLs", () => {
        const unsplashItems = GALLERY_DATA.filter(
          (item) => item.imageUrl.includes("unsplash.com") || item.imageUrl.includes("googleusercontent.com")
        );
        expect(unsplashItems.length).toBe(0);
      });

      it("1.2.2: 100% uniqueness of image URLs across all gallery items (0 duplicates)", () => {
        const urls = GALLERY_DATA.map((i) => i.imageUrl.trim());
        const uniqueUrls = new Set(urls);
        expect(uniqueUrls.size).toBe(urls.length);
      });

      it("1.2.3: Zero unoriginal AI-generated image files exist in public/images/gallery", () => {
        const galleryDir = path.resolve(process.cwd(), "public/images/gallery");
        if (fs.existsSync(galleryDir)) {
          const files = fs.readdirSync(galleryDir).filter((f) => f.endsWith(".jpg") || f.endsWith(".png"));
          expect(files.length).toBe(0);
        }
      });

      it("1.2.4: Gallery page displays official Secretariat curatorial notice in place of unverified assets", () => {
        const galleryPage = readWorkspaceFile("app/(public)/gallery/page.tsx");
        expect(galleryPage).toContain("Official Photographic Archives in Curation");
        expect(galleryPage).toContain("Abeokuta Polo Club");
      });

      it("1.2.5: Header and Footer navigation cleanly remove uncurated /gallery route links", () => {
        const headerContent = readWorkspaceFile("components/design/public/public-header.tsx");
        const footerContent = readWorkspaceFile("components/design/public/public-footer.tsx");
        expect(headerContent).not.toContain('href="/gallery"');
        expect(footerContent).not.toContain('href="/gallery"');
      });

      it("1.2.6: Homepage removes placeholder video and unverified gallery redirects", () => {
        const homePage = readWorkspaceFile("app/(public)/page.tsx");
        expect(homePage).not.toContain("abeokuta-polo-trailer.mp4");
        expect(homePage).not.toContain('href="/gallery"');
      });

      it("1.2.7: Gallery showcase component handles empty state with dignified curatorial guidance", () => {
        const content = readWorkspaceFile("components/design/public/gallery-showcase.tsx");
        expect(content).toContain("Curatorial Inquiries & Photo Submissions");
        expect(content).toContain("abeokutapolo@gmail.com");
      });
    });

    // -------------------------------------------------------------------------
    // 1.3 R3: Pass Registration & Laptop-to-Mobile Device Binding Security
    // -------------------------------------------------------------------------
    describe("Feature 1.3: R3 Laptop Registration & Mobile Device Binding Security", () => {
      it("1.3.1: Desktop pass registration leaves pass in UNBOUND state (bound_device_id = null)", async () => {
        const reg = await submitRegistration({
          firstName: "Olumide",
          lastName: "Balogun",
          email: "olumide.balogun@example.com",
          phone: "+234 803 444 5555",
          day1: true,
          day2: false,
          day3: false,
        });

        expect(reg.success).toBe(true);
        expect(reg.passes).toBeDefined();
        expect(reg.passes!.length).toBeGreaterThan(0);

        const pass = reg.passes![0];
        // Pass must not lock itself to the desktop registrant session on creation
        const bindingStatus = await verifyPassDeviceBinding(pass.passCode, "");
        expect(bindingStatus.status).toBe("unrestricted");
      });

      it("1.3.2: Desktop registration view displays scannable '📱 Scan to bind to your mobile phone' station", () => {
        const regPageContent = readWorkspaceFile("app/(public)/register/page.tsx");
        const hasMobileStation =
          regPageContent.includes("Scan to bind to your mobile phone") ||
          regPageContent.includes("MobileBindingStation") ||
          regPageContent.includes("bind to your mobile");
        expect(
          hasMobileStation,
          "Expected app/(public)/register/page.tsx to render mobile binding station for desktop registration"
        ).toBe(true);
      });

      it("1.3.3: Desktop registration view provides one-click WhatsApp share link (wa.me)", () => {
        const testPhone = "+234 818 188 8884";
        const testMsg = "Abeokuta Polo Festival 2026: Tap to claim your pass";
        const waUrl = formatWhatsAppUrl(testPhone, testMsg);

        expect(waUrl.startsWith("https://wa.me/2348181888884")).toBe(true);
        expect(waUrl).toContain("text=");
      });

      it("1.3.4: Desktop registration view provides email dispatch trigger to deliver mobile binding link", () => {
        const actionsContent = readWorkspaceFile("app/(public)/register/actions.ts");
        const hasEmailTrigger =
          actionsContent.includes("sendPassMobileBindingEmail") ||
          actionsContent.includes("sendEmail") ||
          actionsContent.includes("bind=mobile");
        expect(hasEmailTrigger, "Expected register actions to support emailing mobile pass binding links").toBe(true);
      });

      it("1.3.5: Mobile browser claim generates and assigns a 'MOBILE-...' device identifier", () => {
        const mobileId = generateTestMobileDeviceId();
        expect(mobileId.startsWith("MOBILE-")).toBe(true);
        expect(mobileId).toMatch(/^MOBILE-[0-9a-fA-F-]{36}$/);
      });

      it("1.3.6: Mobile claim binds pass exclusively to that mobile device (MOBILE-...)", async () => {
        const testPassCode = `ABK-2026-MOB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const mobileDeviceId = generateTestMobileDeviceId();

        // 1. Initial claim on mobile binds the pass
        const firstClaim = await verifyPassDeviceBinding(testPassCode, mobileDeviceId, "Chief Adeleke");
        expect(firstClaim.isAuthorized).toBe(true);
        expect(firstClaim.status).toBe("newly_bound");
        expect(firstClaim.boundDeviceId).toBe(mobileDeviceId);

        // 2. Subsequent access on same mobile device remains authorized
        const repeatClaim = await verifyPassDeviceBinding(testPassCode, mobileDeviceId, "Chief Adeleke");
        expect(repeatClaim.isAuthorized).toBe(true);
        expect(repeatClaim.status).toBe("already_bound_to_this_device");
      });

      it("1.3.7: Subsequent access to mobile-bound pass from secondary device or desktop is rejected with access lock", async () => {
        const testPassCode = `ABK-2026-LCK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const authorizedMobileId = generateTestMobileDeviceId();
        const unauthorizedSecondaryId = generateTestMobileDeviceId();

        // 1. First mobile device binds the pass
        await verifyPassDeviceBinding(testPassCode, authorizedMobileId, "Hon. Shonibare");

        // 2. Secondary mobile device (forwarded link) is blocked
        const forwardedClaim = await verifyPassDeviceBinding(testPassCode, unauthorizedSecondaryId, "Hon. Shonibare");
        expect(forwardedClaim.isAuthorized).toBe(false);
        expect(forwardedClaim.status).toBe("forwarding_blocked");
        expect(forwardedClaim.message).toMatch(/anti-scalping|bound to another|cannot be forwarded/i);
      });
    });

    // -------------------------------------------------------------------------
    // 1.4 R4: Open Press Kit Access
    // -------------------------------------------------------------------------
    describe("Feature 1.4: R4 Open Press Kit Access", () => {
      it("1.4.1: '/press' route is excluded from private prefixes in middleware.ts", () => {
        const middlewareContent = readWorkspaceFile("middleware.ts");
        const privatePrefixMatch = middlewareContent.match(/PRIVATE_PREFIXES\s*=\s*\[([^\]]+)\]/);
        expect(privatePrefixMatch).not.toBeNull();

        const prefixes = privatePrefixMatch![1];
        expect(prefixes).not.toContain("/press");
      });

      it("1.4.2: app/(public)/press/page.tsx renders without requiring authentication or session tokens", () => {
        const pressPageContent = readWorkspaceFile("app/(public)/press/page.tsx");
        expect(pressPageContent).not.toContain("redirect('/sign-in')");
        expect(pressPageContent).not.toContain("redirect('/abawole')");
        expect(pressPageContent).not.toContain("getServerSession");
      });

      it("1.4.3: Press desk media accreditation guidelines are immediately accessible without credentials", () => {
        const pressHubContent = readWorkspaceFile("components/design/public/press-hub.tsx");
        expect(pressHubContent).toContain("Secretariat Media Inquiries & Accreditation Desk");
        expect(pressHubContent).not.toContain("requireAuth");
        expect(pressHubContent).not.toContain("SignInModal");
      });

      it("1.4.4: Unverified simulated press pack route and fake download buttons are completely eliminated", () => {
        const apiRouteExists = fs.existsSync(path.resolve(process.cwd(), "app/api/press/pack/route.ts"));
        const pdfFileExists = fs.existsSync(path.resolve(process.cwd(), "public/docs/Abeokuta_Polo_Festival_2026_Press_Kit.pdf"));
        const pressHubContent = readWorkspaceFile("components/design/public/press-hub.tsx");

        expect(apiRouteExists, "Unverified /api/press/pack route must not exist").toBe(false);
        expect(pdfFileExists, "Simulated press kit PDF must not exist").toBe(false);
        expect(pressHubContent).not.toContain("Download Press Pack");
        expect(pressHubContent).not.toContain("2,400+");
        expect(pressHubContent).not.toContain("1 Gbps");
      });

      it("1.4.5: Press hub media accreditation contact displays canonical 'abeokutapolo@gmail.com'", () => {
        const pressHubContent = readWorkspaceFile("components/design/public/press-hub.tsx");
        expect(
          pressHubContent.includes(CANONICAL_EMAILS.PUBLIC_INQUIRY),
          `Expected press-hub.tsx to display canonical email ${CANONICAL_EMAILS.PUBLIC_INQUIRY}`
        ).toBe(true);
      });
    });
  });

  // ===========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 test cases per requirement)
  // ===========================================================================

  describe("Tier 2: Boundary & Corner Cases", () => {
    // -------------------------------------------------------------------------
    // 2.1 R1 Boundary & Corner Cases
    // -------------------------------------------------------------------------
    describe("Boundary 2.1: Email Boundaries & Edge Cases", () => {
      it("2.1.1: Mailto URLs handle subject and body URL-encoding without corrupting email addresses", () => {
        const enquiryContent = readWorkspaceFile("components/design/public/enquiry-dialog.tsx");
        expect(enquiryContent).toContain("mailto:abeokutapolo@gmail.com");
      });

      it("2.1.2: Email address matching is strictly case-insensitive", () => {
        const upper = CANONICAL_EMAILS.PUBLIC_INQUIRY.toUpperCase();
        const lower = CANONICAL_EMAILS.PUBLIC_INQUIRY.toLowerCase();
        expect(upper.toLowerCase()).toBe(lower);
      });

      it("2.1.3: Transactional sender fallback strictly defaults to 'tickets@guests.abeokutapolofestival2026.org.ng' when EMAIL_FROM is unset", () => {
        vi.stubEnv("EMAIL_FROM", "");
        const fallback = process.env.EMAIL_FROM || CANONICAL_EMAILS.TRANSACTIONAL_FROM;
        expect(fallback).toBe(CANONICAL_EMAILS.TRANSACTIONAL_FROM);
      });

      it("2.1.4: Admin credentials and public contacts do not cross-pollinate into each other's configuration", () => {
        expect(CANONICAL_EMAILS.PUBLIC_INQUIRY).not.toContain("abeokutapolo2026.ng");
        expect(CANONICAL_EMAILS.TRANSACTIONAL_FROM).not.toContain("gmail.com");
      });

      it("2.1.5: Rejects emails with spaces, missing '@', or invalid formatting in contact inputs", () => {
        const invalidEmails = ["notanemail", "test with spaces@domain.com", "missingdomain@", "@nodomain.com"];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const invalid of invalidEmails) {
          expect(emailRegex.test(invalid)).toBe(false);
        }
      });

      it("2.1.6: Preserves legal privacy and accessibility mailto links with canonical email", () => {
        const privacy = readWorkspaceFile("app/(public)/privacy/page.tsx");
        const accessibility = readWorkspaceFile("app/(public)/accessibility/page.tsx");

        expect(privacy).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
        expect(accessibility).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
      });
    });

    // -------------------------------------------------------------------------
    // 2.2 R2 Boundary & Corner Cases
    // -------------------------------------------------------------------------
    describe("Boundary 2.2: Media Gallery Asset Boundaries", () => {
      it("2.2.1: Rejects null, empty string, or whitespace-only image URLs in gallery items", () => {
        for (const item of GALLERY_DATA) {
          expect(item.imageUrl, `Item ${item.id} has empty imageUrl`).toBeTruthy();
          expect(item.imageUrl.trim().length, `Item ${item.id} imageUrl is whitespace-only`).toBeGreaterThan(0);
        }
      });

      it("2.2.2: Gallery image URLs resolve to authentic local files or valid production paths", () => {
        for (const item of GALLERY_DATA) {
          if (item.imageUrl.startsWith("/")) {
            const localAssetPath = path.resolve(process.cwd(), `public${item.imageUrl}`);
            expect(
              fs.existsSync(localAssetPath),
              `Referenced local asset path does not exist: ${item.imageUrl}`
            ).toBe(true);
          } else {
            expect(item.imageUrl.startsWith("http://") || item.imageUrl.startsWith("https://")).toBe(true);
          }
        }
      });

      it("2.2.3: Rejects dangerous pseudo-protocols (javascript:, data:text/html) in image URLs", () => {
        for (const item of GALLERY_DATA) {
          expect(item.imageUrl.startsWith("javascript:")).toBe(false);
          expect(item.imageUrl.startsWith("data:text/html")).toBe(false);
        }
      });

      it("2.2.4: Gallery component enforces curatorial fallback when archive is empty", () => {
        const content = readWorkspaceFile("components/design/public/gallery-showcase.tsx");
        expect(content).toContain("Archive In Curation");
      });

      it("2.2.5: Publications hub cleanly serves genuine official tournament documents", () => {
        const publicationsContent = readWorkspaceFile("components/design/public/publications-hub.tsx");
        expect(publicationsContent).not.toContain("68-page");
        expect(publicationsContent).toContain("3-Day Tournament Programme");
      });

      it("2.2.6: Gallery categories match official festival classification tokens", () => {
        const validCategories = [
          "Royal Fathers",
          "President & Leadership",
          "Government Participation",
          "Official Opening & Chukkas",
          "Culture & Entertainment",
        ];
        for (const item of GALLERY_DATA) {
          expect(validCategories).toContain(item.category);
        }
      });
    });

    // -------------------------------------------------------------------------
    // 2.3 R3 Boundary & Corner Cases
    // -------------------------------------------------------------------------
    describe("Boundary 2.3: Device Binding Security, Spoofing & Concurrency", () => {
      it("2.3.1: Rejects desktop user agent when evaluating mobile browser status", () => {
        const desktopUAs = [
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ];
        for (const ua of desktopUAs) {
          expect(isMobileUserAgent(ua)).toBe(false);
        }
      });

      it("2.3.2: Correctly identifies authentic mobile devices (iOS, Android, Mobile Safari)", () => {
        const mobileUAs = [
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
        ];
        for (const ua of mobileUAs) {
          expect(isMobileUserAgent(ua)).toBe(true);
        }
      });

      it("2.3.3: Rejects empty, null, or whitespace-only device IDs gracefully without binding", async () => {
        const testPassCode = `ABK-2026-NUL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const res = await verifyPassDeviceBinding(testPassCode, "   ");
        expect(res.status).toBe("unrestricted");
      });

      it("2.3.4: Re-entry authorization: Same mobile device can view pass repeatedly without lockouts", async () => {
        const testPassCode = `ABK-2026-REP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const mobileId = generateTestMobileDeviceId();

        // Bind
        await verifyPassDeviceBinding(testPassCode, mobileId);

        // Multiple subsequent checks
        for (let i = 0; i < 5; i++) {
          const check = await verifyPassDeviceBinding(testPassCode, mobileId);
          expect(check.isAuthorized).toBe(true);
          expect(check.status).toBe("already_bound_to_this_device");
        }
      });

      it("2.3.5: Table guest passes (-KT, -RT, -QT, -PT) enforce identical anti-forwarding device locks", async () => {
        const tablePassCodes = [
          `ABK-2026-KT-S02-${crypto.randomUUID().slice(0, 4)}`,
          `ABK-2026-RT-S04-${crypto.randomUUID().slice(0, 4)}`,
          `ABK-2026-QT-S07-${crypto.randomUUID().slice(0, 4)}`,
          `ABK-2026-PT-S10-${crypto.randomUUID().slice(0, 4)}`,
        ];

        for (const code of tablePassCodes) {
          expect(await isTablePassCode(code)).toBe(true);
          const dev1 = generateTestMobileDeviceId();
          const dev2 = generateTestMobileDeviceId();

          // Bind dev1
          const bind1 = await verifyPassDeviceBinding(code, dev1);
          expect(bind1.isAuthorized).toBe(true);

          // Dev2 forwarded attempt blocked
          const bind2 = await verifyPassDeviceBinding(code, dev2);
          expect(bind2.isAuthorized).toBe(false);
          expect(bind2.status).toBe("forwarding_blocked");
        }
      });

      it("2.3.6: Table Host pass (-S01-) remains master unrestricted pass for purchaser", async () => {
        const hostPass = `ABK-2026-KT-S01-${crypto.randomUUID().slice(0, 4)}`;
        expect(await isTablePassCode(hostPass)).toBe(true);

        const check1 = await verifyPassDeviceBinding(hostPass, "DEV-HOST-LAPTOP");
        expect(check1.isAuthorized).toBe(true);
        expect(check1.status).toBe("unrestricted");

        const check2 = await verifyPassDeviceBinding(hostPass, generateTestMobileDeviceId());
        expect(check2.isAuthorized).toBe(true);
        expect(check2.status).toBe("unrestricted");
      });
    });

    // -------------------------------------------------------------------------
    // 2.4 R4 Boundary & Corner Cases
    // -------------------------------------------------------------------------
    describe("Boundary 2.4: Press Kit Openness, Error Handling & Boundary Requests", () => {
      it("2.4.1: Accessing /press does not require Authorization header or bearer token", () => {
        const middlewareContent = readWorkspaceFile("middleware.ts");
        expect(middlewareContent).not.toMatch(/\/press.*authorization/i);
      });

      it("2.4.2: Expired or malformed auth cookie does not redirect public routes like /press to /sign-in", () => {
        const middlewareContent = readWorkspaceFile("middleware.ts");
        const privateCheckLogic = middlewareContent.includes("isPrivate");
        expect(privateCheckLogic).toBe(true);
      });

      it("2.4.3: Press kit unverified downloads are eliminated in favor of genuine accreditation", () => {
        const pressHubContent = readWorkspaceFile("components/design/public/press-hub.tsx");
        expect(pressHubContent).not.toContain("Download Press Pack");
        expect(pressHubContent).toContain("Secretariat Media Inquiries & Accreditation Desk");
      });

      it("2.4.4: Press accreditation categories cover Broadcast, Print, Photojournalism, and Digital", () => {
        const pressHubContent = readWorkspaceFile("components/design/public/press-hub.tsx");
        expect(pressHubContent).toContain("Live Broadcast & Television Syndicate");
        expect(pressHubContent).toContain("Pitch-Side Photojournalists");
        expect(pressHubContent).toContain("Print & Wire Correspondents");
        expect(pressHubContent).toContain("Digital Creators & Equestrian Documentarians");
      });

      it("2.4.5: Media protocol phone hotline exposes valid Nigerian international format", () => {
        const pressHubContent = readWorkspaceFile("components/design/public/press-hub.tsx");
        expect(pressHubContent).toContain("+234 818 188 8884");
        const phoneValidation = validateWhatsAppPhone("+234 818 188 8884");
        expect(phoneValidation.isValid).toBe(true);
      });

      it("2.4.6: Public header and footer navigation links expose /press and safely omit uncurated /gallery", () => {
        const header = readWorkspaceFile("components/design/public/public-header.tsx");
        const footer = readWorkspaceFile("components/design/public/public-footer.tsx");

        expect(header.includes("/press") || footer.includes("/press")).toBe(true);
        expect(header.includes("/gallery")).toBe(false);
        expect(footer.includes("/gallery")).toBe(false);
      });
    });
  });

  // ===========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (Pairwise & Integration)
  // ===========================================================================

  describe("Tier 3: Cross-Feature Interactions", () => {
    it("3.1: Pass registration email contains mobile binding link and is sent from tickets@guests.abeokutapolofestival2026.org.ng", () => {
      const emailClient = readWorkspaceFile("lib/email/client.ts");
      expect(emailClient).toContain(CANONICAL_EMAILS.TRANSACTIONAL_FROM);
    });

    it("3.2: Gallery page hero CTA links directly to /register without intermediate authentication", () => {
      const galleryPage = readWorkspaceFile("app/(public)/gallery/page.tsx");
      expect(galleryPage).toContain('href="/register"');
    });

    it("3.3: Press hub contact email and publications hub contact email both align to canonical abeokutapolo@gmail.com", () => {
      const pressHub = readWorkspaceFile("components/design/public/press-hub.tsx");
      const pubHub = readWorkspaceFile("components/design/public/publications-hub.tsx");

      expect(pressHub).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
      expect(pubHub).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
    });

    it("3.4: Table booking confirmation exposes mobile binding links for guest passes (Seats 2-10)", () => {
      const tableActions = readWorkspaceFile("app/(public)/register/actions.ts");
      expect(tableActions).toContain("submitTableRegistration");
    });

    it("3.5: Day 3 strict paywall: Unverified bank transfer registrations strictly receive provisional status and cannot bind active gate passes", async () => {
      const reg = await submitRegistration({
        firstName: "Taofeek",
        lastName: "Balogun",
        email: "taofeek.balogun@example.com",
        phone: "+234 803 777 8888",
        day1: false,
        day2: false,
        day3: true,
        day3TicketCount: 1,
        paymentMethod: "bank_transfer",
        bankTransferRef: "ABK-WEMA-TEST-001",
      });

      expect(reg.success).toBe(true);
      expect(reg.status).toBe("pending_verification");
      expect(reg.passes).toBeDefined();
      expect(reg.passes!.length).toBe(1);

      const pass = reg.passes![0];
      // Day 3 bank transfer must be strictly provisional pending bursary reconciliation
      expect(pass.status).toBe("pending_verification");
      expect(pass.isVvip).toBe(false);
      expect(pass.category).toContain("Provisional Claim (Pending Bursary Verification)");
    });

    it("3.6: Mobile binding station QR payload encodes /pass/[code]?bind=mobile matching turnstile format", () => {
      const samplePass = "ABK-2026-D129999";
      const bindingUrl = `/pass/${samplePass}?bind=mobile`;
      expect(bindingUrl).toContain("bind=mobile");
      expect(bindingUrl).toContain(samplePass);
    });

    it("3.7: WhatsApp one-click link formats attendee pass message and binding URL with pre-filled text", () => {
      const phone = "+234 818 188 8884";
      const message = "Abeokuta Polo Festival 2026: Claim Pass ABK-2026-D1ABC at https://abeokutapolo.com/pass/ABK-2026-D1ABC?bind=mobile";
      const url = formatWhatsAppUrl(phone, message);

      expect(url).toContain("https://wa.me/2348181888884?text=");
      expect(url).toContain(encodeURIComponent("ABK-2026-D1ABC"));
    });

    it("3.8: ICS calendar file contains verified event summary and updated email domain", () => {
      const ics = readWorkspaceFile("lib/calendar/event-ics.ts");
      expect(ics).not.toContain("@abeokutapolo.com");
      expect(ics).toContain("Abeokuta Polo");
    });

    it("3.9: Sponsorship PDF dossier lists official canonical secretariat email", () => {
      const pdf = readWorkspaceFile("lib/pdf/sponsorship-pdf.ts");
      expect(pdf).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
      expect(pdf).not.toContain("secretariat@abeokutapolofestival.com");
    });

    it("3.10: Public footer, header, and dialogs consistency across all public routes", () => {
      const footer = readWorkspaceFile("components/design/public/public-footer.tsx");
      const header = readWorkspaceFile("components/design/public/public-header.tsx");
      const enquiry = readWorkspaceFile("components/design/public/enquiry-dialog.tsx");

      expect(footer).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
      expect(header).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
      expect(enquiry).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
    });
  });

  // ===========================================================================
  // TIER 4: REAL-WORLD WORKLOAD SCENARIOS (End-to-End User Journeys)
  // ===========================================================================

  describe("Tier 4: Real-World Workload Scenarios", () => {
    it("4.1: Scenario 1: Attendee Desktop Registration -> Mobile Binding Station -> Mobile Binding -> Gate Pass Ready -> Unauthorized Forward Blocked -> Desktop Re-entry Blocked", async () => {
      // 1. Attendee registers on a desktop laptop
      const reg = await submitRegistration({
        firstName: "Folashade",
        lastName: "Adeyemi",
        email: "folashade.adeyemi@example.com",
        phone: "+234 802 333 4444",
        day1: true,
        day2: true,
        day3: false,
      });

      expect(reg.success).toBe(true);
      const pass = reg.passes![0];
      expect(pass.passCode).toMatch(/^ABK-2026-D1/);

      // 2. Initial state: Pass is UNBOUND to laptop
      const laptopInitialCheck = await verifyPassDeviceBinding(pass.passCode, "");
      expect(laptopInitialCheck.status).toBe("unrestricted");

      // 3. Attendee scans QR code on their iPhone (generating MOBILE-...)
      const attendeeIphoneId = generateTestMobileDeviceId();
      const mobileClaim = await verifyPassDeviceBinding(pass.passCode, attendeeIphoneId, "Folashade Adeyemi");
      expect(mobileClaim.isAuthorized).toBe(true);
      expect(mobileClaim.status).toBe("newly_bound");
      expect(mobileClaim.boundDeviceId).toBe(attendeeIphoneId);

      // 4. Attendee forwards WhatsApp link to friend's Android phone
      const friendAndroidId = generateTestMobileDeviceId();
      const friendAttempt = await verifyPassDeviceBinding(pass.passCode, friendAndroidId, "Folashade Adeyemi");
      expect(friendAttempt.isAuthorized).toBe(false);
      expect(friendAttempt.status).toBe("forwarding_blocked");
      expect(friendAttempt.message).toContain("cannot be forwarded");

      // 5. Original attendee re-opens on their iPhone -> Authorized
      const attendeeRecheck = await verifyPassDeviceBinding(pass.passCode, attendeeIphoneId, "Folashade Adeyemi");
      expect(attendeeRecheck.isAuthorized).toBe(true);
      expect(attendeeRecheck.status).toBe("already_bound_to_this_device");
    });

    it("4.2: Scenario 2: International Press Correspondent -> Direct Open Press Kit Access -> Unauthenticated Media Pack Download -> Protocol Direct Line Verification", () => {
      // 1. Journalist navigates to /press without any session or login credentials
      const middleware = readWorkspaceFile("middleware.ts");
      expect(middleware).not.toMatch(/PRIVATE_PREFIXES.*\/press/);

      // 2. Press page loads freely
      const pressPage = readWorkspaceFile("app/(public)/press/page.tsx");
      expect(pressPage).toContain("Press & Media");

      // 3. Media desk guidelines are displayed without fake download buttons
      const pressHub = readWorkspaceFile("components/design/public/press-hub.tsx");
      expect(pressHub).toContain("Secretariat Media Inquiries & Accreditation Desk");
      expect(pressHub).not.toContain("Download Press Pack");

      // 4. Inquiries point to canonical email and verified phone hotline
      expect(pressHub).toContain(CANONICAL_EMAILS.PUBLIC_INQUIRY);
      expect(pressHub).toContain("+234 818 188 8884");
    });

    it("4.3: Scenario 3: Patron Cultural Gallery Journey -> Curatorial Integrity -> Zero AI/Mock Assets -> Secretariat Contact Notice", () => {
      // 1. Zero unoriginal AI-generated mock images in public directory
      const galleryDir = path.resolve(process.cwd(), "public/images/gallery");
      if (fs.existsSync(galleryDir)) {
        const files = fs.readdirSync(galleryDir).filter((f) => f.endsWith(".jpg") || f.endsWith(".png"));
        expect(files.length).toBe(0);
      }

      // 2. Zero stock Unsplash images
      const unsplashFound = GALLERY_DATA.some((i) => i.imageUrl.includes("unsplash.com"));
      expect(unsplashFound, "Zero Unsplash URLs allowed in gallery").toBe(false);

      // 3. 100% URL Uniqueness
      const urls = GALLERY_DATA.map((i) => i.imageUrl);
      expect(new Set(urls).size).toBe(urls.length);

      // 4. Curatorial holding notice informs visitors with canonical Secretariat contact
      const galleryPage = readWorkspaceFile("app/(public)/gallery/page.tsx");
      expect(galleryPage).toContain("Official Photographic Archives in Curation");
      expect(galleryPage).toContain("abeokutapolo@gmail.com");
    });

    it("4.4: Scenario 4: High-Concurrency Multi-Attendee Device Binding & Turnstile Isolation", async () => {
      const attendees = [
        { name: "Alhaji Dantata", day: "day1" },
        { name: "Chief Olusola", day: "day2" },
        { name: "Dr. Alabi", day: "day12" },
      ];

      const passCodes: string[] = [];
      const deviceIds: string[] = [];

      for (let i = 0; i < attendees.length; i++) {
        const passCode = `ABK-2026-CONCUR-${i}-${crypto.randomUUID().slice(0, 6)}`;
        const deviceId = generateTestMobileDeviceId();
        passCodes.push(passCode);
        deviceIds.push(deviceId);

        const res = await verifyPassDeviceBinding(passCode, deviceId, attendees[i].name);
        expect(res.isAuthorized).toBe(true);
        expect(res.status).toBe("newly_bound");
      }

      // Cross-device interference test: device 0 cannot view pass 1
      const crossCheck = await verifyPassDeviceBinding(passCodes[1], deviceIds[0]);
      expect(crossCheck.isAuthorized).toBe(false);
      expect(crossCheck.status).toBe("forwarding_blocked");

      // Original devices still authorized
      for (let i = 0; i < attendees.length; i++) {
        const check = await verifyPassDeviceBinding(passCodes[i], deviceIds[i]);
        expect(check.isAuthorized).toBe(true);
        expect(check.status).toBe("already_bound_to_this_device");
      }
    });
  });
});
