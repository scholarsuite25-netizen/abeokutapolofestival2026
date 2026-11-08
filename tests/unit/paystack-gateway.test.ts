import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as initRoute } from "@/app/api/paystack/initialize/route";
import { GET as verifyRoute } from "@/app/api/paystack/verify/route";
import { DAY3_VVIP_PRICE_NGN } from "@/lib/config/checkout-config";

const post = (body: unknown) =>
  new Request("http://localhost:3000/api/paystack/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Initialize Route (/api/paystack/initialize)", () => {
  describe("development simulation (no PAYSTACK_SECRET_KEY, not production)", () => {
    beforeEach(() => {
      vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    });

    it("simulates checkout for 1 ticket", async () => {
      const res = await initRoute(post({ email: "attendee@example.com", firstName: "Kabiru", lastName: "Sani" }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toMatchObject({ status: "success", simulated: true, amount: DAY3_VVIP_PRICE_NGN, quantity: 1 });
      expect(data.reference).toMatch(/^ABK-VVIP-SIM-1-/);
      expect(data.authorization_url).toContain("payment_ref=");
    });

    it("prices multiple tickets on the server", async () => {
      const res = await initRoute(
        post({ email: "delegation@example.com", day1: true, day2: true, quantity: 3 }),
      );
      const data = await res.json();

      expect(data).toMatchObject({ amount: 3 * DAY3_VVIP_PRICE_NGN, quantity: 3 });
      expect(data.reference).toMatch(/^ABK-VVIP-SIM-3-/);
      const url = new URL(data.authorization_url);
      expect(url.searchParams.get("day1")).toBe("1");
      expect(url.searchParams.get("day2")).toBe("1");
    });

    it("does not put 'paid' or 'success' flags in the return URL", async () => {
      const data = await (await initRoute(post({ email: "a@example.com" }))).json();
      const url = new URL(data.authorization_url);
      expect(url.searchParams.has("paid")).toBe(false);
      expect(url.searchParams.has("status")).toBe(false);
    });

    it("ignores a client-supplied price, amount or demo flag", async () => {
      const data = await (
        await initRoute(post({ email: "a@example.com", quantity: 1, amount: 1, price: 1, demo: true }))
      ).json();
      expect(data.amount).toBe(DAY3_VVIP_PRICE_NGN);
    });

    it("rejects an invalid email with 400", async () => {
      const res = await initRoute(post({ email: "not-an-email" }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("A valid email is required.");
    });

    it("rejects a missing email and an unparseable body with 400", async () => {
      expect((await initRoute(post({ firstName: "NoEmail", quantity: 2 }))).status).toBe(400);
      const broken = new Request("http://localhost:3000/api/paystack/initialize", {
        method: "POST",
        body: "{not json",
      });
      expect((await initRoute(broken)).status).toBe(400);
    });

    it("rejects quantities outside 1–20", async () => {
      expect((await initRoute(post({ email: "a@example.com", quantity: 0 }))).status).toBe(400);
      expect((await initRoute(post({ email: "a@example.com", quantity: 21 }))).status).toBe(400);
    });
  });

  it("NEVER simulates in production by default — returns 503 without a secret key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    const res = await initRoute(post({ email: "a@example.com" }));
    expect(res.status).toBe(503);
    expect((await res.json()).simulated).toBeUndefined();
  });

  it("simulates in production when PAYSTACK_DEMO_MODE=true is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    vi.stubEnv("PAYSTACK_DEMO_MODE", "true");
    const res = await initRoute(post({ email: "a@example.com", quantity: 2 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({ status: "success", simulated: true, amount: 2 * DAY3_VVIP_PRICE_NGN, quantity: 2 });
  });

  it("returns 502 (not a fake success) when Paystack refuses or is unreachable", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_dummy");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: false }), { status: 400 })),
    );
    expect((await initRoute(post({ email: "a@example.com" }))).status).toBe(502);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await initRoute(post({ email: "a@example.com" }))).status).toBe(502);
  });

  it("initializes with Paystack using server-side amount in kobo", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_dummy");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: true,
          data: { authorization_url: "https://checkout.paystack.com/abc", access_code: "abc" },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = await (await initRoute(post({ email: "a@example.com", quantity: 2 }))).json();

    expect(data).toMatchObject({ status: "success", simulated: false, amount: 2 * DAY3_VVIP_PRICE_NGN, quantity: 2 });
    const sent = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(sent).toMatchObject({ amount: 2 * DAY3_VVIP_PRICE_NGN * 100, currency: "NGN", email: "a@example.com" });
    expect(sent.reference).toBe(data.reference);
    expect(sent.reference).toMatch(/^ABK-VVIP-/);
  });
});

describe("Verify Route (/api/paystack/verify)", () => {
  it("requires a reference", async () => {
    const res = await verifyRoute(new Request("http://localhost:3000/api/paystack/verify"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Reference is required.");
  });

  it("reports a genuine simulated reference using the amount derived from the reference", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    const res = await verifyRoute(
      new Request("http://localhost:3000/api/paystack/verify?reference=ABK-VVIP-SIM-4-1700000000000-ABCD1234"),
    );
    const data = await res.json();
    expect(data).toMatchObject({ verified: true, quantity: 4, amount: 4 * DAY3_VVIP_PRICE_NGN, simulated: true });
  });

  it("ignores a client-supplied quantity", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    const res = await verifyRoute(
      new Request(
        "http://localhost:3000/api/paystack/verify?reference=ABK-VVIP-SIM-1-1700000000000-ABCD1234&quantity=20",
      ),
    );
    expect((await res.json()).quantity).toBe(1);
  });

  it("does NOT verify arbitrary references", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    const res = await verifyRoute(
      new Request("http://localhost:3000/api/paystack/verify?reference=ABK-VVIP-DEMO-TEST&quantity=4"),
    );
    expect((await res.json()).verified).toBe(false);
  });

  it("does not verify in production without a secret key by default", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    const res = await verifyRoute(
      new Request("http://localhost:3000/api/paystack/verify?reference=ABK-VVIP-SIM-1-1700000000000-ABCD1234"),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).verified).toBe(false);
  });

  it("verifies simulated references in production when PAYSTACK_DEMO_MODE=true is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    vi.stubEnv("PAYSTACK_DEMO_MODE", "true");
    const res = await verifyRoute(
      new Request("http://localhost:3000/api/paystack/verify?reference=ABK-VVIP-SIM-1-1700000000000-ABCD1234"),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).verified).toBe(true);
  });
});
