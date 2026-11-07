import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitRegistration } from "@/app/(public)/register/actions";
import { resetMemoryClaimsForTests } from "@/lib/paystack/claims";

/**
 * Regression tests for the Day 3 VVIP bypasses that existed before server-side
 * verification: a made-up reference, "paid" URL parameters, any 5+ character
 * invitation code, replaying a reference, and minting many passes with one code.
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
      const res = await submitRegistration({ ...guest, day3PaymentRef: ref });
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
    const res = await submitRegistration({
      ...guest,
      day3PaymentRef: "ABK-VVIP-SIM-1-1700000000000-ABCD1234",
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
    const res = await submitRegistration({
      ...guest,
      day3PaymentRef: "ABK-VVIP-1700000000000-AB12CD34",
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("not been completed");
  });

  it("issues passes for a genuine payment and refuses to reuse the same reference", async () => {
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
                amount: 50000 * 100,
                currency: "NGN",
                customer: { email: "guest@example.com" },
              },
            }),
            { status: 200 },
          ),
      ),
    );

    const first = await submitRegistration({ ...guest, day3PaymentRef: reference });
    expect(first.success).toBe(true);
    expect(first.passes).toHaveLength(1);
    expect(first.passes![0].paymentRef).toBe(reference);

    const replay = await submitRegistration({ ...guest, day3PaymentRef: reference });
    expect(replay.success).toBe(false);
    expect(replay.error).toContain("already been used");
  });

  it("issues exactly the number of passes that were paid for, not the number requested", async () => {
    // One pass paid (₦50,000) but 20 requested by the client.
    const res = await submitRegistration({
      ...guest,
      day3TicketCount: 20,
      day3PaymentRef: "ABK-VVIP-SIM-1-1700000000000-ABCD1234",
    });
    expect(res.success).toBe(true);
    expect(res.passes).toHaveLength(1);
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
              amount: 50000 * 100,
              currency: "NGN",
              customer: { email: "payer@example.com" },
            },
          }),
          { status: 200 },
        ),
      ),
    );
    const res = await submitRegistration({ ...guest, day3PaymentRef: reference });
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

  it("free Day 1 and Day 2 registration still works with no payment or code", async () => {
    const res = await submitRegistration({ ...guest, day1: true, day2: true, day3: false });
    expect(res.success).toBe(true);
    expect(res.passes).toHaveLength(1);
    expect(res.passes![0].isVvip).toBe(false);
  });
});
