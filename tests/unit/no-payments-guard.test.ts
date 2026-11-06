import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * CI guard for decisions D-01 and D-16 (ARCHITECTURE_PLAN.md).
 *
 * The ONLY online payment is the Day 3 VVIP pass through Paystack. This guard:
 *  - fails if any other gateway / cart / order symbol appears in application code;
 *  - fails if Paystack code spreads beyond the files that own the Day 3 flow;
 *  - fails if Day 3 pass issuance stops verifying payments on the server.
 *
 * Excludes: docs, this test, .env.example, node_modules.
 */

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib"];
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

/** Symbols that must never appear in application source (Paystack is allowed only for Day 3 VVIP). */
const FORBIDDEN = [
  "flutterwave",
  "stripe",
  "payment_intent",
  "paymentIntent",
  "PaymentStatusPanel",
  "RefundDialog",
  "OrderSummary",
  "ticket_orders",
  "ticket_products",
  "payment_events",
  "lib/payments",
  "webhooks/payments",
  "api/checkout",
  "/tickets",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      walk(full, out);
    } else if (ALLOWED_EXTENSIONS.has(path.extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

describe("no-payment guard (ARCHITECTURE_PLAN.md §11, D-01)", () => {
  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));

  it("scans application source", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("contains no payment, checkout or order symbols", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const symbol of FORBIDDEN) {
        if (content.toLowerCase().includes(symbol.toLowerCase())) {
          offenders.push(`${path.relative(ROOT, file)} → ${symbol}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("has no /tickets route", () => {
    const ticketRoutes = files.filter((file) => file.includes(`${path.sep}tickets${path.sep}`));
    expect(ticketRoutes).toEqual([]);
  });

  it("keeps Paystack confined to the files that own the Day 3 VVIP flow", () => {
    const ALLOWED = new Set(
      [
        "app/(public)/register/actions.ts",
        "app/(public)/register/page.tsx",
        "app/api/paystack/initialize/route.ts",
        "app/api/paystack/verify/route.ts",
        "components/admin/registrations-manager.tsx",
        "lib/config/checkout-config.ts",
        "lib/env.ts",
        "lib/paystack/claims.ts",
        "lib/paystack/verify.ts",
      ].map((f) => f.split("/").join(path.sep)),
    );
    const offenders = files
      .filter((file) => readFileSync(file, "utf8").toLowerCase().includes("paystack"))
      .map((file) => path.relative(ROOT, file))
      .filter((rel) => !ALLOWED.has(rel));
    expect(offenders, "Paystack referenced outside the Day 3 VVIP flow").toEqual([]);
  });

  it("verifies and single-use-claims every Day 3 payment on the server", () => {
    const actions = readFileSync(path.join(ROOT, "app", "(public)", "register", "actions.ts"), "utf8");
    expect(actions).toContain("verifyDay3Payment(");
    expect(actions).toContain("claimPaymentReference(");
    // The old bypass: treating any reference longer than 3 characters as paid.
    expect(actions).not.toMatch(/day3PaymentRef\.length\s*>\s*\d/);
  });

  it("does not let URL flags such as paid=true or status=success grant passes", () => {
    const page = readFileSync(path.join(ROOT, "app", "(public)", "register", "page.tsx"), "utf8");
    expect(page).not.toMatch(/get\(["']paid["']\)/);
    expect(page).not.toMatch(/get\(["']status["']\)/);
  });

  it("never hard-codes Special Invitation Codes in client or server source", () => {
    const offenders = files
      .filter((file) => /\b(ROYAL-VIP|PRESIDENTIAL|VIP2026|SPECIAL-GUEST)\b/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file));
    expect(offenders).toEqual([]);
  });
});
