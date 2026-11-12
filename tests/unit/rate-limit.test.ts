import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  configured: false,
  rpcData: null as boolean | null,
  rpcError: null as { message: string } | null,
  rpcCalls: [] as Array<{ p_bucket: string; p_window_seconds: number; p_max_attempts: number }>,
}));

vi.mock("@/lib/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/env")>()),
  isSupabaseConfigured: () => h.configured,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: async (_fn: string, args: { p_bucket: string; p_window_seconds: number; p_max_attempts: number }) => {
      h.rpcCalls.push(args);
      return { data: h.rpcData, error: h.rpcError };
    },
  }),
}));

import {
  consumeRateLimit,
  getClientIp,
  resetLocalRateLimitBuckets,
  RATE_LIMIT_MAX_ATTEMPTS,
} from "@/lib/security/rate-limit";

/**
 * Review findings L1 + L2:
 *  L1 — safe client-IP extraction (spoof-resistant bucket key selection);
 *  L2 — durable, database-backed counting that survives deploys/instances,
 *       with documented fail-open on database errors.
 */
describe("Credential verify rate limiting (L1 + L2)", () => {
  beforeEach(() => {
    resetLocalRateLimitBuckets();
    h.configured = false;
    h.rpcData = null;
    h.rpcError = null;
    h.rpcCalls = [];
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetLocalRateLimitBuckets();
  });

  describe("getClientIp (L1)", () => {
    it("prefers the platform-provided req.ip when present", () => {
      const req = {
        ip: "198.51.100.7",
        headers: new Headers({ "x-forwarded-for": "6.6.6.6" }),
      } as unknown as NextRequest;
      expect(getClientIp(req)).toBe("198.51.100.7");
    });

    it("uses the LAST x-forwarded-for entry (first entries are client-spoofable)", () => {
      const req = new NextRequest("http://localhost/api/credentials/verify", {
        headers: { "x-forwarded-for": "1.1.1.1, 8.8.8.8, 203.0.113.5" },
      });
      expect(getClientIp(req)).toBe("203.0.113.5");
    });

    it("falls back to x-real-ip when no forwarded chain exists", () => {
      const req = new NextRequest("http://localhost/api/credentials/verify", {
        headers: { "x-real-ip": "192.0.2.10" },
      });
      expect(getClientIp(req)).toBe("192.0.2.10");
    });

    it("collapses unknown callers into the shared anonymous bucket (fail closed)", () => {
      const req = new NextRequest("http://localhost/api/credentials/verify");
      expect(getClientIp(req)).toBe("anonymous");
    });
  });

  describe("consumeRateLimit (L2)", () => {
    it("allows up to the local allowance then denies within the window", async () => {
      h.configured = false;
      for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
        const res = await consumeRateLimit("test:local-1");
        expect(res.allowed).toBe(true);
      }
      const denied = await consumeRateLimit("test:local-1");
      expect(denied.allowed).toBe(false);
      // Independent buckets are unaffected.
      const other = await consumeRateLimit("test:local-2");
      expect(other.allowed).toBe(true);
    });

    it("denies via the durable counter even when the local bucket still has allowance", async () => {
      h.configured = true;
      h.rpcData = false;

      const res = await consumeRateLimit("test:durable-deny");
      expect(res.allowed).toBe(false);
      expect(h.rpcCalls).toHaveLength(1);
      expect(h.rpcCalls[0].p_bucket).toBe("test:durable-deny:60s:30");
      expect(h.rpcCalls[0].p_window_seconds).toBe(60);
      expect(h.rpcCalls[0].p_max_attempts).toBe(RATE_LIMIT_MAX_ATTEMPTS);
    });

    it("allows when both layers allow", async () => {
      h.configured = true;
      h.rpcData = true;
      const res = await consumeRateLimit("test:both-allow");
      expect(res.allowed).toBe(true);
    });

    it("fails OPEN on a database error (HMAC remains primary protection) but keeps the local guard running", async () => {
      h.configured = true;
      h.rpcError = { message: "connection refused" };
      const warnSpy = vi.spyOn(console, "warn");

      // Local layer still enforces the full allowance while the DB is down.
      for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
        const res = await consumeRateLimit("test:db-down");
        expect(res.allowed).toBe(true);
      }
      const denied = await consumeRateLimit("test:db-down");
      expect(denied.allowed).toBe(false);

      expect(warnSpy).toHaveBeenCalled();
      expect(String(warnSpy.mock.calls[0][0])).toContain("Durable check failed");
    });

    it("uses distinct bucket keys per caller (no shared anonymous flood gate)", async () => {
      h.configured = false;
      const a = await consumeRateLimit("credentials-verify:203.0.113.1");
      const b = await consumeRateLimit("credentials-verify:203.0.113.2");
      expect(a.allowed).toBe(true);
      expect(b.allowed).toBe(true);
    });
  });
});
