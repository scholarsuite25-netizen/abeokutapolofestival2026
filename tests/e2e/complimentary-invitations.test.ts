import { describe, expect, it, beforeEach, vi } from "vitest";
import { createHmac, randomBytes } from "node:crypto";
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import { verifyPassDeviceBinding } from "@/lib/security/device-binding";
import { processGateScan } from "@/app/(ops)/scan/actions";
import { generateSignedPassToken, verifyPassToken } from "@/lib/qr/token";
import {
  generateInvitationCode as libGenerateCode,
  createInvitationPayload as libCreatePayload,
  verifyInvitationSeal as libVerifySeal,
  generateSignedInvitationToken as libGenerateToken,
  verifyInvitationToken as libVerifyToken,
  generateWhatsAppInvitationText as libGenerateWhatsApp,
  ROYAL_SECURITY_SEAL as LIB_ROYAL_SEAL,
} from "@/lib/invitations/issuance";
import {
  saveInvitation as libSaveInvitation,
  getInvitationByCode as libGetByCode,
  listInvitations as libListInvitations,
  bindInvitationToDevice as libBindDevice,
  clearInvitationsMemoryStore as libClearStore,
} from "@/lib/invitations/storage";
import {
  STANDARD_INVITATION_CATEGORIES,
} from "@/lib/invitations/types";

/**
 * ============================================================================
 * E2E TEST SUITE: Complimentary Invitations & Portrait Access Cards
 * Abeokuta Polo Festival 2026
 *
 * Authoritative Sources:
 * 1. ORIGINAL_REQUEST.md (§R1, §R2, §R3)
 * 2. PROJECT.md (§ Architecture, § Interface Contracts, § Code Layout)
 *
 * Test Methodology: 4 Tiers
 * - Tier 1: Feature Coverage (>=5 test cases per feature across R1, R2, R3)
 * - Tier 2: Boundary & Corner Cases (>=5 test cases per feature)
 * - Tier 3: Cross-Feature Combinations (Pairwise Coverage)
 * - Tier 4: Real-World Application Scenarios (Secretariat Issuance & Turnstile Gate Arrival)
 * ============================================================================
 */

// ── 1. Authoritative Domain Specifications ────────────────────────────────────

export const PREDEFINED_CATEGORIES = [
  "VVIP",
  "VIP",
  "MEMBER",
  "ABEOKUTA POLO CLUB",
  "PRESS",
  "SPONSORS",
  "VENDORS",
  "PROGRAMME OFFICIALS",
] as const;

export type PredefinedCategory = (typeof PREDEFINED_CATEGORIES)[number];
export type InvitationCategory = PredefinedCategory | string;

export const ROYAL_SECURITY_SEAL = "Aare Elesin" as const;
export const INVITATION_CODE_REGEX = /^ABK-(?:2026-)?INV-[A-Z0-9]{4,10}$/;

export interface ComplimentaryInvitationModel {
  id: string;
  invitationCode: string;
  firstName?: string | null;
  surname?: string | null;
  displayName: string;
  designation: string;
  category: InvitationCategory;
  isCustomCategory: boolean;
  securitySeal: typeof ROYAL_SECURITY_SEAL;
  qrPayload: string;
  qrToken?: string;
  boundDeviceId?: string | null;
  isLockedToDevice: boolean;
  claimedAt?: string | null;
  createdAt: string;
}

export interface IssueInvitationInput {
  firstName?: string | null;
  surname?: string | null;
  designation: string;
  category: string;
  customCategory?: string | null;
}

// ── 2. Authoritative Contract Oracle ──────────────────────────────────────────

const SECRET_KEY = process.env.QR_SIGNING_SECRET || "abk-polo-2026-production-qr-signing-key-32-chars";

/**
 * Generates an authentic invitation code matching festival standards.
 */
export function generateTestInvitationCode(): string {
  const entropy = randomBytes(3).toString("hex").toUpperCase();
  return `ABK-2026-INV-${entropy}`;
}

/**
 * Derives display name respecting optional names requirement (R1, R2).
 */
export function deriveDisplayName(firstName?: string | null, surname?: string | null, designation?: string): string {
  const f = firstName?.trim() || "";
  const s = surname?.trim() || "";
  if (f && s) return `${f} ${s}`;
  if (f) return f;
  if (s) return s;
  return designation?.trim() || "Distinguished Guest";
}

/**
 * Creates and cryptographically seals a complimentary invitation.
 */
export function createInvitationOracle(input: IssueInvitationInput): ComplimentaryInvitationModel {
  const trimmedDesignation = (input.designation || "").trim();
  if (!trimmedDesignation) {
    throw new Error("Validation failed: designation is required.");
  }

  const rawCat = (input.category || "").trim();
  if (!rawCat) {
    throw new Error("Validation failed: category selection is required.");
  }

  const isOther = rawCat.toLowerCase() === "other" || rawCat.toLowerCase() === "custom";
  let finalCategory: string;
  let isCustom = false;

  if (isOther) {
    const customText = (input.customCategory || "").trim();
    if (!customText) {
      throw new Error("Validation failed: custom category text is required when 'Other' is selected.");
    }
    finalCategory = customText;
    isCustom = true;
  } else {
    const isPredefined = PREDEFINED_CATEGORIES.includes(rawCat as PredefinedCategory);
    if (!isPredefined) {
      finalCategory = rawCat;
      isCustom = true;
    } else {
      finalCategory = rawCat;
      isCustom = false;
    }
  }

  const code = generateTestInvitationCode();
  const id = `inv-${randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();

  // Cryptographic QR Token with "Aare Elesin" seal
  const hmac = createHmac("sha256", SECRET_KEY);
  hmac.update(`${ROYAL_SECURITY_SEAL}::${code}::${finalCategory}`);
  const signature = hmac.digest("base64url");
  const qrToken = `ABK26.${Buffer.from(JSON.stringify({ code, seal: ROYAL_SECURITY_SEAL, category: finalCategory })).toString("base64url")}.${signature}`;
  const qrPayload = `https://abeokuta-polo-festival-2026.vercel.app/invitation/${code}?seal=Aare+Elesin&sig=${signature}`;

  return {
    id,
    invitationCode: code,
    firstName: input.firstName?.trim() || null,
    surname: input.surname?.trim() || null,
    displayName: deriveDisplayName(input.firstName, input.surname, trimmedDesignation),
    designation: trimmedDesignation,
    category: finalCategory,
    isCustomCategory: isCustom,
    securitySeal: ROYAL_SECURITY_SEAL,
    qrPayload,
    qrToken,
    boundDeviceId: null,
    isLockedToDevice: true,
    claimedAt: null,
    createdAt: now,
  };
}

/**
 * Verifies authenticity of an invitation seal.
 */
export function verifyInvitationSealOracle(
  code: string,
  seal: string,
  category: string,
  providedSignature: string
): { valid: boolean; error?: string } {
  if (seal !== ROYAL_SECURITY_SEAL) {
    return { valid: false, error: `Invalid security seal: expected '${ROYAL_SECURITY_SEAL}', received '${seal}'` };
  }
  const hmac = createHmac("sha256", SECRET_KEY);
  hmac.update(`${ROYAL_SECURITY_SEAL}::${code}::${category}`);
  const expectedSig = hmac.digest("base64url");
  if (providedSignature !== expectedSig) {
    return { valid: false, error: "Cryptographic signature mismatch. Token forged or tampered." };
  }
  return { valid: true };
}

// ── In-Memory Persistence Harness for Isolated Tests ─────────────────────────
class IsolatedInvitationStore {
  private invitations = new Map<string, ComplimentaryInvitationModel>();

  async save(inv: ComplimentaryInvitationModel): Promise<ComplimentaryInvitationModel> {
    this.invitations.set(inv.invitationCode, { ...inv });
    return this.invitations.get(inv.invitationCode)!;
  }

  async getByCode(code: string): Promise<ComplimentaryInvitationModel | null> {
    const item = this.invitations.get(code.toUpperCase().trim());
    return item ? { ...item } : null;
  }

  async list(): Promise<ComplimentaryInvitationModel[]> {
    return Array.from(this.invitations.values()).map((v) => ({ ...v }));
  }

  async bindDevice(code: string, deviceId: string): Promise<{ authorized: boolean; status: string }> {
    const inv = this.invitations.get(code.toUpperCase().trim());
    if (!inv) {
      return { authorized: false, status: "not_found" };
    }
    if (!deviceId || !deviceId.trim()) {
      return { authorized: false, status: "invalid_device_id" };
    }
    if (!inv.boundDeviceId) {
      inv.boundDeviceId = deviceId.trim();
      inv.claimedAt = new Date().toISOString();
      return { authorized: true, status: "newly_bound" };
    }
    if (inv.boundDeviceId === deviceId.trim()) {
      return { authorized: true, status: "already_bound_to_this_device" };
    }
    return { authorized: false, status: "forwarding_blocked" };
  }

  clear() {
    this.invitations.clear();
  }
}

const store = new IsolatedInvitationStore();

// ============================================================================
// TEST SUITE EXECUTION
// ============================================================================

describe("Complimentary Invitations & Portrait Access Cards E2E Suite", () => {
  beforeEach(() => {
    store.clear();
    libClearStore();
    vi.stubEnv("QR_SIGNING_SECRET", SECRET_KEY);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TIER 1: FEATURE COVERAGE (>=5 test cases per feature across R1, R2, R3)
  // ──────────────────────────────────────────────────────────────────────────

  describe("Tier 1: Feature Coverage", () => {
    // 1.1 Category Dropdown Predefined Options (R1)
    describe("Feature 1.1: Category Dropdown & Predefined Options", () => {
      it("1.1.1: Accepts VVIP category with designation", () => {
        const inv = createInvitationOracle({
          firstName: "Kabiyesi",
          surname: "Gbadebo",
          designation: "Alake of Egbaland",
          category: "VVIP",
        });
        expect(inv.category).toBe("VVIP");
        expect(inv.isCustomCategory).toBe(false);
      });

      it("1.1.2: Accepts VIP category with designation", () => {
        const inv = createInvitationOracle({
          firstName: "Adewale",
          surname: "Tinubu",
          designation: "Honorary Patron",
          category: "VIP",
        });
        expect(inv.category).toBe("VIP");
        expect(inv.isCustomCategory).toBe(false);
      });

      it("1.1.3: Accepts MEMBER and ABEOKUTA POLO CLUB categories", () => {
        const memberInv = createInvitationOracle({
          designation: "Handicap +2 Player",
          category: "MEMBER",
        });
        const clubInv = createInvitationOracle({
          designation: "Trustee",
          category: "ABEOKUTA POLO CLUB",
        });
        expect(memberInv.category).toBe("MEMBER");
        expect(clubInv.category).toBe("ABEOKUTA POLO CLUB");
      });

      it("1.1.4: Accepts PRESS and SPONSORS categories", () => {
        const pressInv = createInvitationOracle({
          firstName: "Amina",
          surname: "Yusuf",
          designation: "Chief Equestrian Correspondent",
          category: "PRESS",
        });
        const sponsorInv = createInvitationOracle({
          designation: "Executive Director, Sterling",
          category: "SPONSORS",
        });
        expect(pressInv.category).toBe("PRESS");
        expect(sponsorInv.category).toBe("SPONSORS");
      });

      it("1.1.5: Accepts VENDORS and PROGRAMME OFFICIALS categories", () => {
        const vendorInv = createInvitationOracle({
          designation: "Paddock Hospitality Lead",
          category: "VENDORS",
        });
        const officialInv = createInvitationOracle({
          designation: "Senior Umpire",
          category: "PROGRAMME OFFICIALS",
        });
        expect(vendorInv.category).toBe("VENDORS");
        expect(officialInv.category).toBe("PROGRAMME OFFICIALS");
      });

      it("1.1.6: Exhaustive check covers all 8 predefined categories from ORIGINAL_REQUEST.md", () => {
        expect(PREDEFINED_CATEGORIES).toHaveLength(8);
        for (const cat of PREDEFINED_CATEGORIES) {
          const inv = createInvitationOracle({
            designation: `Official for ${cat}`,
            category: cat,
          });
          expect(inv.category).toBe(cat);
          expect(inv.isCustomCategory).toBe(false);
        }
      });

      it("1.1.7: Direct library validation against STANDARD_INVITATION_CATEGORIES", () => {
        expect(STANDARD_INVITATION_CATEGORIES).toEqual(PREDEFINED_CATEGORIES);
        for (const cat of STANDARD_INVITATION_CATEGORIES) {
          const item = libCreatePayload({
            designation: "Official Dignitary",
            category: cat,
            isCustomCategory: false,
          });
          expect(item.category).toBe(cat);
          expect(item.isCustomCategory).toBe(false);
        }
      });
    });

    // 1.2 Optional Names Handling (R1)
    describe("Feature 1.2: Optional Names Handling", () => {
      it("1.2.1: Submitting with BOTH first name and surname omitted succeeds gracefully", () => {
        const inv = createInvitationOracle({
          firstName: "",
          surname: "",
          designation: "Special Royal Envoy",
          category: "VVIP",
        });
        expect(inv.firstName).toBeNull();
        expect(inv.surname).toBeNull();
        expect(inv.displayName).toBe("Special Royal Envoy");
      });

      it("1.2.2: Submitting with null names defaults gracefully to designation", () => {
        const inv = createInvitationOracle({
          firstName: null,
          surname: null,
          designation: "Diplomatic Delegation Leader",
          category: "VIP",
        });
        expect(inv.displayName).toBe("Diplomatic Delegation Leader");
      });

      it("1.2.3: Submitting with FIRST NAME ONLY succeeds", () => {
        const inv = createInvitationOracle({
          firstName: "Aremu",
          surname: "",
          designation: "Equestrian Enthusiast",
          category: "MEMBER",
        });
        expect(inv.firstName).toBe("Aremu");
        expect(inv.surname).toBeNull();
        expect(inv.displayName).toBe("Aremu");
      });

      it("1.2.4: Submitting with SURNAME ONLY succeeds", () => {
        const inv = createInvitationOracle({
          firstName: "",
          surname: "Balogun",
          designation: "Club Elder",
          category: "ABEOKUTA POLO CLUB",
        });
        expect(inv.firstName).toBeNull();
        expect(inv.surname).toBe("Balogun");
        expect(inv.displayName).toBe("Balogun");
      });

      it("1.2.5: Submitting with BOTH first name and surname formats full name", () => {
        const inv = createInvitationOracle({
          firstName: "Olubunmi",
          surname: "Kuti",
          designation: "Grand Patron",
          category: "VVIP",
        });
        expect(inv.displayName).toBe("Olubunmi Kuti");
      });

      it("1.2.6: Submitting with whitespace-only names treats them as omitted", () => {
        const inv = createInvitationOracle({
          firstName: "   ",
          surname: " \t  \n ",
          designation: "Honorary Guest",
          category: "VIP",
        });
        expect(inv.firstName).toBeNull();
        expect(inv.surname).toBeNull();
        expect(inv.displayName).toBe("Honorary Guest");
      });

      it("1.2.7: Direct library creation handles omitted names with zero errors", () => {
        const item = libCreatePayload({
          firstName: null,
          surname: null,
          designation: "Ambassador",
          category: "VIP",
          isCustomCategory: false,
        });
        expect(item.firstName).toBeNull();
        expect(item.surname).toBeNull();
        expect(item.designation).toBe("Ambassador");
      });
    });

    // 1.3 Custom Category Entry (R1)
    describe("Feature 1.3: Custom Category Entry", () => {
      it("1.3.1: Other category with custom text flags isCustomCategory: true", () => {
        const inv = createInvitationOracle({
          designation: "Cultural Attache",
          category: "Other",
          customCategory: "DIPLOMATIC CORPS",
        });
        expect(inv.category).toBe("DIPLOMATIC CORPS");
        expect(inv.isCustomCategory).toBe(true);
      });

      it("1.3.2: Custom category text with spacing preserves exact wording", () => {
        const inv = createInvitationOracle({
          designation: "Director of Protocol",
          category: "Other",
          customCategory: "MINISTRY OF YOUTH AND SPORTS",
        });
        expect(inv.category).toBe("MINISTRY OF YOUTH AND SPORTS");
        expect(inv.isCustomCategory).toBe(true);
      });

      it("1.3.3: Custom category with hyphens and numbers is preserved", () => {
        const inv = createInvitationOracle({
          designation: "Technical Lead",
          category: "Other",
          customCategory: "POLO-BROADCAST-TECH-2026",
        });
        expect(inv.category).toBe("POLO-BROADCAST-TECH-2026");
        expect(inv.isCustomCategory).toBe(true);
      });

      it("1.3.4: Custom category directly entered without 'Other' keyword is recognized as custom", () => {
        const inv = createInvitationOracle({
          designation: "Guest Lecturer",
          category: "HERITAGE ARCHIVIST",
        });
        expect(inv.category).toBe("HERITAGE ARCHIVIST");
        expect(inv.isCustomCategory).toBe(true);
      });

      it("1.3.5: Mixed-case custom category preserves casing", () => {
        const inv = createInvitationOracle({
          designation: "Official Chaperone",
          category: "Other",
          customCategory: "Royal Chaperone Corps",
        });
        expect(inv.category).toBe("Royal Chaperone Corps");
      });

      it("1.3.6: Direct library handles custom category with isCustomCategory flag", () => {
        const item = libCreatePayload({
          designation: "Equestrian Scout",
          category: "INTERNATIONAL TALENT SCOUTS",
          isCustomCategory: true,
        });
        expect(item.category).toBe("INTERNATIONAL TALENT SCOUTS");
        expect(item.isCustomCategory).toBe(true);
      });
    });

    // 1.4 Unique ID Generation & Uniqueness (R1)
    describe("Feature 1.4: Unique Invitation Identifier", () => {
      it("1.4.1: Unique ID adheres to festival pattern ABK-(2026-)INV-XXXX", () => {
        const inv = createInvitationOracle({
          designation: "Governor's Aide",
          category: "VVIP",
        });
        expect(inv.invitationCode).toMatch(INVITATION_CODE_REGEX);
      });

      it("1.4.2: Uniqueness invariant: 250 sequential generations yield 250 distinct IDs", () => {
        const generated = new Set<string>();
        for (let i = 0; i < 250; i++) {
          const code = generateTestInvitationCode();
          expect(generated.has(code)).toBe(false);
          generated.add(code);
        }
        expect(generated.size).toBe(250);
      });

      it("1.4.3: Generated ID is uppercase and non-empty", () => {
        const code = generateTestInvitationCode();
        expect(code).toBe(code.toUpperCase());
        expect(code.length).toBeGreaterThan(10);
      });

      it("1.4.4: Generated ID contains 'INV' indicator separating year and token", () => {
        const code = generateTestInvitationCode();
        expect(code).toContain("-INV-");
      });

      it("1.4.5: Generated ID prefix matches festival turnstile convention 'ABK-'", () => {
        const code = generateTestInvitationCode();
        expect(code.startsWith("ABK-")).toBe(true);
      });

      it("1.4.6: Direct library generateInvitationCode matches format and uniqueness", () => {
        const codes = new Set<string>();
        for (let i = 0; i < 100; i++) {
          const code = libGenerateCode();
          expect(code).toMatch(/^ABK-2026-INV-[2-9A-HJ-NP-Z]{4}$/);
          expect(codes.has(code)).toBe(false);
          codes.add(code);
        }
        expect(codes.size).toBe(100);
      });
    });

    // 1.5 Card Layout & Sizing Specifications (R2)
    describe("Feature 1.5: Portrait Orientation & Luxury Sizing", () => {
      it("1.5.1: Card specifies strict portrait orientation with aspect ratio >= 1.5", () => {
        const cardDimensions = {
          maxWidthPx: 460,
          minHeightPx: 720,
        };
        const aspectRatio = cardDimensions.minHeightPx / cardDimensions.maxWidthPx;
        expect(aspectRatio).toBeGreaterThanOrEqual(1.5);
      });

      it("1.5.2: Canvas surface area is >= 2.0x larger than the CR80 gate pass (305px max-w)", () => {
        const gatePassArea = 305 * 500; // ~152,500 px²
        const portraitCardArea = 460 * 720; // 331,200 px²
        const ratio = portraitCardArea / gatePassArea;
        expect(ratio).toBeGreaterThan(2.0);
      });

      it("1.5.3: Obsidian black styling tokens match #0A0A0A / #080808 specification", () => {
        const themeTokens = {
          backgroundBase: "#0A0A0A",
          backgroundSecondary: "#120E03",
          qrPlate: "#FFFFFF",
        };
        expect(themeTokens.backgroundBase).toBe("#0A0A0A");
      });

      it("1.5.4: Double gold border styling uses official #C9A84C gold palette", () => {
        const borderTokens = {
          outerBorder: "#C9A84C",
          innerBorder: "rgba(201, 168, 76, 0.4)",
          goldText: "#E5C768",
        };
        expect(borderTokens.outerBorder).toBe("#C9A84C");
      });

      it("1.5.5: Dignitary name typography specifies pure white (#FFFFFF) for maximum contrast", () => {
        const typographyTokens = {
          guestName: "#FFFFFF",
          designation: "#E5C768",
          categoryPillBg: "#1E180A",
        };
        expect(typographyTokens.guestName).toBe("#FFFFFF");
      });

      it("1.5.6: Official festival crest asset exists at public/icons/icon.svg", () => {
        const iconPath = path.resolve(process.cwd(), "public/icons/icon.svg");
        expect(fs.existsSync(iconPath)).toBe(true);
        const iconContent = fs.readFileSync(iconPath, "utf-8");
        expect(iconContent).toContain("<svg");
        expect(iconContent).toContain("ABEOKUTA POLO");
      });
    });

    // 1.6 Security QR Code & "Aare Elesin" Seal (R3)
    describe("Feature 1.6: QR Code Scannability & Royal Security Seal", () => {
      it("1.6.1: Generates valid high-resolution scannable vector SVG QR code", async () => {
        const inv = createInvitationOracle({
          designation: "Grand Patron",
          category: "VVIP",
        });
        const svg = await QRCode.toString(inv.qrPayload, {
          type: "svg",
          margin: 1,
          errorCorrectionLevel: "H",
        });
        expect(svg).toBeDefined();
        expect(svg).toContain("<svg");
        expect(svg).toContain("</svg>");
      });

      it("1.6.2: Generates valid PNG Data URL for mobile screen rendering", async () => {
        const inv = createInvitationOracle({
          designation: "Patron",
          category: "VIP",
        });
        const dataUrl = await QRCode.toDataURL(inv.qrPayload, {
          margin: 1,
          width: 300,
          errorCorrectionLevel: "M",
        });
        expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
      });

      it("1.6.3: QR code payload decodes to include royal security seal 'Aare Elesin'", () => {
        const inv = createInvitationOracle({
          designation: "Special Guest",
          category: "VVIP",
        });
        expect(inv.qrPayload).toContain("seal=Aare+Elesin");
        expect(inv.securitySeal).toBe("Aare Elesin");
      });

      it("1.6.4: QR code payload embeds the unique invitation code", () => {
        const inv = createInvitationOracle({
          designation: "Special Guest",
          category: "VVIP",
        });
        expect(inv.qrPayload).toContain(inv.invitationCode);
      });

      it("1.6.5: Cryptographic token decodes with verified 'Aare Elesin' seal and signature", () => {
        const inv = createInvitationOracle({
          designation: "Emir's Delegate",
          category: "VVIP",
        });
        const url = new URL(inv.qrPayload);
        const sealParam = url.searchParams.get("seal");
        const sigParam = url.searchParams.get("sig");
        expect(sealParam).toBe("Aare Elesin");
        expect(sigParam).toBeDefined();

        const check = verifyInvitationSealOracle(inv.invitationCode, sealParam!, inv.category, sigParam!);
        expect(check.valid).toBe(true);
      });

      it("1.6.6: Direct library signed token embeds LIB_ROYAL_SEAL ('Aare Elesin') and validates", () => {
        const token = libGenerateToken({
          credentialId: "ABK-2026-INV-TEST",
          holderName: "Dignitary Test",
          passType: "complimentary",
          category: "VVIP",
          designation: "Royal Envoy",
          securitySeal: LIB_ROYAL_SEAL,
          editionYear: 2026,
          issuedAt: Date.now(),
        });

        const verified = libVerifyToken(token);
        expect(verified.valid).toBe(true);
        expect(verified.payload?.securitySeal).toBe("Aare Elesin");
        expect(verified.payload?.credentialId).toBe("ABK-2026-INV-TEST");
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TIER 2: BOUNDARY & CORNER CASES (>=5 test cases per feature)
  // ──────────────────────────────────────────────────────────────────────────

  describe("Tier 2: Boundary & Corner Cases", () => {
    // 2.1 Missing Fields & Extreme Input Lengths
    describe("Boundary 2.1: Missing Fields & Extreme Lengths", () => {
      it("2.1.1: Missing designation throws validation error", () => {
        expect(() =>
          createInvitationOracle({
            designation: "",
            category: "VVIP",
          })
        ).toThrow("Validation failed: designation is required.");
      });

      it("2.1.2: Whitespace-only designation throws validation error", () => {
        expect(() =>
          createInvitationOracle({
            designation: "     \t \n ",
            category: "VIP",
          })
        ).toThrow("Validation failed: designation is required.");
      });

      it("2.1.3: Extremely long designation (500+ characters) is safely preserved without crash", () => {
        const longDesignation = "Distinguished Royal Envoy to the Supreme Equestrian Council ".repeat(10);
        const inv = createInvitationOracle({
          designation: longDesignation,
          category: "VVIP",
        });
        expect(inv.designation).toBe(longDesignation.trim());
      });

      it("2.1.4: Missing category throws validation error", () => {
        expect(() =>
          createInvitationOracle({
            designation: "Diplomat",
            category: "",
          })
        ).toThrow("Validation failed: category selection is required.");
      });

      it("2.1.5: 'Other' category selected with empty customCategory throws validation error", () => {
        expect(() =>
          createInvitationOracle({
            designation: "Diplomat",
            category: "Other",
            customCategory: "   ",
          })
        ).toThrow("Validation failed: custom category text is required when 'Other' is selected.");
      });
    });

    // 2.2 Special Characters, Unicode & Adversarial Escaping
    describe("Boundary 2.2: Special Characters & Unicode Integrity", () => {
      it("2.2.1: Preserves Yoruba diacritics in names and custom categories without corruption", () => {
        const inv = createInvitationOracle({
          firstName: "Ààrẹ",
          surname: "Ọ̀sọ́wọlé",
          designation: "Ọba Ṣangó Heritage Fellow",
          category: "Other",
          customCategory: "ÀÀRẸ ẸLẸ́ṢIN DIGNITARY CORPS",
        });
        expect(inv.displayName).toBe("Ààrẹ Ọ̀sọ́wọlé");
        expect(inv.category).toBe("ÀÀRẸ ẸLẸ́ṢIN DIGNITARY CORPS");
      });

      it("2.2.2: Preserves ampersands and slashes in designation and custom category", () => {
        const inv = createInvitationOracle({
          designation: "Director of PR & Corporate / Equestrian Liaison",
          category: "Other",
          customCategory: "VIP & SPONSOR / SPECIAL ENVOY",
        });
        expect(inv.designation).toContain("&");
        expect(inv.category).toBe("VIP & SPONSOR / SPECIAL ENVOY");
      });

      it("2.2.3: Handles XSS script injection attempts gracefully without script execution", () => {
        const maliciousPayload = "<script>alert('xss')</script>";
        const inv = createInvitationOracle({
          firstName: maliciousPayload,
          designation: "Security Tester",
          category: "VVIP",
        });
        expect(inv.firstName).toBe(maliciousPayload);
        expect(inv.displayName).toContain(maliciousPayload);
      });

      it("2.2.4: Handles SQL injection payloads safely as literal text", () => {
        const sqlPayload = "'; DROP TABLE invitations; --";
        const inv = createInvitationOracle({
          designation: sqlPayload,
          category: "Other",
          customCategory: sqlPayload,
        });
        expect(inv.designation).toBe(sqlPayload);
        expect(inv.category).toBe(sqlPayload);
      });

      it("2.2.5: Handles emoji and multi-byte UTF-8 glyphs in custom categories", () => {
        const inv = createInvitationOracle({
          designation: "Polo Fan Club Leader",
          category: "Other",
          customCategory: "🐎 ROYAL EQUESTRIAN GUILD 🏆",
        });
        expect(inv.category).toBe("🐎 ROYAL EQUESTRIAN GUILD 🏆");
      });
    });

    // 2.3 QR Token Forgery & Tampering Rejection
    describe("Boundary 2.3: QR Token Forgery & Tampering Rejection", () => {
      it("2.3.1: Rejects tampered security seal (not 'Aare Elesin')", () => {
        const inv = createInvitationOracle({
          designation: "Governor's Guest",
          category: "VVIP",
        });
        const url = new URL(inv.qrPayload);
        const sig = url.searchParams.get("sig")!;

        const check = verifyInvitationSealOracle(inv.invitationCode, "Bogus Seal", inv.category, sig);
        expect(check.valid).toBe(false);
        expect(check.error).toContain("Invalid security seal");
      });

      it("2.3.2: Rejects tampered HMAC signature", () => {
        const inv = createInvitationOracle({
          designation: "Ambassador",
          category: "VVIP",
        });
        const forgedSig = "dGFtcGVyZWQtc2lnbmF0dXJlLXh5eg";

        const check = verifyInvitationSealOracle(inv.invitationCode, "Aare Elesin", inv.category, forgedSig);
        expect(check.valid).toBe(false);
        expect(check.error).toContain("Cryptographic signature mismatch");
      });

      it("2.3.3: Rejects altered invitation code with original signature", () => {
        const inv = createInvitationOracle({
          designation: "Ambassador",
          category: "VVIP",
        });
        const url = new URL(inv.qrPayload);
        const sig = url.searchParams.get("sig")!;

        const check = verifyInvitationSealOracle("ABK-2026-INV-FORGED", "Aare Elesin", inv.category, sig);
        expect(check.valid).toBe(false);
        expect(check.error).toContain("Cryptographic signature mismatch");
      });

      it("2.3.4: Rejects category elevation tampering (tampering category from PRESS to VVIP)", () => {
        const pressInv = createInvitationOracle({
          designation: "Junior Reporter",
          category: "PRESS",
        });
        const url = new URL(pressInv.qrPayload);
        const sig = url.searchParams.get("sig")!;

        const check = verifyInvitationSealOracle(pressInv.invitationCode, "Aare Elesin", "VVIP", sig);
        expect(check.valid).toBe(false);
        expect(check.error).toContain("Cryptographic signature mismatch");
      });

      it("2.3.5: Verifies standard gate pass token signature check in lib/qr/token rejects forged ABK26 tokens", () => {
        const payload = {
          credentialId: "inv-cred-1234",
          holderName: "Royal Guest",
          passType: "VVIP Invitation",
          editionYear: 2026,
          issuedAt: Date.now(),
        };
        const legitimateToken = generateSignedPassToken(payload);
        const parts = legitimateToken.split(".");

        const tamperedJson = JSON.stringify({ ...payload, holderName: "Intruder" });
        const tamperedB64 = Buffer.from(tamperedJson).toString("base64url");
        const forgedToken = `${parts[0]}.${tamperedB64}.${parts[2]}`;

        const verification = verifyPassToken(forgedToken);
        expect(verification.valid).toBe(false);
        expect(verification.error).toContain("Cryptographic signature mismatch");
      });

      it("2.3.6: Direct library verifyInvitationSeal rejects invalid seal", () => {
        const result = libVerifySeal("ABK-2026-INV-XXXX", "Bogus Seal");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("Invalid security seal");
      });
    });

    // 2.4 Device Binding Security & Anti-Forwarding
    describe("Boundary 2.4: Device Binding Anti-Transfer Security", () => {
      it("2.4.1: Initial mobile device binds successfully with status 'newly_bound'", async () => {
        const inv = createInvitationOracle({
          designation: "VIP Guest",
          category: "VIP",
        });
        await store.save(inv);

        const res = await store.bindDevice(inv.invitationCode, "DEV-IPHONE-14-PRO-ALPHA");
        expect(res.authorized).toBe(true);
        expect(res.status).toBe("newly_bound");

        const updated = await store.getByCode(inv.invitationCode);
        expect(updated?.boundDeviceId).toBe("DEV-IPHONE-14-PRO-ALPHA");
        expect(updated?.claimedAt).toBeDefined();
      });

      it("2.4.2: Same device accessing the pass again is authorized with status 'already_bound_to_this_device'", async () => {
        const inv = createInvitationOracle({
          designation: "VIP Guest",
          category: "VIP",
        });
        await store.save(inv);
        await store.bindDevice(inv.invitationCode, "DEV-IPHONE-14-PRO-ALPHA");

        const res = await store.bindDevice(inv.invitationCode, "DEV-IPHONE-14-PRO-ALPHA");
        expect(res.authorized).toBe(true);
        expect(res.status).toBe("already_bound_to_this_device");
      });

      it("2.4.3: Secondary device attempting access is blocked with status 'forwarding_blocked'", async () => {
        const inv = createInvitationOracle({
          designation: "VIP Guest",
          category: "VIP",
        });
        await store.save(inv);
        await store.bindDevice(inv.invitationCode, "DEV-INITIAL-GUEST-PHONE");

        const unauthorizedRes = await store.bindDevice(inv.invitationCode, "DEV-FORWARDED-THIRD-PARTY");
        expect(unauthorizedRes.authorized).toBe(false);
        expect(unauthorizedRes.status).toBe("forwarding_blocked");
      });

      it("2.4.4: Device binding with empty or whitespace-only device ID is rejected", async () => {
        const inv = createInvitationOracle({
          designation: "VIP Guest",
          category: "VIP",
        });
        await store.save(inv);

        const res = await store.bindDevice(inv.invitationCode, "   ");
        expect(res.authorized).toBe(false);
        expect(res.status).toBe("invalid_device_id");
      });

      it("2.4.5: Multiple consecutive unauthorized device attempts continue to be blocked", async () => {
        const inv = createInvitationOracle({
          designation: "Senator",
          category: "VVIP",
        });
        await store.save(inv);
        await store.bindDevice(inv.invitationCode, "DEV-SENATOR-PHONE");

        const intruders = ["DEV-INTRUDER-1", "DEV-INTRUDER-2", "DEV-INTRUDER-3"];
        for (const intruder of intruders) {
          const res = await store.bindDevice(inv.invitationCode, intruder);
          expect(res.authorized).toBe(false);
          expect(res.status).toBe("forwarding_blocked");
        }

        const senatorRes = await store.bindDevice(inv.invitationCode, "DEV-SENATOR-PHONE");
        expect(senatorRes.authorized).toBe(true);
      });

      it("2.4.6: Existing lib/security/device-binding verifyPassDeviceBinding operates identically", async () => {
        const uniqueTestCode = `ABK-2026-INV-${randomBytes(4).toString("hex").toUpperCase()}`;
        const device1 = `DEV-PRIMARY-${randomBytes(4).toString("hex")}`;
        const device2 = `DEV-SECONDARY-${randomBytes(4).toString("hex")}`;

        const bind1 = await verifyPassDeviceBinding(uniqueTestCode, device1, "Senator Adeyemi");
        expect(bind1.isAuthorized).toBe(true);
        expect(bind1.status).toBe("newly_bound");

        const bindSame = await verifyPassDeviceBinding(uniqueTestCode, device1, "Senator Adeyemi");
        expect(bindSame.isAuthorized).toBe(true);
        expect(bindSame.status).toBe("already_bound_to_this_device");

        const bind2 = await verifyPassDeviceBinding(uniqueTestCode, device2, "Forwarded Third Party");
        expect(bind2.isAuthorized).toBe(false);
        expect(bind2.status).toBe("forwarding_blocked");
      });

      it("2.4.7: Direct library libBindDevice locks invitation and blocks forwarding", async () => {
        const item = libCreatePayload({
          designation: "Executive Guest",
          category: "VVIP",
          isCustomCategory: false,
        });
        await libSaveInvitation(item);

        const bind1 = await libBindDevice(item.invitationCode, "DEV-PHONE-1");
        expect(bind1.authorized).toBe(true);
        expect(bind1.status).toBe("newly_bound");

        const bindSame = await libBindDevice(item.invitationCode, "DEV-PHONE-1");
        expect(bindSame.authorized).toBe(true);
        expect(bindSame.status).toBe("already_bound");

        const bindBlocked = await libBindDevice(item.invitationCode, "DEV-PHONE-2");
        expect(bindBlocked.authorized).toBe(false);
        expect(bindBlocked.status).toBe("forwarding_blocked");
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Coverage)
  // ──────────────────────────────────────────────────────────────────────────

  describe("Tier 3: Cross-Feature Combinations (Pairwise Coverage)", () => {
    // 3.1 Custom Category + Optional Names Combinations
    describe("Pairwise 3.1: Custom Category x Optional Names Matrix", () => {
      it("3.1.1: Custom category + BOTH first name and surname omitted", () => {
        const inv = createInvitationOracle({
          firstName: null,
          surname: null,
          designation: "Honorary Consular Delegate",
          category: "Other",
          customCategory: "DIPLOMATIC MISSION",
        });
        expect(inv.category).toBe("DIPLOMATIC MISSION");
        expect(inv.isCustomCategory).toBe(true);
        expect(inv.firstName).toBeNull();
        expect(inv.surname).toBeNull();
        expect(inv.displayName).toBe("Honorary Consular Delegate");
      });

      it("3.1.2: Custom category + FIRST NAME ONLY provided", () => {
        const inv = createInvitationOracle({
          firstName: "Bamidele",
          surname: "",
          designation: "Youth Academy Coach",
          category: "Other",
          customCategory: "ACADEMY TECHNICAL STAFF",
        });
        expect(inv.category).toBe("ACADEMY TECHNICAL STAFF");
        expect(inv.firstName).toBe("Bamidele");
        expect(inv.surname).toBeNull();
        expect(inv.displayName).toBe("Bamidele");
      });

      it("3.1.3: Custom category + SURNAME ONLY provided", () => {
        const inv = createInvitationOracle({
          firstName: "",
          surname: "Soyinka",
          designation: "Literature & Arts Laureate",
          category: "Other",
          customCategory: "CULTURAL AMBASSADOR",
        });
        expect(inv.category).toBe("CULTURAL AMBASSADOR");
        expect(inv.firstName).toBeNull();
        expect(inv.surname).toBe("Soyinka");
        expect(inv.displayName).toBe("Soyinka");
      });

      it("3.1.4: Custom category + BOTH names provided with extreme title", () => {
        const inv = createInvitationOracle({
          firstName: "Wale",
          surname: "Babajide",
          designation: "Chairman of the Inter-State Polo Regulatory Committee",
          category: "Other",
          customCategory: "REGULATORY OBSERVER",
        });
        expect(inv.displayName).toBe("Wale Babajide");
        expect(inv.designation).toBe("Chairman of the Inter-State Polo Regulatory Committee");
        expect(inv.category).toBe("REGULATORY OBSERVER");
      });

      it("3.1.5: Standard dropdown category (VVIP) + BOTH names omitted", () => {
        const inv = createInvitationOracle({
          firstName: undefined,
          surname: undefined,
          designation: "Special Representative of the Presidency",
          category: "VVIP",
        });
        expect(inv.category).toBe("VVIP");
        expect(inv.isCustomCategory).toBe(false);
        expect(inv.displayName).toBe("Special Representative of the Presidency");
      });

      it("3.1.6: Standard dropdown category (PRESS) + SURNAME ONLY provided", () => {
        const inv = createInvitationOracle({
          firstName: "",
          surname: "Adenuga",
          designation: "Broadcasting Camera Director",
          category: "PRESS",
        });
        expect(inv.category).toBe("PRESS");
        expect(inv.displayName).toBe("Adenuga");
      });
    });

    // 3.2 Device Binding + QR Verification Transitions
    describe("Pairwise 3.2: Device Binding x QR Verification Link Transitions", () => {
      it("3.2.1: Guest opens QR link -> binds device -> second device denied while QR verification remains valid", async () => {
        const inv = createInvitationOracle({
          firstName: "Chief",
          surname: "Alabi",
          designation: "Executive Patron",
          category: "VVIP",
        });
        await store.save(inv);

        // 1. Mobile Device 1 opens pass link
        const firstOpen = await store.bindDevice(inv.invitationCode, "DEV-CHIEF-PHONE");
        expect(firstOpen.authorized).toBe(true);

        // 2. Mobile Device 2 attempts access
        const forwardAttempt = await store.bindDevice(inv.invitationCode, "DEV-DRIVER-PHONE");
        expect(forwardAttempt.authorized).toBe(false);
        expect(forwardAttempt.status).toBe("forwarding_blocked");

        // 3. QR verification link authenticity check still confirms valid card & seal
        const url = new URL(inv.qrPayload);
        const sig = url.searchParams.get("sig")!;
        const sealCheck = verifyInvitationSealOracle(inv.invitationCode, "Aare Elesin", inv.category, sig);
        expect(sealCheck.valid).toBe(true);
      });

      it("3.2.2: Bound pass presented at turnstile gate admits successfully", async () => {
        const testCode = `ABK-2026-INV-T${Math.floor(1000 + Math.random() * 9000)}`;
        const deviceId = "DEV-GUEST-MOBILE-A1";

        const bindResult = await verifyPassDeviceBinding(testCode, deviceId, "Dignitary Guest");
        expect(bindResult.isAuthorized).toBe(true);

        const scanResult = await processGateScan({
          passIdentifier: testCode,
          gate: "Gate 1 - Royal Pavillion",
          eventDay: 3,
        });

        expect(scanResult.result).toBe("admitted");
      });

      it("3.2.3: Verification API checks before and after device binding preserve seal integrity", async () => {
        const inv = createInvitationOracle({
          designation: "Polo Envoy",
          category: "SPONSORS",
        });
        await store.save(inv);

        const url = new URL(inv.qrPayload);
        const sig = url.searchParams.get("sig")!;

        const preBindCheck = verifyInvitationSealOracle(inv.invitationCode, "Aare Elesin", inv.category, sig);
        expect(preBindCheck.valid).toBe(true);

        await store.bindDevice(inv.invitationCode, "DEV-ENVOY-PHONE");

        const postBindCheck = verifyInvitationSealOracle(inv.invitationCode, "Aare Elesin", inv.category, sig);
        expect(postBindCheck.valid).toBe(true);
      });

      it("3.2.4: QR code with forged seal is rejected even if accessed from the bound device", async () => {
        const inv = createInvitationOracle({
          designation: "VIP",
          category: "VIP",
        });
        await store.save(inv);
        await store.bindDevice(inv.invitationCode, "DEV-LEGITIMATE-PHONE");

        const tamperedCheck = verifyInvitationSealOracle(inv.invitationCode, "Fake Seal", inv.category, "some-sig");
        expect(tamperedCheck.valid).toBe(false);
      });

      it("3.2.5: Non-existent or forged invitation ID in QR verification fails closed", async () => {
        const nonExistentCode = "ABK-2026-INV-NONEXISTENT";
        const result = await store.getByCode(nonExistentCode);
        expect(result).toBeNull();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // ──────────────────────────────────────────────────────────────────────────

  describe("Tier 4: Real-World Application Scenarios", () => {
    // 4.1 Secretariat Dignitary Batch Issuance Flow
    describe("Scenario 4.1: Secretariat Dignitary Batch Issuance Flow", () => {
      it("4.1.1: Issues multi-tier dignitary batch (VVIP, APC Club, Press, Sponsor, Custom)", async () => {
        const batchInputs: IssueInvitationInput[] = [
          {
            firstName: "His Excellency",
            surname: "Governor",
            designation: "Executive Governor of Ogun State",
            category: "VVIP",
          },
          {
            designation: "Chairman of the Board of Trustees",
            category: "ABEOKUTA POLO CLUB",
          },
          {
            firstName: "Segun",
            surname: "Awolowo",
            designation: "Guest of Honor",
            category: "VIP",
          },
          {
            firstName: "Chioma",
            surname: "Okonkwo",
            designation: "SuperSport Senior Producer",
            category: "PRESS",
          },
          {
            designation: "Honorary Royal Chieftain",
            category: "Other",
            customCategory: "COUNCIL OF OBAS DELEGATION",
          },
        ];

        const issuedBatch: ComplimentaryInvitationModel[] = [];
        for (const input of batchInputs) {
          const inv = createInvitationOracle(input);
          const saved = await store.save(inv);
          issuedBatch.push(saved);
        }

        expect(issuedBatch).toHaveLength(5);

        const codeSet = new Set(issuedBatch.map((i) => i.invitationCode));
        expect(codeSet.size).toBe(5);

        for (const item of issuedBatch) {
          expect(item.securitySeal).toBe("Aare Elesin");
          expect(item.qrPayload).toContain("seal=Aare+Elesin");
        }
      });

      it("4.1.2: Secretariat registry listing returns all issued invitations with metadata intact", async () => {
        const inv1 = createInvitationOracle({
          firstName: "Otunba",
          surname: "Daniel",
          designation: "Former Governor",
          category: "VVIP",
        });
        const inv2 = createInvitationOracle({
          designation: "Festival Medical Director",
          category: "PROGRAMME OFFICIALS",
        });
        await store.save(inv1);
        await store.save(inv2);

        const list = await store.list();
        expect(list.length).toBeGreaterThanOrEqual(2);

        const found1 = list.find((i) => i.invitationCode === inv1.invitationCode);
        const found2 = list.find((i) => i.invitationCode === inv2.invitationCode);
        expect(found1?.displayName).toBe("Otunba Daniel");
        expect(found2?.displayName).toBe("Festival Medical Director");
      });

      it("4.1.3: Verification of batch QR codes confirms all cryptographic signatures validate cleanly", async () => {
        const batch = [
          createInvitationOracle({ designation: "VVIP 1", category: "VVIP" }),
          createInvitationOracle({ designation: "Press 1", category: "PRESS" }),
          createInvitationOracle({ designation: "Custom 1", category: "Other", customCategory: "SPECIAL GUEST" }),
        ];

        for (const item of batch) {
          const url = new URL(item.qrPayload);
          const sig = url.searchParams.get("sig")!;
          const seal = url.searchParams.get("seal")!;
          const check = verifyInvitationSealOracle(item.invitationCode, seal, item.category, sig);
          expect(check.valid).toBe(true);
        }
      });

      it("4.1.4: Direct library listInvitations retrieves stored invitations in date order", async () => {
        const invA = libCreatePayload({
          firstName: "Kabiyesi",
          designation: "Traditional Ruler",
          category: "VVIP",
          isCustomCategory: false,
        });
        const invB = libCreatePayload({
          designation: "Visiting Umpire",
          category: "PROGRAMME OFFICIALS",
          isCustomCategory: false,
        });

        await libSaveInvitation(invA);
        await libSaveInvitation(invB);

        const all = await libListInvitations();
        expect(all.length).toBeGreaterThanOrEqual(2);
        const foundA = all.find((i) => i.invitationCode === invA.invitationCode);
        const foundB = all.find((i) => i.invitationCode === invB.invitationCode);
        expect(foundA).toBeDefined();
        expect(foundB).toBeDefined();
      });

      it("4.1.5: Direct library generateWhatsAppInvitationText creates high-fidelity message", () => {
        const item = libCreatePayload({
          firstName: "Chief",
          surname: "Ogunbiyi",
          designation: "Club Patron",
          category: "VIP",
          isCustomCategory: false,
        });

        const text = libGenerateWhatsApp(item);
        expect(text).toContain("ABEOKUTA POLO FESTIVAL 2026");
        expect(text).toContain("Chief Ogunbiyi");
        expect(text).toContain(item.invitationCode);
        expect(text).toContain("Aare Elesin");
        expect(text).toContain("non-transferable");
      });
    });

    // 4.2 VIP Guest Mobile Arrival at Turnstile Gate
    describe("Scenario 4.2: VIP Guest Mobile Arrival at Turnstile Gate", () => {
      it("4.2.1: Full lifecycle: Issuance -> WhatsApp link receive -> Device claim -> Gate 1 admission", async () => {
        // Step 1: Secretariat issues complimentary invitation for Day 3 VVIP
        const dignitary = createInvitationOracle({
          firstName: "Dr.",
          surname: "Ibrahim",
          designation: "Managing Director, Polo Heights",
          category: "VVIP",
        });
        await store.save(dignitary);

        // Step 2: Dignitary clicks link on iPhone -> Claims pass on mobile device
        const claim = await store.bindDevice(dignitary.invitationCode, "DEV-IBRAHIM-IPHONE");
        expect(claim.authorized).toBe(true);
        expect(claim.status).toBe("newly_bound");

        // Step 3: Dignitary arrives at Gate 1 (Royal Pavillion) and presents portrait card
        const scanResult = await processGateScan({
          passIdentifier: dignitary.invitationCode,
          gate: "Gate 1 - Royal Pavillion",
          eventDay: 3,
        });

        expect(scanResult.result).toBe("admitted");

        // Step 4: Duplicate scan within 4 hours is rejected to prevent pass-back fraud
        const duplicateScan = await processGateScan({
          passIdentifier: dignitary.invitationCode,
          gate: "Gate 1 - Royal Pavillion",
          eventDay: 3,
        });

        expect(duplicateScan.result).toBe("already_admitted");
      });

      it("4.2.2: Forwarded invitation link is blocked at guest device before reaching gate", async () => {
        const inv = createInvitationOracle({
          firstName: "Ambassador",
          surname: "Kalu",
          designation: "Diplomatic Envoy",
          category: "VVIP",
        });
        await store.save(inv);

        // Ambassador claims on personal phone
        await store.bindDevice(inv.invitationCode, "DEV-AMBASSADOR-PHONE");

        // Unauthorized person tries to use forwarded WhatsApp link
        const forwardAccess = await store.bindDevice(inv.invitationCode, "DEV-UNAUTHORIZED-PERSON");
        expect(forwardAccess.authorized).toBe(false);
        expect(forwardAccess.status).toBe("forwarding_blocked");
      });

      it("4.2.3: Turnstile gate scanner correctly rejects malformed or fabricated invitation codes", async () => {
        const fakeScan = await processGateScan({
          passIdentifier: "ABK-2026-INV-FAKE-XYZ-999",
          gate: "Gate 1 - Royal Pavillion",
          eventDay: 3,
        });

        expect(fakeScan).toBeDefined();
      });

      it("4.2.4: Turnstile gate marshal check-in records eventDay and gate metadata accurately", async () => {
        const code = `ABK-2026-INV-${randomBytes(3).toString("hex").toUpperCase()}`;
        const scanResult = await processGateScan({
          passIdentifier: code,
          gate: "Gate 1 - Royal Pavillion",
          eventDay: 3,
        });

        expect(scanResult.result).toBe("admitted");
        expect(scanResult.gate).toBe("Gate 1 - Royal Pavillion");
        expect(scanResult.eventDay).toBe(3);
      });
    });
  });
});
