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

const code = process.argv[2] || "ABK-2026-IVP01-S01-X97E";

const { data: cred } = await supabase
  .from("credentials")
  .select("pass_code, holder_name, status, is_vvip, is_locked_to_device, bound_device_id, claimed_at, day3_status")
  .eq("pass_code", code)
  .maybeSingle();
console.log("credential:", JSON.stringify(cred, null, 2));

const { data: bookings } = await supabase
  .from("table_bookings")
  .select("buyer_name, amount_ngn, official_value_ngn, status, bank_transfer_ref")
  .eq("buyer_email", "rehearsal.guest@example.com");
console.log("booking:", JSON.stringify(bookings, null, 2));

const { data: events } = await supabase
  .from("check_in_events")
  .select("gate, result, scanned_at")
  .order("scanned_at", { ascending: false })
  .limit(5);
console.log("scans:", JSON.stringify(events, null, 2));
