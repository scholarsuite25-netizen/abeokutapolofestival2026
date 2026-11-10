#!/usr/bin/env node
/**
 * scripts/setup-cloudflare-dns.mjs
 * 
 * End-to-end automation for Abeokuta Polo Festival 2026 custom domain setup:
 * 1. Provisions Cloudflare Zone for abeokutapolofestival2026.org.ng
 * 2. Configures SSL mode = "full", always_use_https = "on", min_tls_version = "1.2"
 * 3. Provisions all DNS records for Vercel Web and Resend Email authentication
 * 4. Outputs assigned nameservers and verification summary
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

// --- Native & Fallback .env.local Auto-Loader ---
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
      return;
    } catch (_) {
      // Fall through to manual parsing if native loader encounters format issues
    }
  }

  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key && process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  } catch (_) {
    // Non-fatal if parsing fails
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'aed0a3ce52c51760cd46d76d616f38ce';
const DOMAIN_NAME = 'abeokutapolofestival2026.org.ng';

const DESIRED_DNS_RECORDS = [
  {
    type: 'A',
    name: '@', // Apex -> abeokutapolofestival2026.org.ng
    content: '76.76.21.21',
    proxied: false,
    ttl: 1, // Auto
    comment: 'Vercel Apex A record'
  },
  {
    type: 'CNAME',
    name: 'www', // www -> cname.vercel-dns.com
    content: 'cname.vercel-dns.com',
    proxied: false,
    ttl: 1,
    comment: 'Vercel WWW CNAME record'
  },
  {
    type: 'TXT',
    name: 'resend._domainkey.guests',
    content: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCuMSW9RpJ2N1KHzdz7+DtquZJhlPGJjh4exnPGNZiXB+jL1PBwnQKfJuIqAW1aBGy7fZNxAp/zlCcE1R4plnGLFnqVeA3xVh0RyYvd4IJBLp4GZmmDES9CDQzPrE8mZqIbRHNq5J4LJNXy+6tM1Fbv0wLFgQ9tRzUYWIruc7+SJwIDAQAB',
    proxied: false,
    ttl: 1,
    comment: 'Resend DKIM record'
  },
  {
    type: 'CNAME',
    name: 'rsend.guests',
    content: 'rsend-euw1.forge.rmta.net',
    proxied: false,
    ttl: 1,
    comment: 'Resend SPF 1'
  },
  {
    type: 'CNAME',
    name: 'send.guests',
    content: 'send.forge.rmta.net',
    proxied: false,
    ttl: 1,
    comment: 'Resend SPF 2'
  },
  {
    type: 'MX',
    name: 'guests',
    content: 'receive-euw1.forge.rmta.net',
    priority: 10,
    proxied: false,
    ttl: 1,
    comment: 'Resend MX record'
  },
  {
    type: 'TXT',
    name: '_dmarc',
    content: 'v=DMARC1; p=none;',
    proxied: false,
    ttl: 1,
    comment: 'DMARC policy'
  }
];

function cfRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.cloudflare.com/client/v4${endpoint}`);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.success) {
            resolve(parsed);
          } else {
            const err = new Error(`Cloudflare API HTTP ${res.statusCode}: ${JSON.stringify(parsed.errors || rawData)}`);
            err.statusCode = res.statusCode;
            err.response = parsed;
            reject(err);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response (${res.statusCode}): ${rawData}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function getOrCreateZone() {
  console.log(`[1/4] Checking existing zones for ${DOMAIN_NAME}...`);
  const listRes = await cfRequest(`/zones?name=${encodeURIComponent(DOMAIN_NAME)}`);
  
  if (listRes.result && listRes.result.length > 0) {
    const zone = listRes.result[0];
    console.log(`✓ Found existing Zone: ${zone.id} (${zone.name}) - Status: ${zone.status}`);
    return zone;
  }

  console.log(`Zone does not exist. Creating new zone under Account ${CF_ACCOUNT_ID}...`);
  const createRes = await cfRequest('/zones', 'POST', {
    account: { id: CF_ACCOUNT_ID },
    name: DOMAIN_NAME,
    type: 'full'
  });

  const zone = createRes.result;
  console.log(`✓ Zone created successfully! Zone ID: ${zone.id}`);
  console.log(`✓ Assigned Nameservers: ${zone.name_servers.join(', ')}`);
  return zone;
}

async function configureZoneSettings(zoneId) {
  console.log(`\n[2/4] Configuring SSL/TLS & HTTPS settings for zone ${zoneId}...`);

  // 1. SSL Mode = full
  try {
    const sslRes = await cfRequest(`/zones/${zoneId}/settings/ssl`, 'PATCH', { value: 'full' });
    console.log(`✓ SSL mode set to 'full' (value: ${sslRes.result.value})`);
  } catch (err) {
    console.error(`✗ Error setting SSL mode:`, err.message);
  }

  // 2. Always Use HTTPS = on
  try {
    const httpsRes = await cfRequest(`/zones/${zoneId}/settings/always_use_https`, 'PATCH', { value: 'on' });
    console.log(`✓ Always Use HTTPS set to 'on' (value: ${httpsRes.result.value})`);
  } catch (err) {
    console.error(`✗ Error setting Always Use HTTPS:`, err.message);
  }

  // 3. Min TLS Version = 1.2
  try {
    const tlsRes = await cfRequest(`/zones/${zoneId}/settings/min_tls_version`, 'PATCH', { value: '1.2' });
    console.log(`✓ Min TLS Version set to '1.2' (value: ${tlsRes.result.value})`);
  } catch (err) {
    console.error(`✗ Error setting Min TLS:`, err.message);
  }
}

async function configureDnsRecords(zoneId) {
  console.log(`\n[3/4] Configuring DNS Records for zone ${zoneId}...`);
  
  // Fetch existing records
  const existingRes = await cfRequest(`/zones/${zoneId}/dns_records?per_page=100`);
  const existingRecords = existingRes.result || [];
  console.log(`Found ${existingRecords.length} existing DNS record(s).`);

  const createdOrUpdated = [];

  for (const record of DESIRED_DNS_RECORDS) {
    // Resolve full name: @ -> DOMAIN_NAME, otherwise append DOMAIN_NAME if needed
    const recordFullName = record.name === '@' 
      ? DOMAIN_NAME 
      : (record.name.endsWith(DOMAIN_NAME) ? record.name : `${record.name}.${DOMAIN_NAME}`);

    // Check if matching record exists
    const match = existingRecords.find(r => 
      r.type === record.type && 
      r.name.toLowerCase() === recordFullName.toLowerCase()
    );

    const payload = {
      type: record.type,
      name: recordFullName,
      content: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      comment: record.comment
    };
    if (record.priority !== undefined) {
      payload.priority = record.priority;
    }

    if (match) {
      const needsUpdate = match.content !== record.content ||
                          match.proxied !== record.proxied ||
                          (record.priority !== undefined && match.priority !== record.priority);

      if (needsUpdate) {
        console.log(`Updating ${record.type} ${recordFullName}...`);
        const updateRes = await cfRequest(`/zones/${zoneId}/dns_records/${match.id}`, 'PUT', payload);
        createdOrUpdated.push(updateRes.result);
        console.log(`✓ Updated ${record.type} ${recordFullName} -> ${record.content}`);
      } else {
        console.log(`✓ Record ${record.type} ${recordFullName} already matches desired configuration.`);
        createdOrUpdated.push(match);
      }
    } else {
      console.log(`Creating ${record.type} ${recordFullName}...`);
      const createRes = await cfRequest(`/zones/${zoneId}/dns_records`, 'POST', payload);
      createdOrUpdated.push(createRes.result);
      console.log(`✓ Created ${record.type} ${recordFullName} -> ${record.content} (id: ${createRes.result.id})`);
    }
  }

  return createdOrUpdated;
}

async function main() {
  console.log('================================================================');
  console.log(' Cloudflare Zone & DNS Automation - Abeokuta Polo Festival 2026');
  console.log('================================================================');
  
  const zone = await getOrCreateZone();
  await configureZoneSettings(zone.id);
  const dnsRecords = await configureDnsRecords(zone.id);

  console.log(`\n[4/4] Summary & Next Steps:`);
  console.log('----------------------------------------------------------------');
  console.log(`Zone ID:          ${zone.id}`);
  console.log(`Domain:           ${zone.name}`);
  console.log(`Status:           ${zone.status}`);
  console.log(`Nameservers:      ${zone.name_servers.join(', ')}`);
  console.log(`Total Records:    ${dnsRecords.length}`);
  console.log('----------------------------------------------------------------');
  console.log('Records Provisioned:');
  for (const r of dnsRecords) {
    console.log(` - [${r.type.padEnd(5)}] ${r.name} -> ${r.content} (proxied: ${r.proxied}${r.priority ? `, priority: ${r.priority}` : ''})`);
  }
  console.log('----------------------------------------------------------------');

  const outputSummary = {
    zone_id: zone.id,
    zone_name: zone.name,
    status: zone.status,
    nameservers: zone.name_servers,
    dns_records: dnsRecords.map(r => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      proxied: r.proxied,
      priority: r.priority || null
    })),
    timestamp: new Date().toISOString()
  };

  const stateDir = path.resolve('.agents/teamwork/worker_domain_cloudflare');
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  fs.writeFileSync(path.join(stateDir, 'cloudflare_zone_summary.json'), JSON.stringify(outputSummary, null, 2));
  console.log(`Saved summary to ${path.join(stateDir, 'cloudflare_zone_summary.json')}`);
}

main().catch(err => {
  console.error('\nFatal Error:', err);
  process.exit(1);
});
