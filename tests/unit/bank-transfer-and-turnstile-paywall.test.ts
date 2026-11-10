import { describe, expect, it } from "vitest";
import { submitRegistration } from "@/app/(public)/register/actions";
import { isPassPendingVerification, registerUnverifiedPasses } from "@/lib/storage/unverified-passes";
import { generateOfflinePassHtml } from "@/lib/storage/pass-storage";

describe("Bank Transfer & Turnstile Paywall Hardening", () => {
  it("Day 1 & Day 2 registration issues 100% complimentary active passes", async () => {
    const res = await submitRegistration({
      firstName: "Heritage",
      lastName: "Visitor",
      email: "visitor@example.com",
      phone: "+2348031234567",
      day1: true,
      day2: true,
      day3: false,
    });

    expect(res.success).toBe(true);
    expect(res.passes).toBeDefined();
    // Day 1 and Day 2 are never combined; 2 distinct passes issued
    expect(res.passes!.length).toBe(2);

    const pass1 = res.passes![0];
    expect(pass1.daysCovered).toEqual([1]);
    expect(pass1.isVvip).toBe(false);
    expect(pass1.day1Status).toBe("free_admitted");

    const pass2 = res.passes![1];
    expect(pass2.daysCovered).toEqual([2]);
    expect(pass2.isVvip).toBe(false);
    expect(pass2.day2Status).toBe("free_admitted");
  });

  it("Day 3 bank transfer registration strictly issues a provisional claim slip in pending_verification status", async () => {
    const res = await submitRegistration({
      firstName: "Chief",
      lastName: "WirePayer",
      email: "wire@example.com",
      phone: "+2348039998877",
      day1: false,
      day2: false,
      day3: true,
      day3TicketCount: 1,
      paymentMethod: "bank_transfer",
      bankTransferRef: "ABK-WEMA-TEST-001",
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe("pending_verification");
    expect(res.paymentMethod).toBe("bank_transfer");
    expect(res.bankTransferRef).toBe("ABK-WEMA-TEST-001");
    expect(res.passes).toBeDefined();
    expect(res.passes!.length).toBe(1);

    const provPass = res.passes![0];
    // Must NOT be active VVIP
    expect(provPass.isVvip).toBe(false);
    expect(provPass.status).toBe("pending_verification");
    expect(provPass.day3Status).toBe("pending_verification");
    expect(provPass.category).toContain("Provisional Claim (Pending Bursary Verification)");
    expect(provPass.bankTransferRef).toBe("ABK-WEMA-TEST-001");
  });

  it("registers bank transfer pass codes in unverified registry and prevents active clearance", async () => {
    const passCode = "ABK-2026-VVIP-TEST-UNVERIFIED";
    registerUnverifiedPasses([passCode]);
    expect(isPassPendingVerification(passCode)).toBe(true);
  });

  it("watermarks offline downloadable HTML card as PROVISIONAL CLAIM SLIP when pending verification", () => {
    const offlineHtml = generateOfflinePassHtml({
      passCode: "ABK-2026-VVIP-CLAIM99",
      holderName: "Alhaji Tester",
      category: "Day 3 VVIP Provisional Claim (Pending Bursary Verification)",
      affiliationType: "individual",
      status: "pending_verification",
      daysCovered: [3],
      isVvip: false,
      designTheme: "gold",
      registeredAt: new Date().toISOString(),
    });

    expect(offlineHtml).toContain("PROVISIONAL BANK CLAIM SLIP");
    expect(offlineHtml).toContain("PENDING BURSARY VERIFICATION · NOT VALID FOR GATE ENTRY");
    expect(offlineHtml).toContain("NOT VALID FOR GATE ENTRY");
    // Must NOT claim royal admission
    expect(offlineHtml).not.toContain("👑 VVIP ACTIVE STATUS · ROYAL ADMISSION");
  });
});

