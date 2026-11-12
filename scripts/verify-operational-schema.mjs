import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Full read-back verification of migrations 0018 + 0019, including a live
 * test of the integrity rules (the test rows are removed afterwards).
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

const service = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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

const results = [];

// 1. Tables present
const missing = [];
for (const t of expected) {
  const { error } = await service.from(t).select("*").limit(1);
  if (error) missing.push(`${t} (${error.message.slice(0, 40)})`);
}
results.push({ check: "30 new tables exist", pass: missing.length === 0, detail: missing.length ? missing.join(", ") : "all present" });

// 2. Seed rows
const seedRows = {};
for (const t of ["festival_days","gates","hospitality_packages","price_list","affiliate_commission_tiers","feature_flags","site_settings"]) {
  const { count, error } = await service.from(t).select("*", { count: "exact", head: true });
  seedRows[t] = error ? "ERR" : count;
}
const seedOk = seedRows.festival_days === 3 && seedRows.gates === 3 && seedRows.hospitality_packages === 5 && seedRows.price_list === 5 && seedRows.affiliate_commission_tiers === 5 && seedRows.feature_flags === 5 && seedRows.site_settings === 5;
results.push({ check: "reference data seeded", pass: seedOk, detail: JSON.stringify(seedRows) });

// 3. Browser (anon) is locked out of every new table
const exposed = [];
for (const t of expected) {
  const { data, error } = await anon.from(t).select("*").limit(1);
  const blocked = Boolean(error) || (data?.length ?? 0) === 0;
  if (!blocked) exposed.push(t);
}
results.push({ check: "anon locked out of all 30 tables", pass: exposed.length === 0, detail: exposed.length ? "EXPOSED: " + exposed.join(", ") : "all denied" });

// 4. A table serial can only be sold once (live test of the unique index)
const stamp = Date.now();
const row = {
  edition_id: null,
  package_id: "kings_table",
  package_name: "The Kings Table",
  table_serial: "Kings Table 01",
  buyer_name: "Verification Probe",
  buyer_email: "verify.probe@example.com",
  buyer_phone: "+234 803 555 0000",
  amount_ngn: 5000000,
  official_value_ngn: 5000000,
  payment_method: "bank_transfer",
  status: "pending_bank_verification",
};
const first = await service.from("table_bookings").insert(row).select("id").single();
const second = await service.from("table_bookings").insert(row).select("id");
const uniqueWorks = !first.error && Boolean(second.error) && second.error.code === "23505";
results.push({ check: "same table serial cannot be sold twice", pass: uniqueWorks, detail: second.error ? `${second.error.code}: ${second.error.message.slice(0, 70)}` : "SECOND INSERT SUCCEEDED - constraint missing" });

// 5. One transfer cannot pay for two bookings
const ref = `ABK-WEMA-PROBE-${stamp}`;
const r1 = await service.from("table_bookings").insert({ ...row, table_serial: "Kings Table 02", bank_transfer_ref: ref }).select("id").single();
const r2 = await service.from("table_bookings").insert({ ...row, table_serial: "Kings Table 03", bank_transfer_ref: ref }).select("id");
const refUnique = !r1.error && Boolean(r2.error) && r2.error.code === "23505";
results.push({ check: "one transfer cannot pay for two bookings", pass: refUnique, detail: r2.error ? `${r2.error.code}` : "SECOND INSERT SUCCEEDED - constraint missing" });

// 6. Fail-closed defaults: an insert with no status is NOT 'confirmed'; no amount default
const noStatus = await service.from("table_bookings").insert({ ...row, table_serial: "Kings Table 04", status: undefined }).select("status").single();
const statusDefault = noStatus.data?.status;
const noAmount = await service.from("table_bookings").insert({ ...row, table_serial: "Kings Table 05", amount_ngn: undefined, status: "pending_bank_verification" });
const amountDefaultGone = Boolean(noAmount.error);
results.push({ check: "unspecified status is an unpaid booking", pass: statusDefault === "pending_bank_verification", detail: `status defaulted to ${statusDefault}` });
results.push({ check: "no implicit ₦100 test-fee amount", pass: amountDefaultGone, detail: amountDefaultGone ? "insert without amount is refused" : `insert defaulted to ${noAmount.data?.[0]?.amount_ngn}` });

// 7. Clean up every probe row
const { error: cleanupError } = await service
  .from("table_bookings")
  .delete()
  .eq("buyer_email", "verify.probe@example.com");
results.push({ check: "probe rows removed", pass: !cleanupError, detail: cleanupError ? cleanupError.message : "clean" });

console.log("");
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.check}  —  ${r.detail}`);
}
const allPass = results.every((r) => r.pass);
console.log(`\nVERDICT: ${allPass ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`);
process.exit(allPass ? 0 : 1);
