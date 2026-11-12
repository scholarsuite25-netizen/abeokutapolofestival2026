import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Inventories the attendee-facing tables so the test data can be removed
 * precisely (and so the removal can be reported).
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

const tables = [
  { name: "registrations", cols: "id, first_name, last_name, email, phone, status, category, pass_code, created_at" },
  { name: "credentials", cols: "id, pass_code, holder_name, status, created_at" },
  { name: "table_bookings", cols: "id, package_name, table_serial, buyer_name, buyer_email, amount_ngn, status, bank_transfer_ref, created_at" },
  { name: "complimentary_invitations", cols: "id, invitation_code, holder_name, category, status, created_at" },
  { name: "affiliate_referrals", cols: "id, affiliate_code, buyer_name, order_ref, sale_amount_ngn, status, created_at" },
  { name: "offline_commitments", cols: "id, sponsor_name, tier, proposed_amount, confirmed_amount, status, reference_code, created_at" },
  { name: "payment_claims", cols: "id, reference, amount_ngn, quantity, created_at" },
];

for (const t of tables) {
  const { data, error } = await supabase.from(t.name).select(t.cols).limit(200);
  if (error) {
    console.log(`\n### ${t.name}: ERROR ${error.message}`);
    continue;
  }
  console.log(`\n### ${t.name} (${data.length} rows)`);
  for (const row of data) {
    const who = row.email || row.buyer_email || row.holder_name || row.sponsor_name || "";
    console.log(
      `  ${String(row.id).slice(0, 8)} | ${(row.status || "-").padEnd(26)} | ${String(who).slice(0, 34).padEnd(34)} | ${(row.pass_code || row.bank_transfer_ref || row.invitation_code || row.order_ref || row.reference || "-").slice(0, 26)}`,
    );
  }
}
