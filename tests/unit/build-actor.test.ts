import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRoleQuery } = vi.hoisted(() => ({
  mockRoleQuery: {
    data: [] as Array<{ role_key: string; expires_at: string | null; revoked_at: string | null }>,
    error: null as { message: string } | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(async () => ({ data: mockRoleQuery.data, error: mockRoleQuery.error })),
      })),
    })),
  })),
}));

import { buildActor } from "@/lib/auth/session";

/**
 * Regression tests for the H1 fix: `user_role_assignments` is authoritative
 * once any row exists — neither profiles.role nor the emergency executive
 * email map may override a revocation, and query failures fail closed.
 */
describe("buildActor role authority (revocation is final)", () => {
  beforeEach(() => {
    mockRoleQuery.data = [];
    mockRoleQuery.error = null;
  });

  it("grants roles from active assignment rows", async () => {
    mockRoleQuery.data = [
      { role_key: "finance_officer", expires_at: null, revoked_at: null },
      { role_key: "media_officer", expires_at: null, revoked_at: null },
    ];

    const actor = await buildActor("user-1", "media_officer", "bursar@abeokutapolo2026.ng");
    expect([...actor.roles].sort()).toEqual(["finance_officer", "media_officer"]);
  });

  it("ignores revoked and expired assignment rows", async () => {
    mockRoleQuery.data = [
      { role_key: "super_admin", expires_at: null, revoked_at: "2026-01-01T00:00:00Z" },
      { role_key: "finance_officer", expires_at: "2026-01-01T00:00:00Z", revoked_at: null },
    ];

    const actor = await buildActor("user-1", null, null);
    expect(actor.roles).toEqual([]);
  });

  it("honors revocation: email map and profiles.role cannot resurrect a revoked super_admin", async () => {
    mockRoleQuery.data = [
      { role_key: "super_admin", expires_at: null, revoked_at: "2026-06-01T00:00:00Z" },
    ];

    const actor = await buildActor(
      "user-1",
      "super_admin",
      "superadmin@abeokutapolo2026.ng",
    );
    expect(actor.roles).toEqual([]);
  });

  it("honors revocation even when every role row is revoked but profiles.role remains set", async () => {
    mockRoleQuery.data = [
      { role_key: "general_secretary", expires_at: null, revoked_at: "2026-06-01T00:00:00Z" },
    ];

    const actor = await buildActor("user-1", "general_secretary", "secretary@abeokutapolo2026.ng");
    expect(actor.roles).toEqual([]);
  });

  it("applies profiles.role only when the account has no assignment rows (legacy bootstrap)", async () => {
    const actor = await buildActor("user-1", "general_secretary", "someone@example.com");
    expect(actor.roles).toEqual(["general_secretary"]);
  });

  it("does not escalate a profile-provisioned account through the email map", async () => {
    const actor = await buildActor("user-1", "finance_officer", "superadmin@abeokutapolo2026.ng");
    expect(actor.roles).toEqual(["finance_officer"]);
  });

  it("keeps the emergency email bootstrap for a fully unprovisioned executive account", async () => {
    const actor = await buildActor("user-1", null, "secretary@abeokutapolo2026.ng");
    expect(actor.roles).toEqual(["general_secretary"]);

    const gate = await buildActor("user-2", null, "gate2@abeokutapolo2026.ng");
    expect(gate.roles).toEqual(["security_checkin_officer"]);
  });

  it("fails closed when the assignments query errors — no profile/email fallback", async () => {
    mockRoleQuery.error = { message: "relation unavailable" };

    const actor = await buildActor("user-1", "super_admin", "superadmin@abeokutapolo2026.ng");
    expect(actor.roles).toEqual([]);
  });
});
