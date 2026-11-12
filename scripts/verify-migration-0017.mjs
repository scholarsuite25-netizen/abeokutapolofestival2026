import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Read-back verification for supabase/migrations/0017_durable_rate_limits.sql
 * after it has been applied to the remote project (AGENTS.md rule 2).
 *
 * Runs entirely over HTTPS with the service-role key (the same path the app
 * uses) plus the anon key to prove the lockdown:
 *   1. RPC counts attempts and denies once the fixed window is exhausted.
 *   2. The service role can read the counter row back.
 *   3. anon gets NOTHING from the table (RLS enabled, zero policies, revoked).
 *   4. anon cannot execute the RPC (execute revoked).
 * Cleans up its own verification bucket afterwards. No secrets are printed.
 */

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts);
const anon = createClient(env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts);

const bucket = `migration-0017-verify-${Date.now()}`;
const out = { bucket, rpc: {}, table: {}, anon: {}, cleanup: {} };

// 1. Service-role RPC: allow, allow, then DENY (max_attempts = 2).
const rpc = (client, p_max_attempts) =>
  client.rpc("consume_rate_limit", {
    p_bucket: bucket,
    p_window_seconds: 60,
    p_max_attempts,
  });

const r1 = await rpc(service, 2);
const r2 = await rpc(service, 2);
const r3 = await rpc(service, 2);
out.rpc = {
  first: { data: r1.data, error: r1.error?.message ?? null },
  second: { data: r2.data, error: r2.error?.message ?? null },
  third: { data: r3.data, error: r3.error?.message ?? null },
  behavesAsExpected:
    r1.data === true && r2.data === true && r3.data === false && !r1.error && !r2.error && !r3.error,
};

// 2. Service-role read-back of the counter row.
const sel = await service
  .from("rate_limit_windows")
  .select("bucket, count, window_start")
  .eq("bucket", bucket);
out.table = {
  rows: sel.data,
  error: sel.error?.message ?? null,
  countIsThree: sel.data?.[0]?.count === 3,
};

// 3. anon must be blocked by RLS on the table.
const anonSel = await anon.from("rate_limit_windows").select("bucket").limit(1);
out.anon.tableSelect = {
  rows: anonSel.data,
  error: anonSel.error?.message ?? null,
  blocked: anonSel.error !== null || (anonSel.data?.length ?? 0) === 0,
};

// 4. anon must not be able to execute the RPC.
const anonRpc = await anon.rpc("consume_rate_limit", {
  p_bucket: `${bucket}-anon`,
  p_window_seconds: 60,
  p_max_attempts: 2,
});
out.anon.rpc = {
  data: anonRpc.data,
  error: anonRpc.error?.message ?? null,
  blocked: anonRpc.error !== null,
};

// Cleanup: remove our verification rows.
const del = await service.from("rate_limit_windows").delete().eq("bucket", bucket);
out.cleanup = { error: del.error?.message ?? null };

const pass =
  out.rpc.behavesAsExpected &&
  out.table.countIsThree &&
  out.anon.tableSelect.blocked &&
  out.anon.rpc.blocked &&
  !out.cleanup.error;

out.VERDICT = pass ? "PASS" : "FAIL";
console.log(JSON.stringify(out, null, 2));
process.exit(pass ? 0 : 1);
