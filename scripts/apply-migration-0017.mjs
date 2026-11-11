import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

/**
 * Applies supabase/migrations/0017_durable_rate_limits.sql to the remote
 * project (direct Postgres with SUPABASE_DB_PASSWORD), reloads the PostgREST
 * schema cache, then READS BACK the schema and exercises the RPC through the
 * service-role client — the verification step required by AGENTS.md rule 2.
 * No secrets are printed.
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

if (!env.SUPABASE_URL || !env.SUPABASE_DB_PASSWORD || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_DB_PASSWORD / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sqlPath = path.join(root, "supabase", "migrations", "0017_durable_rate_limits.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const baseHost = new URL(env.SUPABASE_URL).hostname; // <ref>.supabase.co
const dbHost = baseHost.startsWith("db.") ? baseHost : `db.${baseHost}`;

const client = new pg.Client({
  host: dbHost,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
});

const out = { dbHost, applied: false, reads: {}, rpc: {}, tableSelect: {} };

try {
  await client.connect();
  await client.query(sql);
  out.applied = true;

  // Reload PostgREST schema cache so the new table/function are exposed.
  await client.query("NOTIFY pgrst, 'reload schema';");

  const rel = await client.query(
    "select to_regclass('public.rate_limit_windows')::text as table_oid",
  );
  out.reads.tableExists = rel.rows[0].table_oid !== null;

  const rls = await client.query(
    "select relrowsecurity from pg_class where oid = to_regclass('public.rate_limit_windows')",
  );
  out.reads.rlsEnabled = rls.rows[0]?.relrowsecurity === true;

  const fn = await client.query(
    "select pronargs from pg_proc where pronamespace = 'public'::regnamespace and proname = 'consume_rate_limit'",
  );
  out.reads.rpcExists = fn.rows.length === 1 && fn.rows[0].pronargs === 3;

  const grants = await client.query(
    "select grantee, privilege_type from information_schema.role_table_grants where table_name = 'rate_limit_windows' and grantee in ('anon','authenticated')",
  );
  out.reads.anonAuthenticatedGrants = grants.rows.map((r) => `${r.grantee}:${r.privilege_type}`);

  const fnGrants = await client.query(
    "select grantee from information_schema.routine_privileges where routine_name = 'consume_rate_limit' and grantee in ('anon','authenticated')",
  );
  out.reads.rpcDeniedToAnonAuthenticated = fnGrants.rows.length === 0;
} catch (err) {
  out.applied = false;
  out.error = err.message;
} finally {
  await client.end().catch(() => {});
}

// ---- Verification through the service-role client (what the app uses) ----
try {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const first = await supabase.rpc("consume_rate_limit", {
    p_bucket: "migration-0017-verification",
    p_window_seconds: 60,
    p_max_attempts: 30,
  });
  out.rpc.firstCall = { data: first.data, error: first.error?.message ?? null };

  const second = await supabase.rpc("consume_rate_limit", {
    p_bucket: "migration-0017-verification",
    p_window_seconds: 60,
    p_max_attempts: 30,
  });
  out.rpc.secondCall = { data: second.data, error: second.error?.message ?? null };

  const sel = await supabase
    .from("rate_limit_windows")
    .select("bucket, count")
    .eq("bucket", "migration-0017-verification");
  out.tableSelect = { rows: sel.data, error: sel.error?.message ?? null };
} catch (err) {
  out.rpc.exception = err.message;
}

console.log(JSON.stringify(out, null, 2));
