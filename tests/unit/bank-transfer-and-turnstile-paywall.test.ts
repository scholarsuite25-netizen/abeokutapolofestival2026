import { describe, expect, it } from "vitest";
import { submitRegistration, submitTableRegistration } from "@/app/(public)/register/actions";
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
    // Anyone who chooses to attend day one and two together gets one combined pass
    expect(res.passes!.length).toBe(1);

    const dualPass = res.passes![0];
    expect(dualPass.category).toBe("Day 1 & Day 2 Dual Pass");
    expect(dualPass.daysCovered).toEqual([1, 2]);
    expect(dualPass.isVvip).toBe(false);
    expect(dualPass.day1Status).toBe("free_admitted");
    expect(dualPass.day2Status).toBe("free_admitted");
  });

  it("Day 3 bank transfer table booking strictly issues provisional claim slips in pending_verification status", async () => {
    const res = await submitTableRegistration({
      packageId: "individual_vip",
      tableSerial: "Regular Pass 01",
      buyerFirstName: "Chief",
      buyerLastName: "WirePayer",
      buyerEmail: "wire@example.com",
      buyerPhone: "+2348039998877",
      paymentMethod: "bank_transfer",
      bankTransferRef: "ABK-WEMA-TEST-001",
      attendees: [{ seat: 1, name: "Chief WirePayer" }],
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe("pending_bank_verification");
    expect(res.paymentMethod).toBe("bank_transfer");
    expect(res.bankTransferRef).toBe("ABK-WEMA-TEST-001");
    expect(res.passes).toBeDefined();
    expect(res.passes!.length).toBe(1);

    const provPass = res.passes![0];
    // Must NOT be active VVIP
    expect(provPass.isVvip).toBe(false);
    expect(provPass.status).toBe("pending_verification");
    expect(provPass.day3Status).toBe("pending_verification");
    expect(provPass.category).toContain("Provisional");
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
      category: "Day 3 VVIP Provisional Claim (Pending Accounts Verification)",
      affiliationType: "individual",
      status: "pending_verification",
      daysCovered: [3],
      isVvip: false,
      designTheme: "gold",
      registeredAt: new Date().toISOString(),
    });

    expect(offlineHtml).toContain("PROVISIONAL BANK CLAIM SLIP");
    expect(offlineHtml).toContain("PENDING ACCOUNTS VERIFICATION · NOT VALID FOR GATE ENTRY");
    expect(offlineHtml).toContain("NOT VALID FOR GATE ENTRY");
    // Must NOT claim royal admission
    expect(offlineHtml).not.toContain("👑 VVIP ACTIVE STATUS · ROYAL ADMISSION");
  });
});

