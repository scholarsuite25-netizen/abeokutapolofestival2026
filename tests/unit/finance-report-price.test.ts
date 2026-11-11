import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/env")>()),
  isSupabaseConfigured: () => true,
}));

vi.mock("@/lib/auth/require", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/require")>();
  return {
    ...actual,
    requirePermission: vi.fn(async () => ({
      user: { id: "admin-test-1" },
      profile: null,
      actor: { userId: "admin-test-1", roles: ["super_admin"] },
    })),
  };
});

const rows = vi.hoisted(() => ({
  commitments: [
    {
      entity_name: "Lagos Royals Ltd",
      tier: "Royal Table",
      proposed_amount: 3_000_000,
      confirmed_amount: 3_000_000,
      status: "confirmed",
      created_at: "2026-12-01T10:00:00Z",
    },
  ],
  bankWires: [
    {
      first_name: "Tunde",
      last_name: "Bakare",
      category: "Day 3 VVIP",
      status: "confirmed",
      created_at: "2026-12-02T09:00:00Z",
    },
    {
      first_name: "Funmi",
      last_name: "Adeleke",
      category: "Day 3 VVIP",
      status: "pending_bank_verification",
      created_at: "2026-12-03T09:00:00Z",
    },
  ],
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const respond = (data: unknown) => {
        const chain = {
          in: () => chain,
          order: () => Promise.resolve({ data, error: null }),
        };
        return { select: () => chain };
      };
      if (table === "offline_commitments") return respond(rows.commitments);
      if (table === "registrations") return respond(rows.bankWires);
      throw new Error(`Unexpected table in finance report test: ${table}`);
    },
  }),
}));

import { GET } from "@/app/api/admin/reports/[id]/route";
import { DAY3_VVIP_OFFICIAL_PRICE_NGN } from "@/lib/config/checkout-config";

/**
 * Review finding M3: the offline-finance CSV hardcoded ₦50,000 in two places
 * instead of reading the single source of truth in lib/config/checkout-config.
 */
describe("Admin finance report CSV — official price source of truth (M3)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits the official Day 3 VVIP price from checkout-config for bank wires", async () => {
    const req = new NextRequest(
      "http://localhost/api/admin/reports/offline-finance",
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: "offline-finance" }),
    });

    expect(res.status).toBe(200);
    const csv = await res.text();
    const price = String(DAY3_VVIP_OFFICIAL_PRICE_NGN);

    // Confirmed bank transfer -> claimed amount equals the official price.
    expect(csv).toContain(`Tunde Bakare,Day 3 VVIP,${price},${price},confirmed`);
    // Unverified bank transfer -> ₦0 confirmed (Day 3 strict paywall intact).
    expect(csv).toContain(
      `Funmi Adeleke,Day 3 VVIP,${price},0,pending_bank_verification`,
    );
    // Offline commitments still carry their own recorded amounts.
    expect(csv).toContain("Lagos Royals Ltd,Royal Table,3000000,3000000,confirmed");
  });

  it("route source contains no hardcoded 50,000 literal", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "app", "api", "admin", "reports", "[id]", "route.ts"),
      "utf-8",
    );
    expect(src).not.toMatch(/\b50[,_]?000\b/);
    expect(src).toContain("DAY3_VVIP_OFFICIAL_PRICE_NGN");
  });
});
