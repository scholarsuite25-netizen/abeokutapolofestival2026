import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

/**
 * Checks that no secret environment VALUE appears in the tracked repository.
 *
 *   node scripts/check-no-secrets-in-repo.mjs
 *
 * Reads the real values from .env.local and looks for each of them in every
 * tracked file. Variable *names* in code are fine; real values are not.
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

const SECRET_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "QR_SIGNING_SECRET",
  "ENCRYPTION_SECRET",
  "CRON_SECRET",
  "WORKER_AUTH_SECRET",
  "RESEND_API_KEY",
  "EMAILBUMP_API_KEY",
  "EMAILBUMP_SMTP_PASSWORD",
  "PAYSTACK_SECRET_KEY",
  "CLOUDFLARE_API_TOKEN",
  "GMAIL_APP_PASSWORD",
];

const secrets = SECRET_NAMES.map((name) => [name, env[name]]).filter(([, value]) => Boolean(value));
console.log(`Checking ${secrets.length} secret value(s) against the tracked files...`);

const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

let leaks = 0;
for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;

  let content = "";
  try {
    content = fs.readFileSync(full, "utf8");
  } catch {
    continue;
  }

  for (const [name, value] of secrets) {
    // Short values would match by accident.
    if (value.length < 16) continue;
    if (content.includes(value)) {
      console.log(`LEAK  ${file} contains the value of ${name}`);
      leaks += 1;
    }
  }
}

console.log(leaks === 0 ? "CLEAN — no secret value appears in the tracked files." : `FOUND ${leaks} leak(s).`);
process.exit(leaks === 0 ? 0 : 1);
