import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

/**
 * Live end-to-end check of the Club's sign-in routes against production.
 *
 *   node scripts/verify-live-signin.mjs
 *
 * Proves, on the real website:
 *   1. password sign-in works and lands the right place for the role;
 *   2. the email-code request works from the form;
 *   3. a forgotten password can be recovered with a code and a new password.
 *
 * Secrets are read from the out-of-band credentials file and are never
 * printed. Any password changed during the run is restored afterwards.
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

const credentials = fs.readFileSync(
  path.join(os.homedir(), "Desktop", "ABEOKUTA ADMIN CREDENTIALS - KEEP PRIVATE.txt"),
  "utf8",
);

function passwordFor(email) {
  const index = credentials.indexOf(`EMAIL   : ${email}`);
  if (index === -1) throw new Error(`No credentials block for ${email}`);
  const match = credentials.slice(index).match(/PASSWORD:\s*(\S+)/);
  if (!match) throw new Error(`No password for ${email}`);
  return match[1];
}

const BASE = "https://www.abeokutapolofestival2026.org.ng";
const TEST_EMAIL = "gate1@abeokutapolo2026.ng";
const ORIGINAL_PASSWORD = passwordFor(TEST_EMAIL);
const NEW_PASSWORD = "Verify-Live-Reset-2026!";

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const results = [];
const record = (name, passed, detail = "") => {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();

/** A clean, signed-out browser for each phase. */
async function freshPage() {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

async function setInput(page, id, value) {
  // Playwright's fill() dispatches the events React expects, so the
  // controlled input and its state stay in step.
  const field = page.locator(`#${id}`);
  await field.waitFor({ state: "visible", timeout: 20000 });
  await field.fill(value);
  await page.waitForTimeout(150);
  const readBack = await field.inputValue();
  if (readBack !== value) {
    throw new Error(`Field ${id} did not accept the value (got "${readBack}")`);
  }
}

async function clickByText(page, pattern) {
  const matcher = typeof pattern === "string" ? new RegExp(pattern) : pattern;
  await page.getByRole("button", { name: matcher }).first().click({ timeout: 20000 });
  await page.waitForTimeout(400);
}

async function pageText(page) {
  return page.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
}

/* 1 — password sign-in ------------------------------------------------- */
{
  const { context, page } = await freshPage();
  await page.goto(`${BASE}/sign-in`, { waitUntil: "load" });
  await clickByText(page, "^Use my password instead$");
  await setInput(page, "email", TEST_EMAIL);
  await setInput(page, "password", ORIGINAL_PASSWORD);
  await clickByText(page, "^Sign in$");
  await page.waitForURL(/\/(abawole|scan|dashboard)/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const landed = new URL(page.url()).pathname;
  record(
    "password sign-in reaches the right place for a Gate Marshal",
    landed === "/scan",
    `landed on ${landed}`,
  );

  const body = await pageText(page);
  record(
    "the scanner screen is rendered for the signed-in marshal",
    /scan|gate|turnstile|camera|checkpoint/i.test(body),
    body.slice(0, 90),
  );

  await context.close();
}

/* 2 — email code request from the form --------------------------------- */
{
  const { context, page } = await freshPage();
  await page.goto(`${BASE}/sign-in`, { waitUntil: "load" });
  await setInput(page, "email", TEST_EMAIL);
  await clickByText(page, "^Email me a sign-in code$");
  await page.waitForTimeout(3000);
  const body = await pageText(page);
  record(
    "email code request advances to the code step",
    /6-digit sign-in code/i.test(body) && /on its way/i.test(body),
    body.slice(0, 90),
  );
  record(
    "the SMS option stays hidden while phone sign-in is off",
    !/Text me a code/i.test(body),
    body.slice(0, 60),
  );
  await context.close();
}

/* 3 — forgotten password recovered with a code ------------------------- */
{
  const { context, page } = await freshPage();
  await page.goto(`${BASE}/forgot-password`, { waitUntil: "load" });
  await setInput(page, "email", TEST_EMAIL);
  await clickByText(page, "^Email me a reset code$");
  await page.waitForTimeout(3000);
  let body = await pageText(page);
  record(
    "reset code request advances to the new-password step",
    /Reset code from the email/i.test(body) && /New password/i.test(body),
    body.slice(0, 90),
  );

  // Mint a genuine recovery code, exactly as the route does, and use it.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: TEST_EMAIL,
  });
  if (linkError) {
    record("minted a recovery code", false, linkError.message);
  } else {
    await setInput(page, "resetCode", link.properties.email_otp);
    await setInput(page, "newPassword", NEW_PASSWORD);
    await setInput(page, "confirmNewPassword", NEW_PASSWORD);
    await clickByText(page, "^Save new password$");
    await page.waitForTimeout(4000);
    body = await pageText(page);
    record(
      "recovery code sets a new password",
      /new password has been saved/i.test(body) || /Go to Sign In/i.test(body),
      body.slice(0, 90),
    );

    const anon = createClient(env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { error: signInError } = await anon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: NEW_PASSWORD,
    });
    record("the new password signs in", !signInError, signInError?.message || "");
  }
  await context.close();
}

/* Restore the original password ---------------------------------------- */
{
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const user = list.users.find((u) => (u.email || "").toLowerCase() === TEST_EMAIL);
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: ORIGINAL_PASSWORD });
  record("original password restored", !error, error?.message || "");
}

await browser.close();

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} live checks passed.`);
process.exit(failed.length === 0 ? 0 : 1);
