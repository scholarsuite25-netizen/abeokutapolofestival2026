import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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

const expected = [
  "festival_days","gates","hospitality_packages","price_list","affiliate_commission_tiers",
  "attendee_devices","attendee_notes","table_holds","table_seats","payment_ledger",
  "bank_transfer_receipts","refunds","affiliate_payouts","commitment_payments",
  "invitations","invitation_audit","gate_incidents","scanner_devices","denied_admissions",
  "notification_log","reminder_log","message_templates","feature_flags",
  "feature_flag_history","site_settings","announcements","fraud_alerts",
  "security_events","report_exports","help_requests",
];

const present = [];
const missing = [];
for (const t of expected) {
  const { error } = await supabase.from(t).select("*").limit(1);
  if (error) missing.push(t);
  else present.push(t);
}
console.log(`tables present: ${present.length}/30`);
if (present.length) console.log("  present: " + present.join(", "));
if (missing.length) console.log("  missing: " + missing.join(", "));

// Seed rows?
for (const t of ["festival_days", "gates", "hospitality_packages", "feature_flags", "site_settings"]) {
  if (!present.includes(t)) continue;
  const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
  console.log(`  ${t}: ${error ? "ERR " + error.message : count + " rows"}`);
}
