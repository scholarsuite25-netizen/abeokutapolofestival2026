import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { dispatchRemindersBatch } = vi.hoisted(() => ({
  dispatchRemindersBatch: vi.fn().mockResolvedValue({
    totalProcessed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    whatsappQueued: 0,
    whatsappPrimarySent: 0,
    whatsappDirectLinks: [],
    channelPriority: "whatsapp_primary_email_fallback",
    logs: [],
  }),
}));

vi.mock("@/lib/reminders/engine", () => ({
  dispatchRemindersBatch,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => {
    throw new Error("Database not available in unit tests");
  }),
}));

import { GET } from "@/app/api/cron/reminders/route";

/**
 * Regression tests for the cron authorization fail-closed fix:
 *  - an unconfigured CRON_SECRET must never expose an open relay in production;
 *  - a configured CRON_SECRET is enforced whenever it is set;
 *  - only local development may run without a secret.
 */
describe("Cron Reminders Endpoint Authorization (fail closed)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    // @ts-expect-error test restore
    process.env.NODE_ENV = originalNodeEnv;
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
    dispatchRemindersBatch.mockClear();
  });

  function setNodeEnv(value: string) {
    // @ts-expect-error test override
    process.env.NODE_ENV = value;
  }

  function makeReq(authHeader?: string): NextRequest {
    return new NextRequest("http://localhost:3000/api/cron/reminders", {
      headers: authHeader ? { authorization: authHeader } : {},
    });
  }

  it("returns 401 in production when CRON_SECRET is not configured", async () => {
    setNodeEnv("production");
    delete process.env.CRON_SECRET;

    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(dispatchRemindersBatch).not.toHaveBeenCalled();
  });

  it("returns 401 in production when the bearer token does not match", async () => {
    setNodeEnv("production");
    process.env.CRON_SECRET = "unit-test-cron-secret";

    const res = await GET(makeReq("Bearer wrong-token"));
    expect(res.status).toBe(401);
    expect(dispatchRemindersBatch).not.toHaveBeenCalled();
  });

  it("dispatches when the bearer token matches CRON_SECRET", async () => {
    setNodeEnv("production");
    process.env.CRON_SECRET = "unit-test-cron-secret";

    const res = await GET(makeReq("Bearer unit-test-cron-secret"));
    expect(res.status).toBe(200);
    expect(dispatchRemindersBatch).toHaveBeenCalledOnce();
  });

  it("enforces a configured secret outside production too", async () => {
    setNodeEnv("test");
    process.env.CRON_SECRET = "unit-test-cron-secret";

    const res = await GET(makeReq("Bearer wrong-token"));
    expect(res.status).toBe(401);
    expect(dispatchRemindersBatch).not.toHaveBeenCalled();
  });

  it("allows local development invocation without a configured secret", async () => {
    setNodeEnv("test");
    delete process.env.CRON_SECRET;

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    expect(dispatchRemindersBatch).toHaveBeenCalledOnce();
  });
});
