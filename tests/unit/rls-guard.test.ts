import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static RLS guard: every table created in a migration must have
 * `enable row level security` in the same migration (ARCHITECTURE_PLAN.md §6.5).
 * This is the Phase 1 stand-in; live allow/deny tests against a local Supabase
 * run in Phase 2 (supabase/tests/).
 */

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

const tables = (sql: string) => [...sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)].map((m) => m[1]!);
const rlsEnabled = (sql: string) => [...sql.matchAll(/alter table public\.(\w+) enable row level security/gi)].map((m) => m[1]!);

describe("migrations enforce RLS", () => {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));

  it("has at least two ordered migrations", () => {
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  for (const file of files) {
    describe(file, () => {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      const created = tables(sql);
      const protectedTables = rlsEnabled(sql);

      it("enables RLS on every table it creates", () => {
        const missing = created.filter((t) => !protectedTables.includes(t));
        expect(missing, `tables without RLS in ${file}`).toEqual([]);
      });
    });
  }
});
