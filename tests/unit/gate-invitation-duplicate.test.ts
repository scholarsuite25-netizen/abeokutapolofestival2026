import { describe, it, expect, vi, beforeEach } from "vitest";

const { mocks } = vi.hoisted(() => {
  const state: {
    priorEvents: Array<{
      gate: string | null;
      event_day: number | null;
      details: Record<string, unknown> | null;
    }>;
    priorError: { message: string } | null;
  } = { priorEvents: [], priorError: null };

  const checkInSelect = vi.fn(() => {
    const chain = {
      eq: () => chain,
      order: () => chain,
      limit: () => Promise.resolve({ data: state.priorEvents, error: state.priorError }),
    };
    return chain;
  });
  const checkInInsert = vi.fn(() => Promise.resolve({ error: null }));
  const invitationGet = vi.fn();

  return { mocks: { state, checkInSelect, checkInInsert, invitationGet } };
});

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return { ...actual, isSupabaseConfigured: () => true };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn((table: string) => {
      if (table === "check_in_events") {
        return {
          select: mocks.checkInSelect,
          insert: mocks.checkInInsert,
        };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    }),
  }),
}));

vi.mock("@/lib/invitations/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/invitations/storage")>();
  return { ...actual, getInvitationByCode: mocks.invitationGet };
});

import { processGateScan } from "@/app/(ops)/scan/actions";

/**
 * Regression tests for the H2 fix: complimentary-invitation admission must be
 * deduplicated against persisted `check_in_events` history — the in-memory
 * ledger alone loses history on cold starts and across serverless instances.
 *
 * NOTE: `localAttendanceCache` is module-level state shared across tests in
 * this file, so each scenario uses a unique invitation code.
 */
describe("Gate scan — DB-backed invitation duplicate detection", () => {
  beforeEach(() => {
    mocks.state.priorEvents = [];
    mocks.state.priorError = null;
    mocks.checkInSelect.mockClear();
    mocks.checkInInsert.mockClear();
    mocks.invitationGet.mockReset();
  });

  function invitation(code: string) {
    return {
      id: `00000000-0000-0000-0000-${code.slice(-12).padStart(12, "0")}`,
      invitationCode: code,
      firstName: "Kola",
      surname: "Alabi",
      designation: "Chairman",
      category: "VVIP",
      isCustomCategory: false,
      securitySeal: "Aare Elesin",
      status: "active" as const,
      claimedAt: null,
      createdAt: new Date().toISOString(),
    };
  }

  it("rejects an invitation already admitted today on another instance (persisted history)", async () => {
    const code = "ABK-2026-INV-DUPA";
    mocks.invitationGet.mockResolvedValue(invitation(code));
    mocks.state.priorEvents = [
      { gate: "Gate 1 - Royal Gate", event_day: 1, details: { eventDay: 1 } },
    ];

    const res = await processGateScan({
      passIdentifier: code,
      gate: "Gate 2 - General Turnstiles",
      eventDay: 1,
    });

    expect(res.status).toBe("duplicate");
    expect(res.result).toBe("already_admitted");
    expect(res.lastGate).toBe("Gate 1 - Royal Gate");
    expect(res.message).toContain("already been admitted on Day 1");
    expect(mocks.checkInInsert).not.toHaveBeenCalled();
  });

  it("admits the first scan, persists event_day, and serves the repeat scan from memory", async () => {
    const code = "ABK-2026-INV-ADMB";
    mocks.invitationGet.mockResolvedValue(invitation(code));
    mocks.state.priorEvents = [];

    const first = await processGateScan({
      passIdentifier: code,
      gate: "Gate 2 - General Turnstiles",
      eventDay: 1,
    });
    expect(first.status).toBe("valid");
    expect(first.result).toBe("admitted");
    expect(mocks.checkInInsert).toHaveBeenCalledTimes(1);
    expect(mocks.checkInInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        credential_id: expect.any(String),
        result: "admitted",
        event_day: 1,
      }),
    );

    const repeat = await processGateScan({
      passIdentifier: code,
      gate: "Gate 3 - Media & VIP",
      eventDay: 1,
    });
    expect(repeat.status).toBe("duplicate");
    expect(repeat.result).toBe("already_admitted");
    // Memory fast-path: the DB is not consulted again for this instance.
    expect(mocks.checkInSelect).toHaveBeenCalledTimes(1);
  });

  it("allows admission on a different event day than persisted history", async () => {
    const code = "ABK-2026-INV-DAYC";
    mocks.invitationGet.mockResolvedValue(invitation(code));
    mocks.state.priorEvents = [
      { gate: "Gate 1 - Royal Gate", event_day: 1, details: { eventDay: 1 } },
    ];

    const res = await processGateScan({
      passIdentifier: code,
      gate: "Gate 2 - General Turnstiles",
      eventDay: 2,
    });

    expect(res.status).toBe("valid");
    expect(res.result).toBe("admitted");
    expect(mocks.checkInInsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_day: 2 }),
    );
  });

  it("falls back to the event_day column for legacy rows without details.eventDay", async () => {
    const code = "ABK-2026-INV-LEGD";
    mocks.invitationGet.mockResolvedValue(invitation(code));
    mocks.state.priorEvents = [
      { gate: "Gate 2 - General Turnstiles", event_day: 3, details: {} },
    ];

    const res = await processGateScan({
      passIdentifier: code,
      gate: "Gate 2 - General Turnstiles",
      eventDay: 3,
    });

    expect(res.status).toBe("duplicate");
    expect(res.result).toBe("already_admitted");
  });

  it("still admits from the in-memory ledger when the history query errors", async () => {
    const code = "ABK-2026-INV-ERRQ";
    mocks.invitationGet.mockResolvedValue(invitation(code));
    mocks.state.priorError = { message: "timeout" };
    mocks.state.priorEvents = [];

    const res = await processGateScan({
      passIdentifier: code,
      gate: "Gate 2 - General Turnstiles",
      eventDay: 1,
    });

    expect(res.status).toBe("valid");
    expect(res.result).toBe("admitted");
  });

  it("honors the revoked invitation status before any admission", async () => {
    const code = "ABK-2026-INV-REVK";
    mocks.invitationGet.mockResolvedValue({ ...invitation(code), status: "revoked" });

    const res = await processGateScan({ passIdentifier: code, eventDay: 1 });
    expect(res.status).toBe("revoked");
    expect(res.result).toBe("rejected");
    expect(mocks.checkInInsert).not.toHaveBeenCalled();
  });
});
