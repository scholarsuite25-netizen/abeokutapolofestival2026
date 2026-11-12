import fs from "node:fs";

/**
 * Replaces every real secret value in the tracked files with a placeholder.
 *
 *   node scripts/scrub-secrets-from-docs.mjs
 *
 * Reads the true values from .env.local and rewrites any file that contains
 * them so that only the variable NAME and a placeholder remain. This is what
 * stops a secret from being committed in the first place; rotation and a
 * history purge deal with the copies that were already pushed.
 */
const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const SECRET_NAMES = [
  "SUPABASE_DB_PASSWORD",
  "QR_SIGNING_SECRET",
  "ENCRYPTION_SECRET",
  "CRON_SECRET",
  "WORKER_AUTH_SECRET",
  "EMAILBUMP_API_KEY",
  "EMAILBUMP_PROJECT_ID",
  "EMAILBUMP_SMTP_HOST",
  "EMAILBUMP_SMTP_PASSWORD",
  "EMAIL_FROM",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
];

const placeholders = {
  SUPABASE_DB_PASSWORD: "`«your-database-password»`",
  QR_SIGNING_SECRET: "`«a-long-random-string»`",
  ENCRYPTION_SECRET: "`«a-long-random-string»`",
  CRON_SECRET: "`«a-long-random-string»`",
  WORKER_AUTH_SECRET: "`«a-long-random-string»`",
  EMAILBUMP_API_KEY: "`«your-emailbump-api-key»`",
  EMAILBUMP_PROJECT_ID: "`«your-emailbump-project-id»`",
  EMAILBUMP_SMTP_HOST: "`«smtp.your-provider.com»`",
  EMAILBUMP_SMTP_PASSWORD: "`«your-smtp-password»`",
  EMAIL_FROM: "`tickets@guests.abeokutapolofestival2026.org.ng`",
  SUPABASE_URL: "`https://<project-ref>.supabase.co`",
  NEXT_PUBLIC_SUPABASE_URL: "`https://<project-ref>.supabase.co`",
};

const files = process.argv.slice(2);
let changed = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, "utf8");
  let touched = false;

  for (const name of SECRET_NAMES) {
    const value = env[name];
    if (!value || value.length < 8) continue;
    if (!text.includes(value)) continue;
    text = text.split(value).join(placeholders[name]);
    touched = true;
    console.log(`  ${file}: replaced the value of ${name}`);
  }

  if (touched) {
    fs.writeFileSync(file, text, "utf8");
    changed += 1;
  }
}

console.log(`\n${changed} file(s) scrubbed.`);
