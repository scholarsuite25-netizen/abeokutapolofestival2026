import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Re-applies and verifies the staff passwords from the out-of-band
 * credentials file.
 *
 * The credentials file lives OUTSIDE the repository on purpose. This script
 * never prints a password — it only reports whether each account matches.
 *
 *   node scripts/sync-admin-credentials.mjs [path-to-credentials-file]
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

const credentialsPath =
  process.argv[2] ||
  path.join(os.homedir(), "Desktop", "ABEOKUTA ADMIN CREDENTIALS - KEEP PRIVATE.txt");

if (!fs.existsSync(credentialsPath)) {
  console.error(`Credentials file not found: ${credentialsPath}`);
  process.exit(1);
}

/** Parses the EMAIL / PASSWORD blocks out of the credentials file. */
function parseCredentials(text) {
  const accounts = [];
  let email = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const emailMatch = line.match(/^EMAIL\s*:\s*(\S+@\S+)$/i);
    if (emailMatch) {
      email = emailMatch[1].toLowerCase();
      continue;
    }
    const passwordMatch = line.match(/^PASSWORD\s*:\s*(\S.*)$/i);
    if (passwordMatch && email) {
      accounts.push({ email, password: passwordMatch[1].trim() });
      email = null;
    }
  }
  return accounts;
}

const accounts = parseCredentials(fs.readFileSync(credentialsPath, "utf8"));
if (accounts.length === 0) {
  console.error("No EMAIL / PASSWORD pairs found in the credentials file.");
  process.exit(1);
}

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let failures = 0;

for (const account of accounts) {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listError) {
    console.error("Could not list users:", listError.message);
    process.exit(1);
  }
  const user = list.users.find((u) => (u.email || "").toLowerCase() === account.email);
  if (!user) {
    console.log(`MISSING  ${account.email} — no such account`);
    failures += 1;
    continue;
  }

  // Re-apply the password from the file so the file and the live account agree.
  const { error: setError } = await admin.auth.admin.updateUserById(user.id, {
    password: account.password,
  });
  if (setError) {
    console.log(`FAILED   ${account.email} — ${setError.message}`);
    failures += 1;
    continue;
  }

  // Prove the password works by signing in with it.
  const { error: signInError } = await anon.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  if (signInError) {
    console.log(`FAILED   ${account.email} — set but sign-in rejected: ${signInError.message}`);
    failures += 1;
    continue;
  }

  console.log(`OK       ${account.email} — password matches the file and signs in`);
}

console.log(`\n${accounts.length - failures}/${accounts.length} staff accounts match the credentials file.`);
process.exit(failures === 0 ? 0 : 1);
