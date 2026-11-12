import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Clears the attendee data created during testing so the site opens clean for
 * real guests.
 *
 * REMOVED (attendee-facing):
 *   - check_in_events   (test turnstile scans)
 *   - table_bookings    (test table reservations)
 *   - registrations     (test registrations)
 *   - credentials       (test passes / provisional claim slips)
 *   - rate_limit_windows (verification scratch rows)
 *
 * KEPT (operations must keep working):
 *   - profiles / auth users  (staff & admin accounts)
 *   - audit_logs             (audit trail)
 *   - affiliates, festival_editions, configuration tables
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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const wipe = async (table, label, applyFilter) => {
  const before = await supabase.from(table).select("*", { count: "exact", head: true });
  const { error } = applyFilter(supabase.from(table).delete());
  if (error) {
    console.log(`- ${label}: DELETE FAILED (${error.message.slice(0, 80)})`);
    return;
  }
  const after = await supabase.from(table).select("*", { count: "exact", head: true });
  console.log(`- ${label}: ${before.count ?? "?"} -> ${after.count ?? "?"} rows`);
};

console.log("WIPING TEST ATTENDEE DATA");
await wipe("check_in_events", "check_in_events", (q) => q.gt("id", 0));
await wipe("table_bookings", "table_bookings", (q) =>
  q.neq("id", "00000000-0000-0000-0000-000000000000"),
);
await wipe("registrations", "registrations", (q) =>
  q.neq("id", "00000000-0000-0000-0000-000000000000"),
);
await wipe("credentials", "credentials", (q) =>
  q.neq("id", "00000000-0000-0000-0000-000000000000"),
);
await wipe("rate_limit_windows", "rate_limit_windows", (q) => q.gt("bucket", ""));

console.log("\nKEPT (operations)");
for (const t of ["profiles", "audit_logs", "affiliates"]) {
  const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
  console.log(`  ${t}: ${count} rows`);
}

const { data: staff } = await supabase
  .from("profiles")
  .select("email, full_name, role, is_active")
  .order("role");
console.log("\nSTAFF ACCOUNTS RETAINED");
for (const s of staff || []) {
  console.log(`  ${String(s.role).padEnd(22)} ${String(s.email).padEnd(38)} active=${s.is_active}`);
}
