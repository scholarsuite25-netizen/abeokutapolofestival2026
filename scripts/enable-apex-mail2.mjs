import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Completes mail routing for the club's apex domain:
 *   - the RECEIVING MX (same Resend inbound host the guests subdomain uses),
 *   - SPF at the apex (needed only if we ever send from the apex),
 *   - and reports the Resend verification state.
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

const resendHeaders = { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" };
const cfHeaders = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" };
const APEX = "abeokutapolofestival2026.org.ng";
const INBOUND_MX = "receive-euw1.forge.rmta.net";

const zones = await (await fetch("https://api.cloudflare.com/client/v4/zones", { headers: cfHeaders })).json();
const zone = zones.result.find((z) => z.name === APEX);
const list = await (
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?per_page=200`, { headers: cfHeaders })
).json();

async function upsert(type, name, content, extra = {}) {
  const existing = (list.result || []).find((r) => r.type === type && r.name === name);
  if (existing) {
    if (String(existing.content) === String(content)) {
      console.log(`  ${type} ${name} -> already correct`);
      return;
    }
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records/${existing.id}`,
      { method: "PUT", headers: cfHeaders, body: JSON.stringify({ type, name, content, ttl: 3600, ...extra }) },
    );
    const out = await res.json();
    console.log(`  ${type} ${name} -> ${out.success ? "updated" : "FAILED " + JSON.stringify(out.errors).slice(0, 140)}`);
    return;
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`, {
    method: "POST",
    headers: cfHeaders,
    body: JSON.stringify({ type, name, content, ttl: 3600, ...extra }),
  });
  const out = await res.json();
  console.log(`  ${type} ${name} -> ${out.success ? "published" : "FAILED " + JSON.stringify(out.errors).slice(0, 140)}`);
}

console.log("Publishing apex mail routing:");
await upsert("MX", APEX, INBOUND_MX, { priority: 10 });
await upsert("TXT", APEX, "v=spf1 include:amazonses.com ~all");
await upsert("TXT", "send", "v=spf1 include:amazonses.com ~all");
await upsert("CNAME", "rsend", "send.forge.rmta.net");
await upsert("CNAME", "send", "send.forge.rmta.net");

const domains = await (await fetch("https://api.resend.com/domains", { headers: resendHeaders })).json();
for (const d of domains.data || []) {
  console.log(`\nresend domain ${d.name}: status=${d.status} capabilities=${JSON.stringify(d.capabilities)}`);
}
