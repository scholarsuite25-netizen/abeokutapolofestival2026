import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { adaptiveInsert } from "@/lib/db/adaptive-insert";

/**
 * Review finding M1: adaptiveInsert pruned columns from the payload silently,
 * so remote schema drift dropped data without any trace. Every prune must now
 * warn loudly and be reported in `prunedColumns`.
 */
describe("adaptiveInsert — schema-drift pruning visibility (M1)", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeSupabase(
    responses: Array<{ data?: unknown; error?: { message: string } | null }>,
  ) {
    const payloads: Array<Record<string, unknown>> = [];
    let call = 0;
    const supabase = {
      from: (_table: string) => ({
        insert: (payload: Record<string, unknown>) => {
          payloads.push({ ...payload });
          return {
            select: (_query: string) => ({
              maybeSingle: async () => {
                const res = responses[Math.min(call, responses.length - 1)];
                call += 1;
                return { data: res.data ?? null, error: res.error ?? null };
              },
            }),
          };
        },
      }),
    };
    return { supabase: supabase as any, payloads };
  }

  it("prunes a missing column, warns, retries, and reports prunedColumns", async () => {
    const { supabase, payloads } = makeSupabase([
      { error: { message: "Could not find the 'legacy_color' column in the schema cache" } },
      { data: { id: "row-1" }, error: null },
    ]);

    const result = await adaptiveInsert(
      supabase,
      "credentials",
      { pass_code: "ABK-2026-X7K9", legacy_color: "gold" },
      "id",
    );

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: "row-1" });
    expect(result.prunedColumns).toEqual(["legacy_color"]);
    // First attempt carried the column; the retry must not.
    expect(payloads[0]).toHaveProperty("legacy_color");
    expect(payloads[1]).not.toHaveProperty("legacy_color");
    // Silent pruning is the bug — a warning must be emitted.
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("legacy_color");
    expect(String(warnSpy.mock.calls[0][0])).toContain("credentials");
  });

  it("prunes columns reported in the 'of relation ... does not exist' format", async () => {
    const { supabase } = makeSupabase([
      { error: { message: 'column "guest_notes" of relation "registrations" does not exist' } },
      { data: { id: "row-2" }, error: null },
    ]);

    const result = await adaptiveInsert(supabase, "registrations", {
      email: "a@example.com",
      guest_notes: "VIP",
    });

    expect(result.error).toBeNull();
    expect(result.prunedColumns).toEqual(["guest_notes"]);
  });

  it("returns non-schema errors immediately without pruning", async () => {
    const { supabase, payloads } = makeSupabase([
      { error: { message: 'duplicate key value violates unique constraint "credentials_pass_code_key"' } },
    ]);

    const result = await adaptiveInsert(supabase, "credentials", {
      pass_code: "ABK-2026-DUP1",
    });

    expect(result.data).toBeNull();
    expect(result.error?.message).toContain("duplicate key");
    expect(result.prunedColumns).toEqual([]);
    expect(payloads).toHaveLength(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not prune a column that is absent from the payload", async () => {
    const { supabase, payloads } = makeSupabase([
      { error: { message: "Could not find the 'missing_col' column in the schema cache" } },
    ]);

    const result = await adaptiveInsert(supabase, "affiliates", { email: "b@example.com" });

    expect(result.error?.message).toContain("missing_col");
    expect(result.prunedColumns).toEqual([]);
    expect(payloads).toHaveLength(1);
  });

  it("prunes every missing column and surfaces the terminal error", async () => {
    const { supabase } = makeSupabase([
      { error: { message: "Could not find the 'a' column in the schema cache" } },
      { error: { message: "Could not find the 'b' column in the schema cache" } },
      { error: { message: "Could not find the 'c' column in the schema cache" } },
      { error: { message: "insert failed after pruning" } },
    ]);

    const result = await adaptiveInsert(supabase, "table_bookings", {
      a: 1,
      b: 2,
      c: 3,
    });

    expect(result.data).toBeNull();
    expect(result.prunedColumns).toEqual(["a", "b", "c"]);
    expect(result.error?.message).toBe("insert failed after pruning");
    expect(warnSpy).toHaveBeenCalledTimes(3);
  });
});
