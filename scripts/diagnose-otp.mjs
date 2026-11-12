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

const email = process.argv[2] || "finsec@abeokutapolo2026.ng";

// 1. Raw OTP endpoint response
const otp = await fetch(`${env.SUPABASE_URL}/auth/v1/otp`, {
  method: "POST",
  headers: {
    apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email,
    create_user: false,
    gotrue_meta_security: {},
  }),
});
const otpBody = await otp.text();
console.log(`[otp] ${otp.status} ${otpBody.slice(0, 300)}`);

// 2. Password-reset email — proves the project's mailer is configured.
const supabase = createClient(env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: "https://www.abeokutapolofestival2026.org.ng/reset-password",
});
console.log(`[reset email] ${error ? "FAILED: " + error.message : "ACCEPTED — mailer is configured"}`);

// 3. Same test for a personal-domain address, to rule out the club domain.
const personal = "abeokutapolo@gmail.com";
const otp2 = await fetch(`${env.SUPABASE_URL}/auth/v1/otp`, {
  method: "POST",
  headers: {
    apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email: personal, create_user: false, gotrue_meta_security: {} }),
});
console.log(`[otp personal address] ${otp2.status} ${(await otp2.text()).slice(0, 200)}`);
