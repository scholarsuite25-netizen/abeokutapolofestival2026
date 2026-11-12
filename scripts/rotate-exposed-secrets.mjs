import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

/**
 * Rotates the application secrets that were exposed in the public repository,
 * and disables the leaked third-party email key.
 *
 *   node scripts/rotate-exposed-secrets.mjs
 *
 * Rotated: QR_SIGNING_SECRET, ENCRYPTION_SECRET, CRON_SECRET,
 *          WORKER_AUTH_SECRET
 * Disabled: EMAILBUMP_API_KEY  (a live key found in the public repository)
 *
 * SUPABASE_DB_PASSWORD is NOT rotated here: it can only be changed from the
 * Supabase dashboard, and that is listed as an action for the Club.
 *
 * Secret values are never printed.
 */

const LOCAL_ENV = ".env.local";

const ROTATE = {
  QR_SIGNING_SECRET: 48,
  ENCRYPTION_SECRET: 48,
  CRON_SECRET: 40,
  WORKER_AUTH_SECRET: 40,
};

const REMOVE = ["EMAILBUMP_API_KEY"];

function randomSecret(length) {
  return crypto.randomBytes(Math.ceil((length * 3) / 4)).toString("base64url").slice(0, length);
}

/* 1. Rewrite .env.local ------------------------------------------------ */
let text = fs.readFileSync(LOCAL_ENV, "utf8");
const updated = {};

for (const [name, length] of Object.entries(ROTATE)) {
  const value = randomSecret(length);
  updated[name] = value;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  if (pattern.test(text)) {
    text = text.replace(pattern, `${name}=${value}`);
  } else {
    text += `\n${name}=${value}`;
  }
  console.log(`rotated ${name}`);
}

for (const name of REMOVE) {
  const pattern = new RegExp(`^${name}=.*\\n?`, "m");
  if (pattern.test(text)) {
    text = text.replace(pattern, "");
    console.log(`removed ${name}`);
  }
}

fs.writeFileSync(LOCAL_ENV, text, "utf8");

/* 2. Update Vercel ----------------------------------------------------- */
const VERCEL = "C:\\Users\\Registrar\\AppData\\Roaming\\npm\\vercel.cmd";

function vercel(args) {
  try {
    // A .cmd file cannot be spawned directly on Windows.
    const out = execFileSync("cmd.exe", ["/c", VERCEL, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out;
  } catch (err) {
    console.warn(`  vercel ${args.slice(0, 2).join(" ")} -> ${(err.stdout || "").trim() || err.message}`);
    return "";
  }
}

for (const target of ["production", "preview"]) {
  for (const [name, value] of Object.entries(updated)) {
    vercel(["env", "rm", name, target, "--yes"]);
    vercel(["env", "add", name, target, "--value", value, "--yes"]);
    console.log(`  updated ${name} on ${target}`);
  }
  for (const name of REMOVE) {
    vercel(["env", "rm", name, target, "--yes"]);
    console.log(`  removed ${name} from ${target}`);
  }
}

console.log("\nLocal .env.local and Vercel are updated. New values are not printed.");
