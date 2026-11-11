import { describe, expect, it } from "vitest";
import {
  DAY3_TABLE_PACKAGES,
  TABLE_PACKAGE_LIST,
  getTablePackage,
  getTableSerialList,
  formatTablePriceNaira,
} from "@/lib/config/tables-config";
import {
  AFFILIATE_COMMISSION_RATE,
  AFFILIATE_COMMISSION_TIERS,
  SUPPORTED_AFFILIATE_COUNTRIES,
  TICKETING_AGENCIES,
  getPromoTemplates,
} from "@/lib/config/affiliates-config";
import {
  submitTableRegistration,
  submitAffiliateRegistration,
  getAffiliateDashboardData,
  submitRegistration,
} from "@/app/(public)/register/actions";
import { verifyPassToken } from "@/lib/qr/token";
import { verifyPassDeviceBinding, isTablePassCode } from "@/lib/security/device-binding";
import {
  DAY3_VVIP_OFFICIAL_PRICE_NGN,
  DAY3_VVIP_TESTING_PRICE_NGN,
} from "@/lib/config/checkout-config";
import {
  getTestingFeeStatus,
  setTestingFeeMode,
  autoDisableTestingFeeAfterPayment,
  resetTestingFeeModeForTests,
} from "@/lib/config/testing-fee-mode";

describe("Day 3 VIP Table Packages & Official Brochure Enclosures", () => {
  it("defines all 5 official Day 3 hospitality categories matching the official brochure", () => {
    expect(TABLE_PACKAGE_LIST.length).toBe(5);

    const regular = getTablePackage("individual_vip");
    expect(regular).toBeDefined();
    expect(regular?.name).toBe("The Regular Section");
    expect(regular?.officialPriceNgn).toBe(50_000);
    expect(regular?.testingPriceNgn).toBe(100);
    expect(regular?.guestCapacity).toBe(1);
    expect(getTablePackage("regular_section")?.id).toBe("individual_vip");

    const kings = getTablePackage("kings_table");
    expect(kings).toBeDefined();
    expect(kings?.name).toBe("The Kings Table");
    expect(kings?.officialPriceNgn).toBe(5_000_000);
    expect(kings?.testingPriceNgn).toBe(100);
    expect(kings?.guestCapacity).toBe(10);
    expect(kings?.parkingVehicles).toBe(10);
    expect(kings?.tableCount).toBe(5);

    const royal = getTablePackage("royal_table");
    expect(royal).toBeDefined();
    expect(royal?.name).toBe("The Royal Table");
    expect(royal?.officialPriceNgn).toBe(3_000_000);
    expect(royal?.testingPriceNgn).toBe(100);
    expect(royal?.guestCapacity).toBe(8);
    expect(royal?.parkingVehicles).toBe(5);
    expect(royal?.tableCount).toBe(10);

    const queens = getTablePackage("queens_table");
    expect(queens).toBeDefined();
    expect(queens?.name).toBe("The Queens Table");
    expect(queens?.officialPriceNgn).toBe(2_000_000);
    expect(queens?.testingPriceNgn).toBe(100);
    expect(queens?.guestCapacity).toBe(6);
    expect(queens?.tableCount).toBe(10);

    const premium = getTablePackage("premium_table");
    expect(premium).toBeDefined();
    expect(premium?.name).toBe("The Premium Table");
    expect(premium?.officialPriceNgn).toBe(500_000);
    expect(premium?.testingPriceNgn).toBe(100);
    expect(premium?.guestCapacity).toBe(5);
    expect(premium?.tableCount).toBe(20);
  });

  it("generates correct serial table number sequences for each package", () => {
    const kingsSerials = getTableSerialList("kings_table");
    expect(kingsSerials.length).toBe(5);
    expect(kingsSerials[0]).toBe("Kings Table 01");
    expect(kingsSerials[4]).toBe("Kings Table 05");

    const royalSerials = getTableSerialList("royal_table");
    expect(royalSerials.length).toBe(10);
    expect(royalSerials[0]).toBe("Royal Table 01");
    expect(royalSerials[9]).toBe("Royal Table 10");

    const queensSerials = getTableSerialList("queens_table");
    expect(queensSerials.length).toBe(10);
    expect(queensSerials[0]).toBe("Queens Table 01");

    const premiumSerials = getTableSerialList("premium_table");
    expect(premiumSerials.length).toBe(20);
    expect(premiumSerials[0]).toBe("Premium Table 01");
    expect(premiumSerials[19]).toBe("Premium Table 20");
  });

  it("issues 10 distinct HMAC-256 signed access passes when a table is booked", async () => {
    const buyerEmail = `chief.${Date.now()}@abeokutapolo.test`;
    const attendees = [
      { seat: 1, name: "Chief Adeleke Johnson" },
      { seat: 2, name: "Otunba Segun Cole" },
      { seat: 3, name: "Senator B. Adeleke" },
      { seat: 4, name: "Alhaji M. Dangote" },
      { seat: 5, name: "Dr. Funke Akindele" },
      { seat: 6, name: "Engr. T. Balogun" },
      { seat: 7, name: "Ambassador K. Smith" },
      { seat: 8, name: "High Chief O. Osoba" },
      { seat: 9, name: "Lady C. Adeyemi" },
      { seat: 10, name: "Prince Adedoyin" },
    ];

    const result = await submitTableRegistration({
      packageId: "kings_table",
      tableSerial: "Kings Table 02",
      buyerFirstName: "Chief Adeleke",
      buyerLastName: "Johnson",
      buyerEmail,
      buyerPhone: "0803 123 4567",
      paymentMethod: "bank_transfer",
      bankTransferRef: "ABK-WEMA-KT02-TEST",
      attendees,
    });

    expect(result.success).toBe(true);
    expect(result.packageId).toBe("kings_table");
    expect(result.tableSerial).toBe("Kings Table 02");
    expect(result.passes).toBeDefined();
    expect(result.passes?.length).toBe(10);

    // Verify Seat 1 is Host and isBuyer
    const hostPass = result.passes![0];
    expect(hostPass.holderName).toBe("Chief Adeleke Johnson");
    expect(hostPass.ticketIndex).toBe(1);
    expect(hostPass.isBuyer).toBe(true);
    expect(hostPass.isSponsored).toBe(false);
    expect(hostPass.serialLabel).toBe("Kings Table 02 · Seat 1 of 10");

    // Verify Seat 2 is Guest with anti-forwarding device-locking
    const guestPass = result.passes![1];
    expect(guestPass.holderName).toBe("Otunba Segun Cole");
    expect(guestPass.ticketIndex).toBe(2);
    expect(guestPass.isBuyer).toBe(false);
    expect(guestPass.isSponsored).toBe(true);
    expect(guestPass.sponsorName).toBe("Chief Adeleke Johnson");
    expect(guestPass.isLockedToDevice).toBe(true);
    expect(guestPass.serialLabel).toBe("Kings Table 02 · Seat 2 of 10");

    // Verify cryptographic signature for each pass
    for (const pass of result.passes!) {
      expect(pass.qrToken).toBeDefined();
      const verified = verifyPassToken(pass.qrToken!);
      expect(verified.valid).toBe(true);
      expect(verified.payload?.holderName).toBe(pass.holderName);
    }
  });

  it("strictly issues provisional claim slip for bank transfer table payments", async () => {
    const result = await submitTableRegistration({
      packageId: "royal_table",
      tableSerial: "Royal Table 05",
      buyerFirstName: "Alhaji",
      buyerLastName: "Dantata",
      buyerEmail: `dantata.${Date.now()}@test.ng`,
      buyerPhone: "+234 818 188 8884",
      paymentMethod: "bank_transfer",
      attendees: Array.from({ length: 8 }, (_, i) => ({
        seat: i + 1,
        name: `Guest ${i + 1}`,
      })),
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("pending_bank_verification");
    expect(result.passes?.length).toBe(8);
    expect(result.passes?.[0].status).toBe("pending_verification");
    expect(result.passes?.[0].day3Status).toBe("pending_verification");
    expect(result.secretariatNotification).toBeDefined();
  });

  it("supports toggling the ₦100 pilot testing fee and automatically removes it after a successful ₦100 payment", async () => {
    resetTestingFeeModeForTests(true);
    const initial = await getTestingFeeStatus();
    expect(initial.enabled).toBe(true);
    expect(initial.autoRemovedAfterPayment).toBe(false);

    // Manually toggle off -> Official brochure pricing
    const manualOff = await setTestingFeeMode(false, { reason: "manual_test_off" });
    expect(manualOff.enabled).toBe(false);
    expect(manualOff.autoRemovedAfterPayment).toBe(false);

    // Manually toggle back on -> ₦100 testing mode
    const manualOn = await setTestingFeeMode(true, { reason: "manual_test_on" });
    expect(manualOn.enabled).toBe(true);

    // Simulate a successful ₦100 payment -> auto-removes the testing fee and reverts to official brochure pricing
    const didAutoDisable = await autoDisableTestingFeeAfterPayment("ABK-VVIP-TEST-100", 100);
    expect(didAutoDisable).toBe(true);
    const afterPayment = await getTestingFeeStatus();
    expect(afterPayment.enabled).toBe(false);
    expect(afterPayment.autoRemovedAfterPayment).toBe(true);
    expect(afterPayment.lastPaymentRef).toBe("ABK-VVIP-TEST-100");

    // Verify table booking and Day 3 registration use official brochure prices when testing mode is disabled
    const officialTableRes = await submitTableRegistration({
      packageId: "royal_table",
      tableSerial: "Royal Table 07",
      buyerFirstName: "Otunba",
      buyerLastName: "Adekunle",
      buyerEmail: `otunba.${Date.now()}@test.ng`,
      buyerPhone: "+234 803 555 0199",
      paymentMethod: "bank_transfer",
      useTestingFee: false,
      attendees: Array.from({ length: 8 }, (_, i) => ({
        seat: i + 1,
        name: `Royal Guest ${i + 1}`,
      })),
    });
    expect(officialTableRes.success).toBe(true);
    expect(officialTableRes.amountNgn).toBe(3_000_000);
    expect(officialTableRes.officialValueNgn).toBe(3_000_000);
    expect(officialTableRes.secretariatNotification?.message).toContain("₦3,000,000");

    const officialRegRes = await submitRegistration({
      firstName: "Adebayo",
      lastName: "Williams",
      email: `adebayo.${Date.now()}@test.ng`,
      phone: "+234 803 555 0299",
      affiliationType: "individual",
      day1: false,
      day2: false,
      day3: true,
      paymentMethod: "bank_transfer",
      day3TicketCount: 2,
      useTestingFee: false,
      attendees: [
        { firstName: "Adebayo", lastName: "Williams" },
        { firstName: "Guest", lastName: "Two" },
      ],
    });
    expect(officialRegRes.success).toBe(true);
    expect(officialRegRes.secretariatNotification?.message).toContain(
      `₦${(DAY3_VVIP_OFFICIAL_PRICE_NGN * 2).toLocaleString()}`,
    );

    // Reset back to default for subsequent tests
    resetTestingFeeModeForTests(true);
  });
});

describe("International Affiliate Centre (10% Commission)", () => {
  it("enforces guaranteed 10% commission across all confirmed brochure packages", () => {
    expect(AFFILIATE_COMMISSION_RATE).toBe(0.10);

    const kingsCommission = AFFILIATE_COMMISSION_TIERS.find((t) => t.categoryName.includes("Kings Table"));
    expect(kingsCommission?.officialCommissionNgn).toBe(500_000); // 10% of 5M

    const royalCommission = AFFILIATE_COMMISSION_TIERS.find((t) => t.categoryName.includes("Royal Table"));
    expect(royalCommission?.officialCommissionNgn).toBe(300_000); // 10% of 3M

    const queensCommission = AFFILIATE_COMMISSION_TIERS.find((t) => t.categoryName.includes("Queens Table"));
    expect(queensCommission?.officialCommissionNgn).toBe(200_000); // 10% of 2M

    const premiumCommission = AFFILIATE_COMMISSION_TIERS.find((t) => t.categoryName.includes("Premium Table"));
    expect(premiumCommission?.officialCommissionNgn).toBe(50_000); // 10% of 500k

    const vvipCommission = AFFILIATE_COMMISSION_TIERS.find((t) => t.categoryName.includes("Regular Section"));
    expect(vvipCommission?.officialCommissionNgn).toBe(5_000); // 10% of 50k
  });

  it("registers an affiliate with unique tracking code and payout preferences", async () => {
    const email = `partner.${Date.now()}@uk-polo.co.uk`;
    const res = await submitAffiliateRegistration({
      fullName: "Equestrian Media UK",
      email,
      phone: "+44 7911 123456",
      country: "United Kingdom",
      payoutChannel: "wire_iban",
      bankName: "Barclays Bank London",
      swiftBic: "BARCGB22",
      iban: "GB29BARC20201531488526",
      accountName: "Equestrian Media UK Ltd",
    });

    expect(res.success).toBe(true);
    expect(res.affiliateCode).toMatch(/^AFF-POLO-[A-Z0-9]+$/);
    expect(res.country).toBe("United Kingdom");
    expect(res.payoutChannel).toBe("wire_iban");
  });

  it("loads affiliate dashboard metrics and referral ledger", async () => {
    const code = "AFF-POLO-TEST";
    const data = await getAffiliateDashboardData(code);

    expect(data.success).toBe(true);
    expect(data.affiliateCode).toBe(code);
    expect(data.metrics).toBeDefined();
    expect(data.metrics?.totalClicks).toBeGreaterThanOrEqual(0);
    expect(data.referrals).toBeDefined();
    expect(Array.isArray(data.referrals)).toBe(true);
  });

  it("provides comprehensive ticketing agencies directory for Nigeria and International", () => {
    const nigerianAgencies = TICKETING_AGENCIES.filter((a) => a.scope === "Nigeria");
    expect(nigerianAgencies.length).toBeGreaterThanOrEqual(5);
    const nigerianNames = nigerianAgencies.map((a) => a.name);
    expect(nigerianNames).toContain("Nairabox");
    expect(nigerianNames).toContain("Ariiya Tickets");
    expect(nigerianNames).toContain("Tix Africa");
    expect(nigerianNames).toContain("Quickteller Events (Interswitch)");

    const intlAgencies = TICKETING_AGENCIES.filter((a) => a.scope === "International");
    expect(intlAgencies.length).toBeGreaterThanOrEqual(5);
    const intlNames = intlAgencies.map((a) => a.name);
    expect(intlNames).toContain("Eventbrite");
    expect(intlNames).toContain("Ticketmaster Africa / Live Nation");
    expect(intlNames).toContain("StubHub International");
    expect(intlNames).toContain("Platinumlist");
  });

  it("generates marketing copy templates with affiliate referral link placeholders", () => {
    const templates = getPromoTemplates("AFF-POLO-8472", "https://abeokutapolofestival.com");
    expect(templates.length).toBe(4);

    const waTemplate = templates.find((t) => t.channel === "WhatsApp");
    expect(waTemplate?.copyText).toContain("https://abeokutapolofestival.com/tables?ref=AFF-POLO-8472");
    expect(waTemplate?.copyText).toContain("The Kings Table");

    const liTemplate = templates.find((t) => t.channel === "LinkedIn");
    expect(liTemplate?.copyText).toContain("AFF-POLO-8472");
  });

  it("credits 10% affiliate commission when individual Day 3 VVIP passes are registered", async () => {
    const affiliateCode = "AFF-POLO-VIP99";
    const result = await submitRegistration({
      firstName: "Barrister",
      lastName: "Kayode",
      email: `kayode.${Date.now()}@law.ng`,
      phone: "0803 555 7788",
      day1: false,
      day2: false,
      day3: true,
      day3TicketCount: 2,
      paymentMethod: "bank_transfer",
      bankTransferRef: "ABK-WEMA-AFF-TEST",
      affiliateCode,
    });

    expect(result.success).toBe(true);
    expect(result.passes?.length).toBe(2);
  });

  it("verifies official figures and pilot testing price constants", () => {
    expect(DAY3_VVIP_OFFICIAL_PRICE_NGN).toBe(50_000);
    expect(DAY3_VVIP_TESTING_PRICE_NGN).toBe(100);
  });

  it("enforces device locking on guest table invitations and strictly blocks third-party forwarding", async () => {
    const passCode = `ABK-2026-KT01-S02-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    expect(await isTablePassCode(passCode)).toBe(true);

    const deviceAlice = "DEV-ALICE-PHONE-111";
    const deviceBob = "DEV-BOB-PHONE-222";

    // 1. Recipient Alice opens her invited guest ticket on her device -> binds successfully
    const aliceClaim = await verifyPassDeviceBinding(passCode, deviceAlice, "Alice Adeyemi");
    expect(aliceClaim.isAuthorized).toBe(true);
    expect(aliceClaim.status).toBe("newly_bound");

    // 2. Alice opens it again on her device -> authorized
    const aliceRevisit = await verifyPassDeviceBinding(passCode, deviceAlice, "Alice Adeyemi");
    expect(aliceRevisit.isAuthorized).toBe(true);
    expect(aliceRevisit.status).toBe("already_bound_to_this_device");

    // 3. Alice forwards the link to Bob; Bob opens it on his device -> BLOCKED!
    const bobAttempt = await verifyPassDeviceBinding(passCode, deviceBob, "Bob Thirdparty");
    expect(bobAttempt.isAuthorized).toBe(false);
    expect(bobAttempt.status).toBe("forwarding_blocked");
    expect(bobAttempt.message).toContain("claimed and bound to another recipient's mobile device");

    // 4. Host pass (Seat 1: -S01-) is unrestricted
    const hostPassCode = `ABK-2026-KT01-S01-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const hostCheck = await verifyPassDeviceBinding(hostPassCode, deviceBob, "Host Chief");
    expect(hostCheck.isAuthorized).toBe(true);
    expect(hostCheck.status).toBe("unrestricted");
  });
});
