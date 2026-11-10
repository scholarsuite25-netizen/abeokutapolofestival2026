/**
 * Empirical Challenger Verification Harness:
 * 1. Deep schema audit of DOMAIN_CONFIG.RECORDS and all 7 record descriptors
 * 2. RFC 7538 HTTP 308 method, path, and query preservation stress test
 * 3. Live TLS 1.3 AEAD cipher and protocol negotiation validation
 */

import { DOMAIN_CONFIG } from "../tests/e2e-domain/domain-test-utils.ts";
import https from "node:https";
import http from "node:http";
import tls from "node:tls";

let failedAssertions = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    failedAssertions++;
  } else {
    console.log(`  [PASS] ${message}`);
  }
}

console.log("================================================================================");
console.log("  CHALLENGER STRESS HARNESS: DOMAIN_CONFIG.RECORDS & EDGE ROUTING VERIFICATION");
console.log("================================================================================");

// -----------------------------------------------------------------------------
// PART 1: DOMAIN_CONFIG.RECORDS Deep Schema Verification
// -----------------------------------------------------------------------------
console.log("\n[SECTION 1] DOMAIN_CONFIG.RECORDS Accessibility & Schema Audit");

assert(DOMAIN_CONFIG !== undefined && DOMAIN_CONFIG !== null, "DOMAIN_CONFIG is defined");
assert(typeof DOMAIN_CONFIG.RECORDS === "object" && DOMAIN_CONFIG.RECORDS !== null, "DOMAIN_CONFIG.RECORDS is an object");

const expectedRecords = [
  { key: "APEX_A", type: "A", name: "@", content: "76.76.21.21", proxied: false },
  { key: "WWW_CNAME", type: "CNAME", name: "www", content: "cname.vercel-dns.com", proxied: false },
  { key: "RESEND_DKIM", type: "TXT", name: "resend._domainkey.guests", proxied: false },
  { key: "RESEND_SPF_1", type: "CNAME", name: "rsend.guests", content: "rsend-euw1.forge.rmta.net", proxied: false },
  { key: "RESEND_SPF_2", type: "CNAME", name: "send.guests", content: "send.forge.rmta.net", proxied: false },
  { key: "RESEND_MX", type: "MX", name: "guests", content: "receive-euw1.forge.rmta.net", priority: 10, proxied: false },
  { key: "DMARC", type: "TXT", name: "_dmarc", content: "v=DMARC1; p=none;", proxied: false },
];

for (const exp of expectedRecords) {
  const rec = DOMAIN_CONFIG.RECORDS[exp.key];
  assert(rec !== undefined, `DOMAIN_CONFIG.RECORDS.${exp.key} is defined (no TypeError)`);
  if (rec) {
    assert(rec.type === exp.type, `${exp.key}.type === "${exp.type}"`);
    assert(rec.name === exp.name, `${exp.key}.name === "${exp.name}"`);
    if (exp.content) {
      assert(rec.content === exp.content, `${exp.key}.content === "${exp.content}"`);
    } else if (exp.key === "RESEND_DKIM") {
      assert(typeof rec.content === "string" && rec.content.startsWith("p=MIGf"), `${exp.key}.content is valid RSA public key`);
    }
    assert(rec.proxied === exp.proxied, `${exp.key}.proxied === false`);
    assert(rec.ttl === 1, `${exp.key}.ttl === 1 (automatic)`);
    if (exp.priority !== undefined) {
      assert(rec.priority === exp.priority, `${exp.key}.priority === ${exp.priority}`);
    }
  }
}

// -----------------------------------------------------------------------------
// PART 2: RFC 7538 HTTP 308 Edge Redirect, Path & Query Preservation
// -----------------------------------------------------------------------------
console.log("\n[SECTION 2] RFC 7538 HTTP 308 Edge Redirection Stress Test");

function rawRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const reqOptions = {
      method: options.method || "GET",
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        "User-Agent": "AbeokutaPolo-Empirical-Challenger/2.0",
        ...(options.headers || {}),
      },
      agent: false,
    };

    const startTime = Date.now();
    const req = client.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          durationMs: Date.now() - startTime,
          body: data,
        });
      });
    });

    req.on("error", (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
}

const targetHost = DOMAIN_CONFIG.VERCEL_APP_HOST;

const edgeTestVectors = [
  { name: "Root Path Redirection", path: "/" },
  { name: "Deep Resource Path", path: "/tickets/vip-access" },
  { name: "Trailing Slash Preservation", path: "/schedule/" },
  { name: "Complex Query Parameters", path: "/verify?token=xyz_123&signature=abc%3D%3D&mode=direct" },
  { name: "Special Characters in Query", path: "/search?q=Abeokuta+Polo+2026%26High%20Society" },
  { name: "Encoded Unicode in Path", path: "/tag/%E2%9C%A8" },
];

for (const vec of edgeTestVectors) {
  try {
    const res = await rawRequest(`http://${targetHost}${vec.path}`);
    assert(res.status === 308, `[${vec.name}] HTTP Status 308 received for ${vec.path}`);
    const expectedTarget = `https://${targetHost}${vec.path}`;
    assert(res.headers.location === expectedTarget, `[${vec.name}] Location strictly matches: ${expectedTarget}`);
  } catch (err) {
    assert(false, `[${vec.name}] Request failed: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// PART 3: Modern AEAD TLS 1.3 Socket Negotiation
// -----------------------------------------------------------------------------
console.log("\n[SECTION 3] TLS 1.3 Protocol & Modern AEAD Negotiation");

function probeTls(host, port, minVersion, maxVersion) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        minVersion,
        maxVersion,
        rejectUnauthorized: true,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();
        socket.end();
        resolve({ success: true, protocol, cipher, cert });
      }
    );
    socket.setTimeout(7000, () => {
      socket.destroy();
      resolve({ success: false, error: "Connection timeout" });
    });
    socket.on("error", (err) => resolve({ success: false, error: err.message, code: err.code }));
  });
}

const tlsDefault = await probeTls(targetHost, 443, "TLSv1.2", "TLSv1.3");
assert(tlsDefault.success, "TLS Handshake succeeded against Vercel edge host");
assert(tlsDefault.protocol === "TLSv1.3", `Protocol is TLSv1.3 (negotiated: ${tlsDefault.protocol})`);

const cipherName = tlsDefault.cipher ? tlsDefault.cipher.name : "";
const isAead =
  cipherName.includes("GCM") ||
  cipherName.includes("POLY1305") ||
  cipherName.includes("AES_128_GCM") ||
  cipherName.includes("AES_256_GCM");
assert(isAead, `Negotiated cipher suite (${cipherName}) is an approved AEAD suite`);

// Downgrade protection test
const tls11 = await probeTls(targetHost, 443, "TLSv1.1", "TLSv1.1");
assert(!tls11.success, "Insecure TLSv1.1 handshake correctly rejected");

console.log("\n================================================================================");
if (failedAssertions === 0) {
  console.log("  ALL EMPIRICAL CHALLENGES PASSED (0 FAILURES)");
  console.log("================================================================================");
  process.exit(0);
} else {
  console.error(`  VERIFICATION FAILED: ${failedAssertions} assertion failure(s)`);
  console.log("================================================================================");
  process.exit(1);
}
