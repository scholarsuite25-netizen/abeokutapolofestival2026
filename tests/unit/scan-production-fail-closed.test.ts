import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({
  configured: false,
}));

vi.mock("@/lib/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/env")>()),
  isSupabaseConfigured: () => h.configured,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "credentials") {
        return {
          select: () => ({
            or: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table in production-fail-closed test: ${table}`);
    },
  }),
}));

vi.mock("@/lib/auth/require", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/require")>();
  return {
    ...actual,
    requirePermission: vi.fn(async () => ({
      user: { id: "officer-test-1" },
      profile: null,
      actor: { userId: "officer-test-1", roles: ["security_checkin_officer"] },
    })),
  };
});

import { processGateScan } from "@/app/(ops)/scan/actions";

/**
 * Review finding M2: production used to require `isSupabaseConfigured()` in
 * addition to NODE_ENV before refusing the offline demo simulator, so a
 * production deployment missing its Supabase env silently fell through to
 * admitting `ABK-2026-...` demo codes at the turnstile. Production must now
 * fail closed unconditionally.
 */
describe("Gate scan — production fail-closed (M2)", () => {
  beforeEach(() => {
    h.configured = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    h.configured = false;
  });

  it("still admits demo codes outside production (local simulation intact)", async () => {
    const res = await processGateScan({
      passIdentifier: "ABK-2026-D1DEV1",
      gate: "Gate 2 - General Turnstiles",
      eventDay: 1,
    });

    expect(res.status).toBe("valid");
    expect(res.result).toBe("admitted");
  });

  it("refuses the demo simulator in production when Supabase is NOT configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    h.configured = false;

    const res = await processGateScan({
      passIdentifier: "ABK-2026-D1PROD",
      gate: "Gate 2 - General Turnstiles",
      eventDay: 1,
    });

    expect(res.status).toBe("invalid");
    expect(res.result).toBe("rejected");
    expect(res.message).toContain("Credential validation unavailable");
    expect(res.message).not.toContain("Welcome");
  });

  it("refuses unknown credentials in production when Supabase IS configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    h.configured = true;

    const res = await processGateScan({
      passIdentifier: "ABK-2026-D1PRD2",
      gate: "Gate 2 - General Turnstiles",
      eventDay: 1,
    });

    expect(res.status).toBe("invalid");
    expect(res.result).toBe("rejected");
    expect(res.message).toBe("Credential not recognized or pass code format invalid.");
  });
});
