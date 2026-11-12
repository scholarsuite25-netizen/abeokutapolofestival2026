import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/** Removes backup files that were written before the table discovery fix. */
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

const { data: files } = await supabase.storage.from("club-backups").list();
for (const f of files || []) {
  if (!f.name) continue;
  const { data, error } = await supabase.storage.from("club-backups").download(f.name);
  if (error || !data) continue;
  const parsed = JSON.parse(await data.text());
  const tableCount = Object.keys(parsed.tables || {}).length;
  const isBogus = tableCount < 30;
  console.log(
    `${f.name}: ${tableCount} tables, ${parsed.row_count} rows ${isBogus ? "-> DELETING (pre-fix file)" : "-> keeping"}`,
  );
  if (isBogus) {
    await supabase.storage.from("club-backups").remove([f.name]);
  }
}

const { data: left } = await supabase.storage.from("club-backups").list();
console.log(`\nbucket now holds ${left?.length ?? 0} file(s)`);
