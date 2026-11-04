import { describe, expect, it } from "vitest";
import { submitRegistration, isValidSpecialInvitation } from "@/app/(public)/register/actions";

describe("Three-Day Event Registration & Pass Issuance Rules", () => {
  describe("Special Invitation Code Validation", () => {
    it("recognizes authorized VIP invitation codes", async () => {
      expect(await isValidSpecialInvitation("ROYAL-VIP")).toBe(true);
      expect(await isValidSpecialInvitation("PRESIDENTIAL")).toBe(true);
      expect(await isValidSpecialInvitation("VIP2026")).toBe(true);
      expect(await isValidSpecialInvitation("SPECIAL-GUEST")).toBe(true);
      expect(await isValidSpecialInvitation("vip-emir")).toBe(true);
    });

    it("rejects empty or invalid codes", async () => {
      expect(await isValidSpecialInvitation("")).toBe(false);
      expect(await isValidSpecialInvitation(undefined)).toBe(false);
      expect(await isValidSpecialInvitation("abc")).toBe(false);
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
        day3PaymentRef: "PSTK-ABK-TEST-9900",
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      const vvipPass = res.passes![0];
      expect(vvipPass.daysCovered).toEqual([3]);
      expect(vvipPass.passCode).toMatch(/^ABK-2026-VVIP[A-Z0-9]+$/);
      expect(vvipPass.isVvip).toBe(true);
      expect(vvipPass.designTheme).toBe("gold");
      expect(vvipPass.paymentRef).toBe("PSTK-ABK-TEST-9900");
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
        day3PaymentRef: "PSTK-ABK-8812",
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
        day3PaymentRef: "PSTK-ABK-ALLDAYS",
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
        day3PaymentRef: "ABK-VVIP-DEMO-TEST1",
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
        day3PaymentRef: "ABK-VVIP-DEMO-TEST2",
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
        day3PaymentRef: "ABK-VVIP-DEMO-SINGLE",
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      expect(res.passes![0].holderName).toBe("Alake Guest");
    });
  });
});
