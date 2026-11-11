import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({
  configured: true,
  boundRow: null as Record<string, unknown> | null,
  selectError: null as { message: string } | null,
  updateRows: [] as Array<{ id: string }>,
  updateError: null as { message: string } | null,
  updates: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/env")>()),
  isSupabaseConfigured: () => h.configured,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "credentials") {
        throw new Error(`Unexpected table in device-binding test: ${table}`);
      }
      return {
        // Read path: .select(...).eq(...).maybeSingle()
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: h.boundRow, error: h.selectError }),
          }),
        }),
        // Write path: .update(...).eq(...).select(...)
        update: (payload: Record<string, unknown>) => ({
          eq: () => ({
            select: async () => {
              h.updates.push({ ...payload });
              return { data: h.updateRows, error: h.updateError };
            },
          }),
        }),
      };
    },
  }),
}));

vi.mock("@/lib/supabase/audit", () => ({
  writeAudit: vi.fn(async () => true),
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
}));

import {
  getPassBindingRecord,
  verifyPassDeviceBinding,
  resetPassDeviceBinding,
} from "@/lib/security/device-binding";
import { writeAudit } from "@/lib/supabase/audit";

/**
 * Review finding L3: device bindings lived in a per-instance memory registry.
 * The durable `credentials.bound_device_id` registry is now authoritative:
 * DB-first reads, persist-before-claim, and fail-closed resets.
 *
 * These tests run WITH Supabase "configured" (mocked) — the unconfigured
 * memory-only path is covered by the existing e2e suites.
 */
describe("Device binding — durable registry (L3)", () => {
  beforeEach(() => {
    h.configured = true;
    h.boundRow = null;
    h.selectError = null;
    h.updateRows = [];
    h.updateError = null;
    h.updates = [];
    vi.mocked(writeAudit).mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("treats the database record as the source of truth for reads", async () => {
    const code = "ABK-2026-DBTRUTH";
    h.boundRow = {
      id: "cred-1",
      bound_device_id: "DEV-A",
      holder_name: "Ada Okoye",
      created_at: "2026-12-01T00:00:00Z",
      claimed_at: "2026-12-02T00:00:00Z",
    };

    const record = await getPassBindingRecord(code);
    expect(record?.deviceId).toBe("DEV-A");
    expect(record?.holderName).toBe("Ada Okoye");

    const wrong = await verifyPassDeviceBinding(code, "DEV-B");
    expect(wrong.isAuthorized).toBe(false);
    expect(wrong.status).toBe("forwarding_blocked");

    const right = await verifyPassDeviceBinding(code, "DEV-A");
    expect(right.isAuthorized).toBe(true);
    expect(right.status).toBe("already_bound_to_this_device");
  });

  it("purges stale in-memory records when the registry reports unbound", async () => {
    const code = "ABK-2026-DBSTALE";
    h.boundRow = {
      id: "cred-2",
      bound_device_id: "DEV-OLD",
      holder_name: "Kemi",
      created_at: "2026-12-01T00:00:00Z",
      claimed_at: null,
    };
    const first = await getPassBindingRecord(code);
    expect(first?.deviceId).toBe("DEV-OLD"); // cached in this instance's memory

    // Binding reset performed on ANOTHER instance -> registry row now unbound.
    h.boundRow = {
      id: "cred-2",
      bound_device_id: null,
      holder_name: "Kemi",
      created_at: "2026-12-01T00:00:00Z",
      claimed_at: null,
    };
    expect(await getPassBindingRecord(code)).toBeNull();

    // The local memory copy must be gone too, not just shadowed.
    h.configured = false;
    expect(await getPassBindingRecord(code)).toBeNull();
  });

  it("falls back to memory for passes with no credential row (invitation codes)", async () => {
    const code = "ABK-2026-INV-NOROW";
    h.configured = false;
    await verifyPassDeviceBinding(code, "DEV-MEM", "Senator Adeyemi");

    h.configured = true;
    h.boundRow = null; // row does not exist -> not an authoritative answer
    const record = await getPassBindingRecord(code);
    expect(record?.deviceId).toBe("DEV-MEM");
  });

  it("persists the binding to the registry BEFORE claiming newly_bound", async () => {
    const code = "ABK-2026-DBPERSIST";
    h.boundRow = { id: "cred-3", bound_device_id: null, holder_name: "Tolu", created_at: "2026-12-01T00:00:00Z", claimed_at: null };
    h.updateRows = [{ id: "cred-3" }];

    const res = await verifyPassDeviceBinding(code, "DEV-NEW", "Tolu Bello");

    expect(res.isAuthorized).toBe(true);
    expect(res.status).toBe("newly_bound");
    expect(h.updates).toHaveLength(1);
    expect(h.updates[0]).toMatchObject({
      bound_device_id: "DEV-NEW",
      is_locked_to_device: true,
    });
    expect(vi.mocked(writeAudit)).toHaveBeenCalledWith(
      expect.objectContaining({ action: "pass.device_bound", entityId: code }),
    );
  });

  it("fails closed when the registry has no row to persist the binding to", async () => {
    const code = "ABK-2026-DBNOROW";
    h.boundRow = null;
    h.updateRows = []; // update affects zero rows

    const res = await verifyPassDeviceBinding(code, "DEV-X", "Ada");

    expect(res.isAuthorized).toBe(false);
    expect(res.status).toBe("persistence_failed");
    expect(res.message).toContain("Secretariat");
    expect(vi.mocked(writeAudit)).not.toHaveBeenCalled();
  });

  it("fails closed (and claims nothing in memory) when the registry write errors", async () => {
    const code = "ABK-2026-DBWRITEERR";
    h.boundRow = { id: "cred-4", bound_device_id: null, holder_name: "Uche", created_at: "2026-12-01T00:00:00Z", claimed_at: null };
    h.updateError = { message: "connection refused" };
    h.updateRows = [];

    const res = await verifyPassDeviceBinding(code, "DEV-Y", "Uche");

    expect(res.isAuthorized).toBe(false);
    expect(res.status).toBe("persistence_failed");
    expect(vi.mocked(writeAudit)).not.toHaveBeenCalled();

    // Nothing may linger in the local registry — the pass is NOT claimed.
    h.configured = false;
    expect(await getPassBindingRecord(code)).toBeNull();
  });

  it("returns success:false when the durable reset fails (no silent unlock)", async () => {
    const code = "ABK-2026-DBRESETF";
    h.updateError = { message: "timeout" };
    h.updateRows = [];

    const result = await resetPassDeviceBinding(code);
    expect(result.success).toBe(false);
    expect(vi.mocked(writeAudit)).not.toHaveBeenCalled();
  });

  it("resets durably and audits independently of the outcome", async () => {
    const code = "ABK-2026-DBRESETOK";
    h.updateRows = [{ id: "cred-5" }];
    h.updateError = null;

    const result = await resetPassDeviceBinding(code);
    expect(result.success).toBe(true);
    expect(vi.mocked(writeAudit)).toHaveBeenCalledWith(
      expect.objectContaining({ action: "pass.device_reset", entityId: code }),
    );

    // Audit failure must never flip a successful reset.
    vi.mocked(writeAudit).mockRejectedValueOnce(new Error("audit down"));
    const second = await resetPassDeviceBinding(code);
    expect(second.success).toBe(true);
  });

  it("keeps the unconfigured (memory-only) path working unchanged", async () => {
    const code = "ABK-2026-DBMEMONLY";
    h.configured = false;

    const bind = await verifyPassDeviceBinding(code, "DEV-LOCAL", "Local Guest");
    expect(bind.isAuthorized).toBe(true);
    expect(bind.status).toBe("newly_bound");
    expect(h.updates).toHaveLength(0); // no database involved
    expect(vi.mocked(writeAudit)).not.toHaveBeenCalled();

    const repeat = await verifyPassDeviceBinding(code, "DEV-LOCAL");
    expect(repeat.status).toBe("already_bound_to_this_device");

    const reset = await resetPassDeviceBinding(code);
    expect(reset.success).toBe(true);
    expect(await getPassBindingRecord(code)).toBeNull();
  });
});
