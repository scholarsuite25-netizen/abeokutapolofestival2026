import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Rotates every staff password, removes the Accounts account, and writes the
 * new credentials to a file OUTSIDE the repository (never committed).
 *
 * Usage: node scripts/rotate-admin-credentials.mjs
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

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*-_=+";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function generatePassword(length = 20) {
  const chars = [
    UPPER[randomInt(UPPER.length)],
    LOWER[randomInt(LOWER.length)],
    DIGITS[randomInt(DIGITS.length)],
    SYMBOLS[randomInt(SYMBOLS.length)],
  ];
  while (chars.length < length) chars.push(ALL[randomInt(ALL.length)]);
  // Fisher-Yates so the guaranteed characters are not always in front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// Accounts to rotate, with their role for the summary.
const ACCOUNTS = [
  ["superadmin@abeokutapolo2026.ng", "Super Admin (full system + admin management)"],
  ["admin@abeokutapolo2026.ng", "Super Admin (second account)"],
  ["president@abeokutapolo2026.ng", "President (full operations + finance + approvals)"],
  ["secretary@abeokutapolo2026.ng", "General Secretary (operations + finance + approvals)"],
  ["finsec@abeokutapolo2026.ng", "Financial Secretary / Accounts (finance + approvals)"],
  ["gate@abeokutapolo2026.ng", "Gate Marshal (turnstile scanner only)"],
  ["gate1@abeokutapolo2026.ng", "Gate Marshal (turnstile scanner only)"],
  ["gate2@abeokutapolo2026.ng", "Gate Marshal (turnstile scanner only)"],
];

// The Accounts account is removed entirely.
const REMOVE = ["bursar@abeokutapolo2026.ng"];

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
if (listError) {
  console.error("Could not list users:", listError.message);
  process.exit(1);
}
const byEmail = new Map(list.users.map((u) => [u.email?.toLowerCase(), u]));

// 1. Remove the Accounts account (auth user, profile, role assignment).
for (const email of REMOVE) {
  const user = byEmail.get(email.toLowerCase());
  if (!user) {
    console.log(`remove ${email}: not found (nothing to do)`);
    continue;
  }
  const { error: a } = await supabase.from("user_role_assignments").delete().eq("user_id", user.id);
  const { error: b } = await supabase.from("profiles").delete().eq("id", user.id);
  const { error: c } = await supabase.auth.admin.deleteUser(user.id);
  console.log(
    `remove ${email}: auth=${c ? "FAILED " + c.message : "deleted"} profile=${b ? "FAILED" : "deleted"} assignments=${a ? "FAILED" : "deleted"}`,
  );
}

// 2. Rotate the remaining passwords.
const results = [];
for (const [email, role] of ACCOUNTS) {
  const user = byEmail.get(email.toLowerCase());
  if (!user) {
    console.log(`rotate ${email}: USER NOT FOUND`);
    continue;
  }
  const password = generatePassword();
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) {
    console.log(`rotate ${email}: FAILED — ${error.message}`);
    continue;
  }
  results.push({ email, role, password });
  console.log(`rotate ${email}: password updated`);
}

// 3. Write the credentials file OUTSIDE the repository.
const desktop = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  "Desktop",
);
const outDir = fs.existsSync(desktop) ? desktop : path.join(root, "..");
const outFile = path.join(outDir, "ABEOKUTA ADMIN CREDENTIALS - KEEP PRIVATE.txt");

const lines = [
  "============================================================",
  " ABEOKUTA POLO FESTIVAL 2026 — STAFF CREDENTIALS",
  " CONFIDENTIAL — KEEP PRIVATE — DO NOT COMMIT TO THE REPOSITORY",
  ` Generated: ${new Date().toISOString()}`,
  "============================================================",
  "",
  "Copy the password for each account into the matching sign-in form.",
  "Give each person ONLY their own row. Never share a login.",
  "",
];
for (const r of results) {
  lines.push("---------------------------------------------");
  lines.push(`EMAIL   : ${r.email}`);
  lines.push(`PASSWORD: ${r.password}`);
  lines.push(`ROLE    : ${r.role}`);
  lines.push("");
}
lines.push("---------------------------------------------");
lines.push("REMOVED: bursar@abeokutapolo2026.ng (Accounts account deleted)");
lines.push("");
lines.push("SIGN IN : https://www.abeokutapolofestival2026.org.ng/sign-in");
lines.push("CONSOLE : https://www.abeokutapolofestival2026.org.ng/abawole");
lines.push("SCANNER : https://www.abeokutapolofestival2026.org.ng/scan");
lines.push("");
lines.push("NEXT STEPS");
lines.push(" 1. Sign in with each new password and save it in a password manager.");
lines.push(" 2. In Supabase: Auth > Users > each account > 'Sign out all sessions'");
lines.push("    (so nobody stays signed in with an old session).");
lines.push(" 3. Enable MFA (two-factor) for every account except the gate marshals:");
lines.push("    Auth > Users > account > MFA > enrol. Same for the four senior");
lines.push("    accounts, or use the Supabase Auth 'MFA' settings page.");
lines.push(" 4. Delete this file once every person has their password, or keep it");
lines.push("    somewhere only the Club can reach. It is NOT in the repository.");
lines.push("");
lines.push("============================================================");
lines.push("");

fs.writeFileSync(outFile, lines.join("\n"), "utf8");
console.log(`\ncredentials written to: ${outFile}`);
console.log("\n=== NEW CREDENTIALS ===");
for (const r of results) {
  console.log(`${r.email}\n    ${r.password}\n    (${r.role})`);
}
