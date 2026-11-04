import { describe, expect, it } from "vitest";
import { POST as initRoute } from "@/app/api/paystack/initialize/route";
import { GET as verifyRoute } from "@/app/api/paystack/verify/route";

describe("Paystack Gateway & Demo Platform Integration", () => {
  describe("Initialize Route (/api/paystack/initialize)", () => {
    it("simulates successful demo checkout with 1 ticket (₦50,000)", async () => {
      const req = new Request("http://localhost:3000/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "attendee@example.com",
          firstName: "Kabiru",
          lastName: "Sani",
          day3: true,
          quantity: 1,
        }),
      });

      const res = await initRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("success");
      expect(data.simulated).toBe(true);
      expect(data.amount).toBe(50000);
      expect(data.quantity).toBe(1);
      expect(data.reference).toMatch(/^ABK-VVIP-/);
      expect(data.authorization_url).toContain("qty=1");
      expect(data.authorization_url).toContain("payment_ref=");
    });

    it("simulates successful demo checkout with multiple tickets (e.g. 3 tickets = ₦150,000)", async () => {
      const req = new Request("http://localhost:3000/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "delegation@example.com",
          firstName: "Chief",
          lastName: "Adebayo",
          day1: true,
          day2: true,
          day3: true,
          quantity: 3,
        }),
      });

      const res = await initRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("success");
      expect(data.simulated).toBe(true);
      expect(data.amount).toBe(150000); // 3 * 50,000
      expect(data.quantity).toBe(3);
      expect(data.reference).toMatch(/^ABK-VVIP-/);
      expect(data.authorization_url).toContain("qty=3");
      expect(data.authorization_url).toContain("day1=1");
      expect(data.authorization_url).toContain("day2=1");
    });

    it("rejects request missing email with 400", async () => {
      const req = new Request("http://localhost:3000/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "NoEmail",
          quantity: 2,
        }),
      });

      const res = await initRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Email is required.");
    });
  });

  describe("Verify Route (/api/paystack/verify)", () => {
    it("verifies simulated payment reference and returns correct amount & quantity", async () => {
      const req = new Request(
        "http://localhost:3000/api/paystack/verify?reference=ABK-VVIP-DEMO-TEST&quantity=4",
        { method: "GET" }
      );

      const res = await verifyRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.verified).toBe(true);
      expect(data.quantity).toBe(4);
      expect(data.amount).toBe(200000); // 4 * 50,000
      expect(data.simulated).toBe(true);
    });

    it("rejects verification without reference with 400", async () => {
      const req = new Request("http://localhost:3000/api/paystack/verify", {
        method: "GET",
      });

      const res = await verifyRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Reference is required.");
    });
  });
});
