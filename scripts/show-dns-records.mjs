import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Reads the authoritative DNS for the club domains from Cloudflare, so mail
 * routing can be planned before anything is changed.
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

const token = env.CLOUDFLARE_API_TOKEN;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const zones = await (
  await fetch("https://api.cloudflare.com/client/v4/zones", { headers })
).json();
if (!zones.success) {
  console.error("Cloudflare error:", JSON.stringify(zones.errors));
  process.exit(1);
}

for (const zone of zones.result) {
  console.log(`\n=== zone ${zone.name} (${zone.status})`);
  const records = await (
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?per_page=100`,
      { headers },
    )
  ).json();

  for (const r of records.result || []) {
    if (["MX", "TXT", "CNAME"].includes(r.type)) {
      const value = String(r.content || "").slice(0, 110);
      console.log(`  ${r.type.padEnd(6)} ${r.name.padEnd(42)} ${value}`);
    }
  }
}
