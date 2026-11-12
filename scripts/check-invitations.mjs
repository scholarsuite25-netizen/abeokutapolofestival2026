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

const { data: invites, error } = await supabase
  .from("invitations")
  .select("id, invitation_code, first_name, surname, designation, category, status, is_locked_to_device")
  .order("created_at", { ascending: false })
  .limit(5);

console.log("invitations table:", error ? "ERR " + error.message : `${invites.length} row(s)`);
for (const i of invites || []) {
  console.log(
    `  ${i.invitation_code} | ${String(i.first_name)} ${String(i.surname)} | ${i.designation} | ${i.category} | ${i.status} | locked=${i.is_locked_to_device}`,
  );
}
