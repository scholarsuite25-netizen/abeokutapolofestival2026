import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyDay3Payment } from "@/lib/paystack/verify";
import { claimPaymentReference, resetMemoryClaimsForTests } from "@/lib/paystack/claims";

const REF = "ABK-VVIP-1700000000000-AB12CD34";

function paystackResponse(overrides: Record<string, unknown> = {}, httpStatus = 200) {
  const data = {
    status: "success",
    reference: REF,
    amount: 50000 * 100,
    currency: "NGN",
    customer: { email: "guest@example.com" },
    ...overrides,
  };
  return new Response(JSON.stringify({ status: true, data }), {
    status: httpStatus,
    headers: { "Content-Type": "application/json" },
  });
}

describe("verifyDay3Payment — live Paystack", () => {
  beforeEach(() => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_dummy");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("accepts a successful NGN payment and derives quantity from the amount", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(paystackResponse({ amount: 150000 * 100 })));
    const result = await verifyDay3Payment(REF, { expectedEmail: "GUEST@example.com" });
    expect(result).toMatchObject({ ok: true, quantity: 3, amountNgn: 150000, simulated: false });
  });

  it("calls Paystack with the secret key and an encoded reference", async () => {
    const fetchMock = vi.fn().mockResolvedValue(paystackResponse());
    vi.stubGlobal("fetch", fetchMock);
    await verifyDay3Payment(REF);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`https://api.paystack.co/transaction/verify/${REF}`);
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer sk_test_dummy" });
  });

  it("rejects references that were not created by our checkout", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const bad of ["", "abcd", "PSTK-ABK-8812", "ABK-VVIP-../../etc", "ABK-VVIP-<script>1</script>"]) {
      const result = await verifyDay3Payment(bad);
      expect(result).toMatchObject({ ok: false, reason: "invalid_reference" });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a payment that did not succeed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(paystackResponse({ status: "abandoned" })));
    expect(await verifyDay3Payment(REF)).toMatchObject({ ok: false, reason: "not_successful" });
  });

  it("rejects an amount below one VVIP pass", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(paystackResponse({ amount: 49999 * 100 })));
    expect(await verifyDay3Payment(REF)).toMatchObject({ ok: false, reason: "amount_too_low" });
  });

  it("rejects a non-NGN payment", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(paystackResponse({ currency: "GHS" })));
    expect(await verifyDay3Payment(REF)).toMatchObject({ ok: false, reason: "wrong_currency" });
  });

  it("rejects when Paystack answers for a different reference", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(paystackResponse({ reference: "ABK-VVIP-OTHER-REF" })));
    expect(await verifyDay3Payment(REF)).toMatchObject({ ok: false, reason: "invalid_reference" });
  });

  it("rejects when the paying email differs from the registrant's email", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(paystackResponse()));
    const result = await verifyDay3Payment(REF, { expectedEmail: "someone.else@example.com" });
    expect(result).toMatchObject({ ok: false, reason: "email_mismatch" });
  });

  it("treats an unknown reference (404) as not found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    expect(await verifyDay3Payment(REF)).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("fails closed when Paystack is unreachable or errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await verifyDay3Payment(REF)).toMatchObject({ ok: false, reason: "gateway_error" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 500 })));
    expect(await verifyDay3Payment(REF)).toMatchObject({ ok: false, reason: "gateway_error" });
  });
});

describe("verifyDay3Payment — no secret key", () => {
  beforeEach(() => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts simulated references outside production", async () => {
    const result = await verifyDay3Payment("ABK-VVIP-SIM-3-1700000000000-ABCD1234");
    expect(result).toMatchObject({ ok: true, quantity: 3, amountNgn: 150000, simulated: true });
  });

  it("does not accept ordinary-looking references without a key", async () => {
    expect(await verifyDay3Payment(REF)).toMatchObject({ ok: false, reason: "invalid_reference" });
  });

  it("NEVER simulates in production — even for simulated-looking references", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = await verifyDay3Payment("ABK-VVIP-SIM-3-1700000000000-ABCD1234");
    expect(result).toMatchObject({ ok: false, reason: "not_configured" });
  });
});

describe("claimPaymentReference (single use)", () => {
  beforeEach(() => {
    resetMemoryClaimsForTests();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const claim = (reference: string) =>
    claimPaymentReference({ reference, email: "guest@example.com", amountNgn: 50000, quantity: 1 });

  it("lets a reference be claimed once and refuses the second claim", async () => {
    expect(await claim(REF)).toEqual({ ok: true });
    expect(await claim(REF)).toMatchObject({ ok: false, reason: "already_used" });
  });

  it("allows different references independently", async () => {
    expect(await claim(`${REF}-A`)).toEqual({ ok: true });
    expect(await claim(`${REF}-B`)).toEqual({ ok: true });
  });

  it("refuses to claim in production when Supabase is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await claim(REF)).toMatchObject({ ok: false, reason: "unavailable" });
  });
});
