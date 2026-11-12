import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Triggers the nightly backup against the live site and verifies that a
 * backup file landed in the private bucket.
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

const SITE =
  process.env.SITE_URL || "https://www.abeokutapolofestival2026.org.ng";
const secret = env.CRON_SECRET;

// 1. Headers (CSP etc.)
const head = await fetch(SITE, { method: "HEAD" });
console.log("--- response headers ---");
for (const key of [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
]) {
  console.log(`  ${key}: ${head.headers.get(key) ? "present" : "MISSING"}`);
}

// 2. Trigger the backup
const res = await fetch(`${SITE}/api/ops/backup`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});
const body = await res.json().catch(() => ({}));
console.log(`\nbackup trigger: ${res.status} ${JSON.stringify(body)}`);

// 3. Confirm the file is in the private bucket
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: files } = await supabase.storage.from("club-backups").list();
console.log(`\nbucket 'club-backups' holds ${files?.length ?? 0} backup file(s):`);
for (const f of files || []) console.log(`  ${f.name} (${f.size ?? "?"} bytes)`);

// 4. Confirm the bucket is private
const { data: buckets } = await supabase.storage.listBuckets();
const bucket = buckets?.find((b) => b.name === "club-backups");
console.log(`\nbucket public: ${bucket?.public ?? "unknown"} (must be false)`);
