import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * 1. Seeds the administrator-controlled feature flags used by the console.
 * 2. Sends a real test email through the configured provider to prove the
 *    email provision works end to end.
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

// 1. Flags
const flags = [
  {
    flag_key: "mfa_required_for_console",
    description:
      "Require a second factor for console accounts. Leave OFF until every staff member has enrolled a second factor, then turn it on.",
    is_enabled: false,
    rollout_percentage: 100,
    applies_to: "abawole",
  },
];

for (const flag of flags) {
  const { error } = await supabase
    .from("feature_flags")
    .upsert(flag, { onConflict: "flag_key" });
  console.log(`flag ${flag.flag_key}: ${error ? "FAILED " + error.message : "seeded (off)"}`);
}

// 2. Email delivery test
const from = env.EMAIL_FROM || "tickets@guests.abeokutapolofestival2026.org.ng";
const to = env.SECRETARIAT_EMAIL || "abeokutapolo@gmail.com";
const resendKey = env.RESEND_API_KEY;

if (!resendKey) {
  console.log("email test: RESEND_API_KEY not set — skipped");
} else {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from.includes("<")
        ? from
        : `Abeokuta Polo Festival 2026 <${from}>`,
      to: [to],
      subject: "Festival platform — email provision test",
      html: `<p>This is an automated test of the festival platform email provision.</p><p>Sent: ${new Date().toISOString()}</p>`,
    }),
  });
  const body = await response.json().catch(() => ({}));
  console.log(
    `email test: ${response.ok ? "SENT" : "FAILED"} ${response.status} ${body.id || body.message || ""}`,
  );
}
