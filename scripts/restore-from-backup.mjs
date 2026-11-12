import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Restores the database from the most recent nightly backup (private bucket
 * `club-backups`), or from a named backup file.
 *
 *   node scripts/restore-from-backup.mjs            # dry run — shows what it would do
 *   node scripts/restore-from-backup.mjs --confirm   # actually writes
 *   node scripts/restore-from-backup.mjs --confirm --file backup-2026-12-01-00-00-00Z.json
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

const BUCKET = "club-backups";
const confirm = process.argv.includes("--confirm");
const fileIndex = process.argv.indexOf("--file");
const named = fileIndex >= 0 ? process.argv[fileIndex + 1] : null;

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: files, error: listError } = await supabase.storage.from(BUCKET).list();
if (listError) {
  console.error("Could not list backups:", listError.message);
  process.exit(1);
}

const backups = (files || [])
  .filter((f) => f.name?.startsWith("backup-") && f.name?.endsWith(".json"))
  .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
if (!backups.length) {
  console.error("No backups found in the bucket.");
  process.exit(1);
}

const chosen = named || backups[backups.length - 1].name;
console.log(`selected backup: ${chosen}`);

const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(chosen);
if (downloadError || !data) {
  console.error("Download failed:", downloadError?.message);
  process.exit(1);
}

const parsed = JSON.parse(await data.text());
console.log(
  `backup taken ${parsed.created_at} · ${parsed.tables.length} tables · ${parsed.row_count} rows`,
);

if (!confirm) {
  console.log("\nDRY RUN — nothing written. Re-run with --confirm to restore.");
  for (const [table, rows] of Object.entries(parsed.data)) {
    console.log(`  ${table}: ${rows.length} rows`);
  }
  process.exit(0);
}

console.log("\nRESTORING…");
for (const [table, rows] of Object.entries(parsed.data)) {
  if (!rows.length) continue;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  console.log(`  ${table}: ${rows.length} rows ${error ? "FAILED " + error.message : "restored"}`);
}
console.log("\nRestore complete.");
