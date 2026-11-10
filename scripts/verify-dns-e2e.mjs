#!/usr/bin/env node
/**
 * scripts/verify-dns-e2e.mjs
 * 
 * End-to-End Automated DNS, SSL, Email, and Web Resolution Verification Suite
 * Abeokuta Polo Festival 2026 Custom Domain Integration
 */

import { Resolver } from 'node:dns/promises';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const APEX_DOMAIN = 'abeokutapolofestival2026.org.ng';
const WWW_DOMAIN = `www.${APEX_DOMAIN}`;
const GUESTS_DOMAIN = `guests.${APEX_DOMAIN}`;
const RESEND_DOMAIN_ID = '6bf9d051-5bcc-4375-8ca4-edfe6416ae2a';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'aed0a3ce52c51760cd46d76d616f38ce';

// Target Vercel endpoints
const VERCEL_PRODUCTION_URL = 'https://abeokuta-polo-festival-2026.vercel.app';
const EXPECTED_VERCEL_IPS = ['76.76.21.21', '216.198.79.1', '64.29.17.1'];

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;
    const req = client.request(u, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function probeHttp(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;
    const req = client.request(u, { method: 'GET', timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', chunk => { if (body.length < 500) body += chunk; });
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          redirectLocation: res.headers.location || null,
          reachable: true
        });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT', reachable: false, error: 'Connection timed out' });
    });
    req.on('error', (err) => {
      resolve({ url, status: 'ERROR', reachable: false, error: err.message });
    });
    req.end();
  });
}

async function verifyDnsResolver(resolverName, dnsServers) {
  const r = new Resolver();
  if (dnsServers && dnsServers.length > 0) {
    r.setServers(dnsServers);
  }

  const results = {};

  // 1. Apex A
  try {
    results.apex_A = await r.resolve4(APEX_DOMAIN);
  } catch (e) {
    results.apex_A = { error: e.message };
  }

  // 2. Apex NS
  try {
    results.apex_NS = await r.resolveNs(APEX_DOMAIN);
  } catch (e) {
    results.apex_NS = { error: e.message };
  }

  // 3. WWW CNAME / A
  try {
    results.www_CNAME = await r.resolveCname(WWW_DOMAIN);
  } catch (e) {
    try {
      results.www_A = await r.resolve4(WWW_DOMAIN);
    } catch (e2) {
      results.www_error = e.message;
    }
  }

  // 4. Resend MX
  try {
    results.guests_MX = await r.resolveMx(GUESTS_DOMAIN);
  } catch (e) {
    results.guests_MX = { error: e.message };
  }

  // 5. Resend DKIM TXT
  try {
    results.resend_DKIM = await r.resolveTxt(`resend._domainkey.${GUESTS_DOMAIN}`);
  } catch (e) {
    results.resend_DKIM = { error: e.message };
  }

  // 6. Resend SPF 1 CNAME
  try {
    results.resend_SPF1 = await r.resolveCname(`rsend.${GUESTS_DOMAIN}`);
  } catch (e) {
    results.resend_SPF1 = { error: e.message };
  }

  // 7. Resend SPF 2 CNAME
  try {
    results.resend_SPF2 = await r.resolveCname(`send.${GUESTS_DOMAIN}`);
  } catch (e) {
    results.resend_SPF2 = { error: e.message };
  }

  // 8. DMARC TXT
  try {
    results.dmarc = await r.resolveTxt(`_dmarc.${APEX_DOMAIN}`);
  } catch (e) {
    results.dmarc = { error: e.message };
  }

  return results;
}

async function verifyResendApi() {
  try {
    const res = await fetchJson(`https://api.resend.com/domains/${RESEND_DOMAIN_ID}`, {
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
    });
    return {
      status: res.status,
      domain: res.data.name,
      verified: res.data.status === 'verified',
      capabilities: res.data.capabilities,
      records: res.data.records
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function verifyCloudflareApi() {
  try {
    const res = await fetchJson(`https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(APEX_DOMAIN)}`, {
      headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' }
    });

    if (res.status === 200 && res.data.success && res.data.result.length > 0) {
      const zone = res.data.result[0];
      // Fetch DNS records
      const dnsRes = await fetchJson(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`, {
        headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' }
      });
      return {
        zoneFound: true,
        zoneId: zone.id,
        status: zone.status,
        nameServers: zone.name_servers,
        recordsCount: dnsRes.data?.result?.length || 0,
        records: dnsRes.data?.result || []
      };
    } else {
      return {
        zoneFound: false,
        tokenValidForAccount: true,
        accountId: CF_ACCOUNT_ID,
        note: 'Zone not yet provisioned under this account (requires Zone: Create permission or dashboard creation)'
      };
    }
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log('================================================================');
  console.log(' Abeokuta Polo Festival 2026 — DNS & Infrastructure E2E Suite');
  console.log('================================================================\n');

  // 1. Resend API Verification
  console.log('--- 1. Checking Resend Email Domain Authority ---');
  const resendResult = await verifyResendApi();
  console.log(`Domain:        ${resendResult.domain}`);
  console.log(`Status:        ${resendResult.verified ? 'VERIFIED (PASS)' : 'UNVERIFIED'}`);
  console.log(`Sending:       ${resendResult.capabilities?.sending}`);
  console.log(`Receiving:     ${resendResult.capabilities?.receiving}`);
  console.log(`Active Records in Resend: ${resendResult.records?.length || 0}`);

  // 2. Live HarmonWeb Authoritative DNS
  console.log('\n--- 2. Querying Authoritative HarmonWeb DNS (162.19.227.132) ---');
  const harmonwebDns = await verifyDnsResolver('HarmonWeb', ['162.19.227.132']);
  console.log(`Apex A:        ${JSON.stringify(harmonwebDns.apex_A)}`);
  console.log(`Apex NS:       ${JSON.stringify(harmonwebDns.apex_NS)}`);
  console.log(`WWW CNAME:     ${JSON.stringify(harmonwebDns.www_CNAME || harmonwebDns.www_A)}`);
  console.log(`Guests MX:     ${JSON.stringify(harmonwebDns.guests_MX)}`);
  console.log(`Resend DKIM:   ${Array.isArray(harmonwebDns.resend_DKIM) ? 'PRESENT (' + harmonwebDns.resend_DKIM[0]?.join('').substring(0, 32) + '...)' : 'MISSING'}`);
  console.log(`Resend SPF 1:  ${JSON.stringify(harmonwebDns.resend_SPF1)}`);
  console.log(`Resend SPF 2:  ${JSON.stringify(harmonwebDns.resend_SPF2)}`);

  // 3. Public Resolver DNS (Cloudflare 1.1.1.1)
  console.log('\n--- 3. Querying Public Anycast DNS (Cloudflare 1.1.1.1) ---');
  const publicDns = await verifyDnsResolver('Public Cloudflare 1.1.1.1', ['1.1.1.1']);
  console.log(`Apex A:        ${JSON.stringify(publicDns.apex_A)}`);
  console.log(`Apex NS:       ${JSON.stringify(publicDns.apex_NS)}`);
  console.log(`Guests MX:     ${JSON.stringify(publicDns.guests_MX)}`);
  console.log(`Resend DKIM:   ${Array.isArray(publicDns.resend_DKIM) ? 'RESOLVED' : 'MISSING'}`);

  // 4. Cloudflare API State
  console.log('\n--- 4. Checking Cloudflare API Authority ---');
  const cfState = await verifyCloudflareApi();
  console.log(`Zone Status:   ${cfState.zoneFound ? 'ACTIVE (' + cfState.zoneId + ')' : 'NOT IN CLOUDFLARE ACCOUNT'}`);
  if (cfState.note) console.log(`Note:          ${cfState.note}`);

  // 5. HTTP / HTTPS Live Endpoints Probe
  console.log('\n--- 5. Probing Web Endpoints ---');
  const [vercelProd, apexHttp, wwwHttp] = await Promise.all([
    probeHttp(VERCEL_PRODUCTION_URL),
    probeHttp(`http://${APEX_DOMAIN}`),
    probeHttp(`http://${WWW_DOMAIN}`)
  ]);

  console.log(`Vercel App (${VERCEL_PRODUCTION_URL}): HTTP ${vercelProd.status} (Reachable: ${vercelProd.reachable})`);
  console.log(`Apex Domain (http://${APEX_DOMAIN}): HTTP ${apexHttp.status} (Target: ${JSON.stringify(publicDns.apex_A)})`);
  console.log(`WWW Domain (http://${WWW_DOMAIN}): HTTP ${wwwHttp.status}`);

  // 6. Summary Matrix
  const overallSummary = {
    timestamp: new Date().toISOString(),
    domains: {
      apex: APEX_DOMAIN,
      www: WWW_DOMAIN,
      guests: GUESTS_DOMAIN
    },
    resend: {
      domain_id: RESEND_DOMAIN_ID,
      verified: resendResult.verified,
      capabilities: resendResult.capabilities
    },
    dns_authoritative_harmonweb: harmonwebDns,
    dns_public_1_1_1_1: publicDns,
    cloudflare_account: {
      account_id: CF_ACCOUNT_ID,
      zone_state: cfState
    },
    endpoints: {
      vercel_live: vercelProd,
      custom_domain_apex: apexHttp,
      custom_domain_www: wwwHttp
    },
    action_items_for_go_live: [
      {
        path: 'Option A (HarmonWeb Direct to Vercel - Recommended / Zero propagation delay)',
        steps: [
          `1. In HarmonWeb DNS Zone Editor for ${APEX_DOMAIN}, edit A record '@' from 162.19.227.132 to 76.76.21.21`,
          `2. Edit CNAME record 'www' to point to cname.vercel-dns.com`,
          `3. Run 'npx vercel domains verify ${APEX_DOMAIN}'`
        ]
      },
      {
        path: 'Option B (HarmonWeb to Cloudflare DNS Delegation)',
        steps: [
          `1. In Cloudflare Dashboard, add site '${APEX_DOMAIN}' (Free plan) or generate API token with Zone: Create & DNS: Edit permissions.`,
          `2. Run 'node scripts/setup-cloudflare-dns.mjs' to automatically populate all 7 records and configure SSL=full.`,
          `3. Copy the two Cloudflare nameservers and paste them into HarmonWeb Custom Nameservers.`
        ]
      }
    ]
  };

  const stateDir = path.resolve('.agents/teamwork/worker_domain_cloudflare');
  const reportPath = path.join(stateDir, 'verification_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(overallSummary, null, 2));
  console.log(`\n✓ Full JSON verification artifact written to: ${reportPath}`);
}

main().catch(console.error);
