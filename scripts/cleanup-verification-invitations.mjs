import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/** Removes verification-only invitations and their credentials. */
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

const codes = (process.argv[2] || "ABK-2026-INV-WAVP").split(",");

const delInv = await supabase.from("invitations").delete().in("invitation_code", codes);
const delCred = await supabase.from("credentials").delete().in("pass_code", codes);
const delAudit = await supabase.from("invitation_audit").delete().in("invitation_id", []);

console.log("removed invitations:", delInv.error ? delInv.error.message : "ok");
console.log("removed credentials:", delCred.error ? delCred.error.message : "ok");
void delAudit;

const { data: left } = await supabase.from("invitations").select("invitation_code");
const { data: creds } = await supabase.from("credentials").select("pass_code");
console.log(`invitations now: ${left?.length ?? 0}, credentials now: ${creds?.length ?? 0}`);
