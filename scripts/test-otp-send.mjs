import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Tests whether Supabase can deliver a sign-in email for a staff account.
 * Uses the public OTP endpoint exactly as the browser will.
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

const supabase = createClient(env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = process.argv[2] || "finsec@abeokutapolo2026.ng";

const { data, error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false,
    emailRedirectTo: "https://www.abeokutapolofestival2026.org.ng/abawole",
  },
});

if (error) {
  console.log(`OTP send FAILED: ${error.message} (status ${error.status})`);
} else {
  console.log(`OTP send ACCEPTED for ${email} — check that mailbox for the sign-in email`);
  console.log(`session present: ${Boolean(data.session)}`);
}
