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

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
if (error) {
  console.error("listUsers failed:", error.message);
  process.exit(1);
}
console.log(`auth users: ${data.users.length}`);
for (const u of data.users) {
  const { data: prof } = await supabase
    .from("profiles")
    .select("role, full_name, is_active")
    .eq("id", u.id)
    .maybeSingle();
  const { data: assigns } = await supabase
    .from("user_role_assignments")
    .select("role_key, revoked_at, expires_at")
    .eq("user_id", u.id);
  console.log(
    `  ${u.id} | ${u.email} | profile.role=${prof?.role ?? "-"} | active=${prof?.is_active} | assignments=${(assigns || [])
      .map((a) => `${a.role_key}${a.revoked_at ? "(revoked)" : ""}`)
      .join(",") || "-"} | confirmed=${u.email_confirmed_at ? "yes" : "no"} | mfa=${(u.factors || []).length}`,
  );
}
