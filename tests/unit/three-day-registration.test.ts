import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitRegistration, submitTableRegistration } from "@/app/(public)/register/actions";
import { isValidSpecialInvitation } from "@/lib/invitations/validate";
import { resetMemoryClaimsForTests } from "@/lib/paystack/claims";

// Invitation codes come only from the server environment.
//
// Day 3 Grand Finale admission is issued with a VIP Table package: the table
// booking issues one sealed Day-3 pass per seat. The registration page issues
// a Day-3 pass only against a complimentary Special Invitation Code, and the
// free Day 1 / Day 2 passes are unaffected.
beforeEach(() => {
  vi.stubEnv("VVIP_INVITATION_CODES", "ROYAL-VIP, PRESIDENTIAL, VIP2026, SPECIAL-GUEST");
  vi.stubEnv("PAYSTACK_SECRET_KEY", "");
  resetMemoryClaimsForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const tableBooking = {
  packageId: "premium_table",
  tableSerial: "Premium Table 03",
  buyerFirstName: "Chief",
  buyerLastName: "Adeyemi",
  buyerEmail: "chief.adeyemi@example.com",
  buyerPhone: "+234 802 111 4444",
  paymentMethod: "bank_transfer" as const,
};

describe("Three-Day Event Registration & Pass Issuance Rules", () => {
  describe("Special Invitation Code Validation", () => {
    it("recognizes codes listed in VVIP_INVITATION_CODES (case-insensitive)", () => {
      expect(isValidSpecialInvitation("ROYAL-VIP")).toBe(true);
      expect(isValidSpecialInvitation("royal-vip")).toBe(true);
      expect(isValidSpecialInvitation("PRESIDENTIAL")).toBe(true);
      expect(isValidSpecialInvitation("VIP2026")).toBe(true);
    });

    it("rejects empty, unlisted, or look-alike codes", () => {
      expect(isValidSpecialInvitation("")).toBe(false);
      expect(isValidSpecialInvitation("NOT-A-CODE")).toBe(false);
      expect(isValidSpecialInvitation("ROYAL-VIP-X")).toBe(false);
    });

    it("accepts nothing when no codes are configured", () => {
      vi.stubEnv("VVIP_INVITATION_CODES", "");
      expect(isValidSpecialInvitation("ROYAL-VIP")).toBe(false);
    });
  });

  describe("Single & Multi-Day Pass Distribution Rules", () => {
    it("issues 1 pass for Day 1 alone (100% Free Entry)", async () => {
      const res = await submitRegistration({
        firstName: "Tunde",
        lastName: "Bakare",
        email: "tunde.bakare@example.com",
        phone: "+234 805 777 8888",
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
        firstName: "Tunde",
        lastName: "Bakare",
        email: "tunde.bakare@example.com",
        phone: "+234 805 777 8888",
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

    it("issues a SINGLE COMBINED pass covering Day 1 & Day 2 when both are ticked together", async () => {
      const res = await submitRegistration({
        firstName: "Tunde",
        lastName: "Bakare",
        email: "tunde.bakare@example.com",
        phone: "+234 805 777 8888",
        day1: true,
        day2: true,
        day3: false,
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      const pass = res.passes![0];

      expect(pass.daysCovered).toEqual([1, 2]);
      expect(pass.passCode).toMatch(/^ABK-2026-D12[A-Z0-9]+$/);
      expect(pass.category).toBe("Day 1 & Day 2 Dual Pass");
      expect(pass.isVvip).toBe(false);
      expect(pass.designTheme).toBe("standard");
      expect(pass.day1Status).toBe("free_admitted");
      expect(pass.day2Status).toBe("free_admitted");
    });

    it("refuses a standalone Day 3 purchase and points to the VIP Tables page", async () => {
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
      expect(res.error).toContain("VIP Table");
      expect(res.error).toContain("/tables");
      expect(res.passes).toBeUndefined();
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

    it("issues 2 DISTINCT passes when Day 1 AND Day 3 are ticked", async () => {
      const res = await submitRegistration({
        firstName: "Kola",
        lastName: "Abiola",
        email: "kola.abiola@example.com",
        phone: "+234 802 111 4444",
        day1: true,
        day2: false,
        day3: true,
        day3InvitationCode: "ROYAL-VIP",
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

    it("issues 2 DISTINCT passes when ALL THREE days (Day 1, 2, and 3) are ticked (1 Combined Day 1&2 + 1 Day 3 VVIP)", async () => {
      const res = await submitRegistration({
        firstName: "Alhaji",
        lastName: "Dantata",
        email: "alhaji.dantata@example.com",
        phone: "+234 803 999 1111",
        day1: true,
        day2: true,
        day3: true,
        day3InvitationCode: "ROYAL-VIP",
      });

      expect(res.success).toBe(true);
      // SPECIFICATION RULE: Days 1 & 2 combined into 1 card, Day 3 separate = 2 cards total
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
    });
  });

  describe("Day 3 Table Seating and Pass Multiplicity", () => {
    it("issues one sealed pass per seat for a table booking", async () => {
      const res = await submitTableRegistration({
        ...tableBooking,
        attendees: [
          { seat: 1, name: "Chief Adeyemi" },
          { seat: 2, name: "Guest Two" },
          { seat: 3, name: "Guest Three" },
          { seat: 4, name: "Guest Four" },
          { seat: 5, name: "Guest Five" },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(5);

      const passCodes = new Set(res.passes!.map((p) => p.passCode));
      expect(passCodes.size).toBe(5);

      const qrTokens = new Set(res.passes!.map((p) => p.qrToken));
      expect(qrTokens.size).toBe(5);

      res.passes!.forEach((pass) => {
        expect(pass.daysCovered).toEqual([3]);
        expect(pass.passCode).toMatch(/^ABK-2026-[A-Z]+\d+-S\d+-[A-Z0-9]+$/);
        expect(pass.securityHash).toBeDefined();
        expect(pass.securityHash).toHaveLength(64);
        // An unverified bank transfer yields provisional slips only.
        expect(pass.status).toBe("pending_verification");
        expect(pass.day3Status).toBe("pending_verification");
      });
    });

    it("issues 1 Day 1/2 Combined Pass for the free registration and the table's own seat passes", async () => {
      const freeDays = await submitRegistration({
        firstName: "Senator",
        lastName: "Amosun",
        email: "senator.a@example.com",
        phone: "+234 803 555 7777",
        day1: true,
        day2: true,
        day3: false,
      });
      expect(freeDays.success).toBe(true);
      expect(freeDays.passes).toHaveLength(1);
      expect(freeDays.passes![0].daysCovered).toEqual([1, 2]);
      expect(freeDays.passes![0].isVvip).toBe(false);
      expect(freeDays.passes![0].designTheme).toBe("standard");

      const table = await submitTableRegistration({
        ...tableBooking,
        buyerEmail: "senator.a@example.com",
        attendees: [
          { seat: 1, name: "Senator Amosun" },
          { seat: 2, name: "Chief Adeyemi" },
          { seat: 3, name: "Otunba Alake" },
          { seat: 4, name: "Guest Four" },
          { seat: 5, name: "Guest Five" },
        ],
      });
      expect(table.success).toBe(true);
      expect(table.passes).toHaveLength(5);
      expect(table.passes!.every((p) => (p.daysCovered ?? []).includes(3))).toBe(true);
    });

    it("issues exactly the package seat count — a single seat for the Regular Section", async () => {
      const res = await submitTableRegistration({
        packageId: "individual_vip",
        tableSerial: "Regular Pass 01",
        buyerFirstName: "Alake",
        buyerLastName: "Guest",
        buyerEmail: "alake.guest@example.com",
        buyerPhone: "+234 809 111 2222",
        paymentMethod: "bank_transfer",
        attendees: [{ seat: 1, name: "Alake Guest" }],
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(1);
      expect(res.passes![0].holderName).toBe("Alake Guest");
      expect(res.amountNgn).toBe(50_000);
    });

    it("personalizes each table pass with the attendee name entered for that seat", async () => {
      const res = await submitTableRegistration({
        ...tableBooking,
        attendees: [
          { seat: 1, name: "Chief Adeyemi" },
          { seat: 2, name: "Folashade Alake" },
          { seat: 3, name: "Oluwaseun Adeleke" },
          { seat: 4, name: "Guest Four" },
          { seat: 5, name: "Guest Five" },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(5);

      expect(res.passes![0].holderName).toBe("Chief Adeyemi");
      expect(res.passes![0].ticketIndex).toBe(1);

      expect(res.passes![1].holderName).toBe("Folashade Alake");
      expect(res.passes![1].ticketIndex).toBe(2);
      expect(res.passes![1].isSponsored).toBe(true);
      expect(res.passes![1].sponsorName).toBe("Chief Adeyemi");

      expect(res.passes![2].holderName).toBe("Oluwaseun Adeleke");
      expect(res.passes![2].isSponsored).toBe(true);
      expect(res.passes![2].sponsorName).toBe("Chief Adeyemi");
    });

    it("keeps seat 1 as the buyer's host pass and locks seats 2+ to their recipients", async () => {
      const res = await submitTableRegistration({
        ...tableBooking,
        attendees: [
          { seat: 1, name: "Chief Adeyemi" },
          { seat: 2, name: "Otunba Alake" },
          { seat: 3, name: "Guest Three" },
          { seat: 4, name: "Guest Four" },
          { seat: 5, name: "Guest Five" },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(5);

      const host = res.passes![0];
      expect(host.holderName).toBe("Chief Adeyemi");
      expect(host.isBuyer).toBe(true);
      expect(host.isLockedToDevice).toBe(false);

      const guest = res.passes![1];
      expect(guest.holderName).toBe("Otunba Alake");
      expect(guest.isSponsored).toBe(true);
      expect(guest.sponsorName).toBe("Chief Adeyemi");
      expect(guest.isLockedToDevice).toBe(true);
    });

    it("gracefully falls back to the buyer's name for a seat with no attendee name", async () => {
      const res = await submitTableRegistration({
        ...tableBooking,
        attendees: [
          { seat: 1, name: "Chief Adeyemi" },
          { seat: 2, name: "   " },
          { seat: 3, name: "Funke Akpabio" },
          { seat: 4, name: "Guest Four" },
          { seat: 5, name: "Guest Five" },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.passes).toHaveLength(5);

      // Seat 2 had only whitespace -> falls back gracefully
      expect(res.passes![1].holderName).toBe("Chief Adeyemi (Guest 2)");
      expect(res.passes![1].isSponsored).toBe(true);

      // Seat 3 had a valid name
      expect(res.passes![2].holderName).toBe("Funke Akpabio");
    });
  });
});
