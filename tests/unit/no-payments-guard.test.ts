import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * CI guard for decision D-01/D-03 (no website payments).
 * Fails the build if payment/commerce symbols re-appear in application code.
 *
 * Excludes: docs, this test, .env.example (documents the ban), node_modules,
 * and any file that only mentions the ban in prose comments about the ban.
 */

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib"];
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

/** Symbols that must never appear in application source. */
const FORBIDDEN = [
  "paystack",
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
});
