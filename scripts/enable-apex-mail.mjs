import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Enables mail routing for the club's apex domain:
 *   1. registers abeokutapolofestival2026.org.ng with Resend (sending+receiving),
 *   2. publishes the MX / SPF / DKIM records through Cloudflare,
 *   3. reports what still needs a human (the inbound forwarding rule).
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

// 1. Register the apex domain with Resend (idempotent).
const domains = await (await fetch("https://api.resend.com/domains", { headers: resendHeaders })).json();
let domain = domains.data?.find((d) => d.name === APEX);
if (!domain) {
  const created = await (
    await fetch("https://api.resend.com/domains", {
      method: "POST",
      headers: resendHeaders,
      body: JSON.stringify({ name: APEX, region: "eu-west-1" }),
    })
  ).json();
  if (created.error) {
    console.error("Resend domain create failed:", JSON.stringify(created).slice(0, 300));
    process.exit(1);
  }
  domain = created;
  console.log(`created Resend domain ${APEX} (${domain.id})`);
} else {
  console.log(`Resend domain ${APEX} already exists (${domain.id}, ${domain.status})`);
}

// 2. Publish its DNS records through Cloudflare.
const detail = await (
  await fetch(`https://api.resend.com/domains/${domain.id}`, { headers: resendHeaders })
).json();
const records = detail.records || [];

const zones = await (await fetch("https://api.cloudflare.com/client/v4/zones", { headers: cfHeaders })).json();
const zone = zones.result?.find((z) => z.name === APEX);
if (!zone) {
  console.error("Cloudflare zone not found for", APEX);
  process.exit(1);
}

const existing = await (
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?per_page=200`, { headers: cfHeaders })
).json();

for (const rec of records) {
  const wantedType = rec.type === "MX" ? "MX" : rec.type === "TXT" ? "TXT" : rec.record;
  const name = String(rec.name || "").replace(new RegExp(`^${APEX}\\.?`), "").replace(/^\./, "");
  const fullName = name || APEX;

  // SPF: merge with anything already published for this domain.
  if (rec.name === "send" && rec.type === "TXT") {
    const spfRecords = (existing.result || []).filter(
      (r) => r.type === "TXT" && (r.name === APEX || r.name === "send") && String(r.content).includes("v=spf1"),
    );
    const merged = "v=spf1 include:send." + APEX;
    if (spfRecords.length === 0) {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`, {
        method: "POST",
        headers: cfHeaders,
        body: JSON.stringify({ type: "TXT", name: "send", content: merged, ttl: 3600 }),
      });
      console.log(`  TXT send -> ${merged}`);
    } else {
      console.log(`  TXT send -> already present (${spfRecords[0].content})`);
    }
    continue;
  }

  const duplicate = (existing.result || []).find(
    (r) => r.type === wantedType && r.name === fullName && String(r.content) === String(rec.value),
  );
  if (duplicate) {
    console.log(`  ${wantedType} ${fullName} -> already published`);
    continue;
  }
  const body = {
    type: wantedType,
    name: fullName,
    content: rec.value,
    ttl: 3600,
  };
  if (wantedType === "MX") body.priority = Number(rec.priority ?? 10);
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`, {
    method: "POST",
    headers: cfHeaders,
    body: JSON.stringify(body),
  });
  const created = await res.json();
  console.log(`  ${wantedType} ${fullName} -> ${created.success ? "published" : "FAILED " + JSON.stringify(created.errors).slice(0, 160)}`);
}

// 3. Report the DNS state Resend expects.
console.log("\nResend expects:");
for (const rec of records) {
  console.log(`  ${rec.type} ${rec.name} = ${String(rec.value).slice(0, 80)} (priority ${rec.priority ?? "-"})`);
}
