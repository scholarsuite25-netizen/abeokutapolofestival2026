import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Proves the passwordless flow we intend to ship:
 *   server: generateLink(...) -> email_otp (a 6-digit code)
 *   client: verifyOtp({ email, token, type: 'email' }) -> session
 * No Supabase mailer, no redirect allow-list, no MFA.
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

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = process.argv[2] || "president@abeokutapolo2026.ng";

// Server side: mint a one-time code (exactly what our route will do).
const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  console.log(`generateLink FAILED: ${error.message}`);
  process.exit(1);
}
const code = data.properties.email_otp;
console.log(`server: minted 6-digit code for ${email} (code ${code ? "generated" : "MISSING"})`);

// Client side: the code the guest types into the sign-in form.
const { data: session, error: verifyError } = await anon.auth.verifyOtp({
  email,
  token: code,
  type: "email",
});

if (verifyError) {
  console.log(`client verify FAILED: ${verifyError.message}`);
  process.exit(1);
}
console.log(
  `client: verifyOtp OK -> session for ${session.user?.email} (aal ${session.user?.aal ?? "-"})`,
);
