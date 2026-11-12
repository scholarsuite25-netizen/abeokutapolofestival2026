import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/** Removes the dress-rehearsal records so the database is clean for real guests. */
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

const EMAIL = "rehearsal.guest@example.com";
const CODES = ["ABK-2026-IVP01-S01-X97E", "ABK-2026-PROBE-1"];

// 1. Scan events for the rehearsal credential
const { data: creds } = await supabase
  .from("credentials")
  .select("id, pass_code")
  .in("pass_code", CODES);
const credIds = (creds || []).map((c) => c.id);
if (credIds.length) {
  await supabase.from("check_in_events").delete().in("credential_id", credIds);
}
await supabase.from("check_in_events").delete().eq("pass_code_seen", "ABK-2026-IVP01-S01-X97E");

// 2. Credentials
await supabase.from("credentials").delete().in("pass_code", CODES);

// 3. Registration + booking
const { data: regs } = await supabase
  .from("registrations")
  .select("id")
  .eq("email", EMAIL);
for (const r of regs || []) {
  await supabase.from("credentials").delete().eq("registration_id", r.id);
}
await supabase.from("registrations").delete().eq("email", EMAIL);
await supabase.from("table_bookings").delete().eq("buyer_email", EMAIL);

// 4. Any leftover rehearsal audit rows
await supabase
  .from("audit_logs")
  .delete()
  .eq("resource_type", "table_booking")
  .eq("resource_id", "individual_vip:Regular Pass 01");

// Report the final state
for (const t of ["registrations", "credentials", "table_bookings", "check_in_events", "invitations"]) {
  const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
  console.log(`${t}: ${count} rows`);
}
