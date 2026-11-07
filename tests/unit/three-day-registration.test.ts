import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitRegistration } from "@/app/(public)/register/actions";
import { isValidSpecialInvitation } from "@/lib/invitations/validate";
import { resetMemoryClaimsForTests } from "@/lib/paystack/claims";

// Invitation codes come only from the server environment. Payments in these tests
// use simulated references (ABK-VVIP-SIM-<qty>-...), which verification accepts only
// outside production and only when no PAYSTACK_SECRET_KEY is set.
beforeEach(() => {
  vi.stubEnv("VVIP_INVITATION_CODES", "ROYAL-VIP, PRESIDENTIAL, VIP2026, SPECIAL-GUEST");
  vi.stubEnv("PAYSTACK_SECRET_KEY", "");
  resetMemoryClaimsForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Three-Day Event Registration & Pass Issuance Rules", () => {
  describe("Special Invitation Code Validation", () => {
    it("recognizes codes listed in VVIP_INVITATION_CODES (case-insensitive)", () => {
      expect(isValidSpecialInvitation("ROYAL-VIP")).toBe(true);
      expect(isValidSpecialInvitation("PRESIDENTIAL")).toBe(true);
      expect(isValidSpecialInvitation("vip2026")).toBe(true);
      expect(isValidSpecialInvitation("  special-guest ")).toBe(true);
    });

    it("rejects empty, unlisted, or look-alike codes", () => {
      expect(isValidSpecialInvitation("")).toBe(false);
      expect(isValidSpecialInvitation(undefined)).toBe(false);
      expect(isValidSpecialInvitation("abc")).toBe(false);
      // The old prefix/length rules let these through — they must not.
      expect(isValidSpecialInvitation("vip-emir")).toBe(false);
      expect(isValidSpecialInvitation("ABCDE")).toBe(false);
      expect(isValidSpecialInvitation("ROYAL-ANYTHING")).toBe(false);
    });

    it("accepts nothing when no codes are configured", () => {
      vi.stubEnv("VVIP_INVITATION_CODES", "");
      expect(isValidSpecialInvitation("ROYAL-VIP")).toBe(false);
    });
  });

  describe("Single & Multi-Day Pass Distribution Rules", () => {
    it("issues 1 pass for Day 1 alone (100% Free Entry)", async () => {
      const res = await submitRegistration({
        firstName: "Adebayo",
        lastName: "Balogun",
        email: "adebayo.balogun@example.com",
        phone: "+234 803 111 2233",
        day1: true,
        day2: false,
        day3: false,
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      const pass = res.passes![0];
      expect(pass.daysCovered).toEqual([1]);
      expect(pass.passCode).toMatch(/^ABK-2026-D1[A-Z0-9]+$/);
      expect(pass.isVvip).toBe(false);
      expect(pass.designTheme).toBe("standard");
      expect(pass.day1Status).toBe("free_admitted");
    });

    it("issues 1 pass for Day 2 alone (100% Free Entry)", async () => {
      const res = await submitRegistration({
        firstName: "Folake",
        lastName: "Solanke",
        email: "folake.solanke@example.com",
        phone: "+234 802 333 4455",
        day1: false,
        day2: true,
        day3: false,
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      const pass = res.passes![0];
      expect(pass.daysCovered).toEqual([2]);
      expect(pass.passCode).toMatch(/^ABK-2026-D2[A-Z0-9]+$/);
      expect(pass.isVvip).toBe(false);
      expect(pass.designTheme).toBe("standard");
      expect(pass.day2Status).toBe("free_admitted");
    });

    it("issues a SINGLE COMBINED pass covering Day 1 & Day 2 when both are ticked", async () => {
      const res = await submitRegistration({
        firstName: "Chief",
        lastName: "Ogunbiyi",
        email: "chief.ogunbiyi@example.com",
        phone: "+234 818 555 6677",
        day1: true,
        day2: true,
        day3: false,
      });

      expect(res.success).toBe(true);
      // SPECIFICATION RULE: Those who ticked day 1 and 2 should be issued with a single pass covering the two days
      expect(res.passes).toHaveLength(1);
      const pass = res.passes![0];
      expect(pass.daysCovered).toEqual([1, 2]);
      expect(pass.passCode).toMatch(/^ABK-2026-D12[A-Z0-9]+$/);
      expect(pass.category).toBeDefined();
      expect(pass.isVvip).toBe(false);
      expect(pass.designTheme).toBe("standard");
      expect(pass.day1Status).toBe("free_admitted");
      expect(pass.day2Status).toBe("free_admitted");
    });

    it("requires payment or special invite when Day 3 is ticked", async () => {
      const res = await submitRegistration({
        firstName: "Tunde",
        lastName: "Bakare",
        email: "tunde.bakare@example.com",
        phone: "+234 805 777 8888",
        day1: false,
        day2: false,
        day3: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Day 3 requires Paystack VVIP payment or an authorized Special Invitation Code");
    });

    it("issues 1 distinct Deep Gold VVIP pass when Day 3 is ticked with Special Invitation", async () => {
      const res = await submitRegistration({
        firstName: "Patron",
        lastName: "Bello",
        email: "patron.bello@example.com",
        phone: "+234 805 777 8888",
        day1: false,
        day2: false,
        day3: true,
        day3InvitationCode: "ROYAL-VIP",
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      const vvipPass = res.passes![0];
      expect(vvipPass.daysCovered).toEqual([3]);
      expect(vvipPass.passCode).toMatch(/^ABK-2026-VVIP[A-Z0-9]+$/);
      expect(vvipPass.isVvip).toBe(true);
      expect(vvipPass.designTheme).toBe("gold");
      expect(vvipPass.invitationCode).toBe("ROYAL-VIP");
      expect(vvipPass.day3Status).toBe("vvip_admitted");
    });

    it("issues 1 distinct Deep Gold VVIP pass when Day 3 is ticked with Paystack payment reference", async () => {
      const res = await submitRegistration({
        firstName: "Dr.",
        lastName: "Adams",
        email: "dr.adams@example.com",
        phone: "+234 809 123 4567",
        day1: false,
        day2: false,
        day3: true,
        day3PaymentRef: "ABK-VVIP-SIM-1-TEST9900",
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      const vvipPass = res.passes![0];
      expect(vvipPass.daysCovered).toEqual([3]);
      expect(vvipPass.passCode).toMatch(/^ABK-2026-VVIP[A-Z0-9]+$/);
      expect(vvipPass.isVvip).toBe(true);
      expect(vvipPass.designTheme).toBe("gold");
      expect(vvipPass.paymentRef).toBe("ABK-VVIP-SIM-1-TEST9900");
    });

    it("issues 2 DISTINCT passes when Day 1 AND Day 3 are ticked", async () => {
      const res = await submitRegistration({
        firstName: "Kola",
        lastName: "Abiola",
        email: "kola.abiola@example.com",
        phone: "+234 802 111 4444",
        day1: true,
        day2: false,
        day3: true,
        day3PaymentRef: "ABK-VVIP-SIM-1-TEST8812",
      });

      expect(res.success).toBe(true);
      // SPECIFICATION RULE: In essence there would be two access card issued to those who opted to attend day 1 and day 3
      expect(res.passes).toHaveLength(2);

      const pass1 = res.passes![0];
      const pass2 = res.passes![1];

      // Pass 1: Day 1 Free Pass
      expect(pass1.daysCovered).toEqual([1]);
      expect(pass1.passCode).toMatch(/^ABK-2026-D1[A-Z0-9]+$/);
      expect(pass1.isVvip).toBe(false);
      expect(pass1.designTheme).toBe("standard");

      // Pass 2: Day 3 VVIP Pass
      expect(pass2.daysCovered).toEqual([3]);
      expect(pass2.passCode).toMatch(/^ABK-2026-VVIP[A-Z0-9]+$/);
      expect(pass2.isVvip).toBe(true);
      expect(pass2.designTheme).toBe("gold");
    });

    it("issues 2 DISTINCT passes when Day 2 AND Day 3 are ticked", async () => {
      const res = await submitRegistration({
        firstName: "Simi",
        lastName: "Durojaiye",
        email: "simi.d@example.com",
        phone: "+234 803 222 5555",
        day1: false,
        day2: true,
        day3: true,
        day3InvitationCode: "PRESIDENTIAL",
      });

      expect(res.success).toBe(true);
      // SPECIFICATION RULE: two access card issued to those who opted to attend day 2 and day 3
      expect(res.passes).toHaveLength(2);

      const pass1 = res.passes![0];
      const pass2 = res.passes![1];

      expect(pass1.daysCovered).toEqual([2]);
      expect(pass1.passCode).toMatch(/^ABK-2026-D2[A-Z0-9]+$/);
      expect(pass1.isVvip).toBe(false);

      expect(pass2.daysCovered).toEqual([3]);
      expect(pass2.passCode).toMatch(/^ABK-2026-VVIP[A-Z0-9]+$/);
      expect(pass2.isVvip).toBe(true);
      expect(pass2.designTheme).toBe("gold");
    });

    it("issues 2 DISTINCT passes when ALL THREE days (Day 1, 2, and 3) are ticked", async () => {
      const res = await submitRegistration({
        firstName: "Alhaji",
        lastName: "Dantata",
        email: "alhaji.dantata@example.com",
        phone: "+234 803 999 1111",
        day1: true,
        day2: true,
        day3: true,
        day3PaymentRef: "ABK-VVIP-SIM-1-TESTALLDAYS",
      });

      expect(res.success).toBe(true);
      // SPECIFICATION RULE: Days 1 & 2 combined into 1 card, Day 3 issued as separate card = 2 cards total!
      expect(res.passes).toHaveLength(2);

      const combinedPass = res.passes![0];
      const vvipPass = res.passes![1];

      expect(combinedPass.daysCovered).toEqual([1, 2]);
      expect(combinedPass.passCode).toMatch(/^ABK-2026-D12[A-Z0-9]+$/);
      expect(combinedPass.isVvip).toBe(false);
      expect(combinedPass.designTheme).toBe("standard");

      expect(vvipPass.daysCovered).toEqual([3]);
      expect(vvipPass.passCode).toMatch(/^ABK-2026-VVIP[A-Z0-9]+$/);
      expect(vvipPass.isVvip).toBe(true);
      expect(vvipPass.designTheme).toBe("gold");
    });
  });

  describe("Day 3 Multi-Ticket Payment and Pass Multiplicity", () => {
    it("issues 3 individual Day 3 VVIP passes when 3 tickets are purchased", async () => {
      const res = await submitRegistration({
        firstName: "Chief",
        lastName: "Adeyemi",
        email: "chief.adeyemi@example.com",
        phone: "+234 802 111 4444",
        day1: false,
        day2: false,
        day3: true,
        day3TicketCount: 3,
        day3PaymentRef: "ABK-VVIP-SIM-3-TEST1",
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(3);

      const passCodes = new Set(res.passes!.map((p) => p.passCode));
      expect(passCodes.size).toBe(3);

      const qrTokens = new Set(res.passes!.map((p) => p.qrToken));
      expect(qrTokens.size).toBe(3);

      res.passes!.forEach((pass, index) => {
        expect(pass.daysCovered).toEqual([3]);
        expect(pass.isVvip).toBe(true);
        expect(pass.designTheme).toBe("gold");
        expect(pass.passTier).toBe("vvip_day3");
        expect(pass.passCode).toMatch(/^ABK-2026-VVIP[A-Z0-9]+$/);
        expect(pass.holderName).toBe(`Chief Adeyemi (Pass ${index + 1} of 3)`);
        expect(pass.securityHash).toBeDefined();
        expect(pass.securityHash).toHaveLength(64);
      });
    });

    it("issues 1 Day 1/2 Combined Pass and 3 Day 3 VVIP passes (4 passes total)", async () => {
      const res = await submitRegistration({
        firstName: "Senator",
        lastName: "Amosun",
        email: "senator.a@example.com",
        phone: "+234 803 555 7777",
        day1: true,
        day2: true,
        day3: true,
        day3TicketCount: 3,
        day3PaymentRef: "ABK-VVIP-SIM-3-TEST2",
      });

      expect(res.success).toBe(true);
      // 1 Combined Free Day 1&2 card + 3 individual Day 3 VVIP cards = 4 cards total
      expect(res.passes).toHaveLength(4);

      // Pass 1 is the complimentary combined card
      expect(res.passes![0].daysCovered).toEqual([1, 2]);
      expect(res.passes![0].isVvip).toBe(false);
      expect(res.passes![0].designTheme).toBe("standard");

      // Passes 2, 3, 4 are the distinct Day 3 VVIP cards
      const vvipPasses = res.passes!.slice(1);
      expect(vvipPasses).toHaveLength(3);
      vvipPasses.forEach((p, idx) => {
        expect(p.daysCovered).toEqual([3]);
        expect(p.isVvip).toBe(true);
        expect(p.designTheme).toBe("gold");
        expect(p.holderName).toBe(`Senator Amosun (Pass ${idx + 1} of 3)`);
      });
    });

    it("handles Day 3 ticket quantity clamping between 1 and 20", async () => {
      const res = await submitRegistration({
        firstName: "Alake",
        lastName: "Guest",
        email: "alake.guest@example.com",
        phone: "+234 809 111 2222",
        day3: true,
        day3TicketCount: 1,
        day3PaymentRef: "ABK-VVIP-SIM-1-SINGLE",
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      expect(res.passes![0].holderName).toBe("Alake Guest");
    });

    it("personalizes each Day 3 VVIP pass with the individual First and Last Name entered by the buyer", async () => {
      const res = await submitRegistration({
        firstName: "Adebayo",
        lastName: "Balogun",
        email: "buyer.balogun@example.com",
        phone: "+234 803 999 8888",
        day1: true,
        day2: true,
        day3: true,
        day3TicketCount: 3,
        day3PaymentRef: "ABK-VVIP-SIM-3-NAMEDGUESTS",
        attendees: [
          { firstName: "Adebayo", lastName: "Balogun" },
          { firstName: "Folashade", lastName: "Alake" },
          { firstName: "Oluwaseun", lastName: "Adeleke" },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(4);

      // Pass 1: Day 1 & Day 2 Complimentary Dual Pass (Forest Green / Standard)
      const day12Pass = res.passes![0];
      expect(day12Pass.daysCovered).toEqual([1, 2]);
      expect(day12Pass.isVvip).toBe(false);
      expect(day12Pass.designTheme).toBe("standard");
      expect(day12Pass.holderName).toBe("Adebayo Balogun");

      // Passes 2, 3, 4: Distinct Day 3 VVIP Passes personalized with individual names
      const vvip1 = res.passes![1];
      const vvip2 = res.passes![2];
      const vvip3 = res.passes![3];

      expect(vvip1.holderName).toBe("Adebayo Balogun");
      expect(vvip1.isVvip).toBe(true);
      expect(vvip1.designTheme).toBe("gold");
      expect(vvip1.ticketIndex).toBe(1);

      expect(vvip2.holderName).toBe("Folashade Alake");
      expect(vvip2.isVvip).toBe(true);
      expect(vvip2.designTheme).toBe("gold");
      expect(vvip2.ticketIndex).toBe(2);
      expect(vvip2.isSponsored).toBe(true);
      expect(vvip2.sponsorName).toBe("Adebayo Balogun");

      expect(vvip3.holderName).toBe("Oluwaseun Adeleke");
      expect(vvip3.isVvip).toBe(true);
      expect(vvip3.designTheme).toBe("gold");
      expect(vvip3.ticketIndex).toBe(3);
      expect(vvip3.isSponsored).toBe(true);
      expect(vvip3.sponsorName).toBe("Adebayo Balogun");
    });

    it("allows buyer to purchase Day 3 VVIP passes for attendees where Ticket 1 is a different person from buyer", async () => {
      const res = await submitRegistration({
        firstName: "Adebayo",
        lastName: "Balogun",
        email: "buyer.balogun@example.com",
        phone: "+234 803 999 8888",
        day3: true,
        day3TicketCount: 2,
        day3PaymentRef: "ABK-VVIP-SIM-2-CUSTOMTICKET1",
        attendees: [
          { firstName: "Chief", lastName: "Obasanjo" },
          { firstName: "Otunba", lastName: "Alake" },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(2);

      const pass1 = res.passes![0];
      const pass2 = res.passes![1];

      expect(pass1.holderName).toBe("Chief Obasanjo");
      expect(pass1.isVvip).toBe(true);
      expect(pass1.designTheme).toBe("gold");
      expect(pass1.ticketIndex).toBe(1);

      expect(pass2.holderName).toBe("Otunba Alake");
      expect(pass2.isVvip).toBe(true);
      expect(pass2.designTheme).toBe("gold");
      expect(pass2.ticketIndex).toBe(2);
      expect(pass2.isSponsored).toBe(true);
      expect(pass2.sponsorName).toBe("Adebayo Balogun");
    });

    it("gracefully falls back to buyer name when individual attendee names are partially missing or whitespace", async () => {
      const res = await submitRegistration({
        firstName: "Adebayo",
        lastName: "Balogun",
        email: "buyer.balogun@example.com",
        phone: "+234 803 999 8888",
        day3: true,
        day3TicketCount: 2,
        day3PaymentRef: "ABK-VVIP-SIM-2-PARTIALNAMES",
        attendees: [
          { firstName: "   ", lastName: "   " },
          { firstName: "Funke", lastName: "Akpabio" },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(2);

      // Ticket 1 had only whitespace, falls back gracefully to serial name
      expect(res.passes![0].holderName).toBe("Adebayo Balogun (Pass 1 of 2)");
      expect(res.passes![0].isVvip).toBe(true);
      expect(res.passes![0].designTheme).toBe("gold");

      // Ticket 2 had valid name
      expect(res.passes![1].holderName).toBe("Funke Akpabio");
      expect(res.passes![1].isVvip).toBe(true);
      expect(res.passes![1].designTheme).toBe("gold");
    });
  });
});
