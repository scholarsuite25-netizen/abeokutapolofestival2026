import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitRegistration, submitTableRegistration } from "@/app/(public)/register/actions";
import { resetMemoryClaimsForTests } from "@/lib/paystack/claims";

/**
 * Regression tests for the Day 3 VVIP bypasses that existed before server-side
 * verification: a made-up reference, "paid" URL parameters, any 5+ character
 * invitation code, replaying a reference, and minting many passes with one code.
 *
 * Day 3 Grand Finale admission is issued with a VIP Table package, so the paid
 * Day-3 flow is exercised through the table booking path (which uses the same
 * verify-and-claim machinery). The registration page now issues a Day-3 pass
 * only against a complimentary Special VIP Invitation Code.
 */

const guest = {
  firstName: "Test",
  lastName: "Guest",
  email: "guest@example.com",
  phone: "+234 803 000 0000",
  day1: false,
  day2: false,
  day3: true,
};

const tableBooking = {
  packageId: "royal_table",
  tableSerial: "Royal Table 07",
  buyerFirstName: "Test",
  buyerLastName: "Guest",
  buyerEmail: "guest@example.com",
  buyerPhone: "+234 803 000 0000",
  paymentMethod: "gateway",
};

const ROYAL_TABLE_PRICE_NGN = 3_000_000;

describe("Day 3 VVIP cannot be obtained without genuine payment or invitation", () => {
  beforeEach(() => {
    vi.stubEnv("VVIP_INVITATION_CODES", "ROYAL-VIP");
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    resetMemoryClaimsForTests();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects a made-up payment reference (the old '>3 characters' bypass)", async () => {
    for (const ref of ["abcd", "PSTK-ABK-8812", "paid", "ABK-VVIP-12345"]) {
      const res = await submitTableRegistration({ ...tableBooking, paymentRef: ref });
      expect(res.success, `reference ${ref}`).toBe(false);
      expect(res.passes).toBeUndefined();
    }
  });

  it("rejects invitation codes that only look plausible (the old prefix/length bypass)", async () => {
    for (const code of ["VIP-ANYTHING", "ROYAL-FAKE", "PRESIDENT", "ABCDE", "12345"]) {
      const res = await submitRegistration({ ...guest, day3InvitationCode: code });
      expect(res.success, `code ${code}`).toBe(false);
    }
  });

  it("refuses a simulated reference in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await submitTableRegistration({
      ...tableBooking,
      paymentRef: "ABK-VVIP-SIM-1-1700000000000-ABCD1234",
    });
    expect(res.success).toBe(false);
    expect(res.passes).toBeUndefined();
  });

  it("refuses a real-looking reference that Paystack says was not paid", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_dummy");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: true, data: { status: "abandoned" } }), { status: 200 }),
      ),
    );
    const res = await submitTableRegistration({
      ...tableBooking,
      paymentRef: "ABK-VVIP-1700000000000-AB12CD34",
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("not been completed");
  });

  it("issues the table's passes for a genuine payment and refuses to reuse the same reference", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_dummy");
    const reference = "ABK-VVIP-1700000000000-AB12CD34";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              status: true,
              data: {
                status: "success",
                reference,
                amount: ROYAL_TABLE_PRICE_NGN * 100,
                currency: "NGN",
                customer: { email: "guest@example.com" },
              },
            }),
            { status: 200 },
          ),
      ),
    );

    const first = await submitTableRegistration({ ...tableBooking, paymentRef: reference });
    expect(first.success).toBe(true);
    expect(first.passes).toHaveLength(8);
    expect(first.passes![0].paymentRef).toBe(reference);

    const replay = await submitTableRegistration({ ...tableBooking, paymentRef: reference });
    expect(replay.success).toBe(false);
    expect(replay.error).toContain("already been used");
  });

  it("will not issue a table's seats for a payment that only covers one pass", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_dummy");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: true,
            data: {
              status: "success",
              reference: "ABK-VVIP-1700000000000-AB12CD34",
              amount: 50_000 * 100, // a single ₦50,000 pass
              currency: "NGN",
              customer: { email: "guest@example.com" },
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const res = await submitTableRegistration({
      ...tableBooking,
      paymentRef: "ABK-VVIP-1700000000000-AB12CD34",
    });
    expect(res.success).toBe(false);
    expect(res.passes).toBeUndefined();
  });

  it("rejects payment made with a different email address", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_dummy");
    const reference = "ABK-VVIP-1700000000000-ZZ99YY88";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: true,
            data: {
              status: "success",
              reference,
              amount: ROYAL_TABLE_PRICE_NGN * 100,
              currency: "NGN",
              customer: { email: "payer@example.com" },
            },
          }),
          { status: 200 },
        ),
      ),
    );
    const res = await submitTableRegistration({ ...tableBooking, paymentRef: reference });
    expect(res.success).toBe(false);
    expect(res.error).toContain("same email");
  });

  it("limits one Special Invitation Code to a single VVIP pass", async () => {
    const res = await submitRegistration({
      ...guest,
      day3TicketCount: 20,
      day3InvitationCode: "royal-vip",
    });
    expect(res.success).toBe(true);
    expect(res.passes).toHaveLength(1);
    expect(res.passes![0].invitationCode).toBe("royal-vip");
    expect(res.passes![0].paymentRef).toBeNull();
  });

  it("does not store an unverified payment reference on an invitation pass", async () => {
    const res = await submitRegistration({
      ...guest,
      day3InvitationCode: "ROYAL-VIP",
      day3PaymentRef: "totally-made-up-reference",
    });
    expect(res.success).toBe(true);
    expect(res.passes![0].paymentRef).toBeNull();
  });

  it("refuses a standalone Day 3 purchase on the registration page", async () => {
    const res = await submitRegistration({
      ...guest,
      paymentMethod: "bank_transfer",
      bankTransferRef: "ABK-WEMA-STANDALONE",
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("VIP Table");
    expect(res.passes).toBeUndefined();
  });

  it("free Day 1 and Day 2 registration still works with no payment or code (1 combined pass issued)", async () => {
    const res = await submitRegistration({ ...guest, day1: true, day2: true, day3: false });
    expect(res.success).toBe(true);
    // Anyone who chooses to attend day one and two together gets one combined pass
    expect(res.passes).toHaveLength(1);
    expect(res.passes![0].isVvip).toBe(false);
  });
});
