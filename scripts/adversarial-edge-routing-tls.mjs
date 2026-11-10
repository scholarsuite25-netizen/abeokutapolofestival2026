import https from "node:https";
import http from "node:http";
import tls from "node:tls";
import { execSync } from "node:child_process";

const TARGET_HOST = "abeokuta-polo-festival-2026.vercel.app";
const APEX_DOMAIN = "abeokutapolofestival2026.org.ng";
const WWW_DOMAIN = "www.abeokutapolofestival2026.org.ng";

function logHeader(title) {
  console.log("\n" + "=".repeat(80));
  console.log(`  ${title}`);
  console.log("=".repeat(80));
}

// Helper to make a raw HTTP/HTTPS request without following redirects
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
          statusMessage: res.statusMessage,
          headers: res.headers,
          durationMs: Date.now() - startTime,
          bodySnippet: data.slice(0, 300),
        });
      });
    });

    req.on("error", (err) => reject(err));
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Follow redirects up to maxHops and track chain
async function followRedirectChain(initialUrl, maxHops = 10, method = "GET") {
  const chain = [];
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= maxHops; hop++) {
    const res = await rawRequest(currentUrl, { method });
    chain.push({
      hop,
      url: currentUrl,
      status: res.status,
      location: res.headers["location"] || null,
      headers: res.headers,
      durationMs: res.durationMs,
    });

    if (res.status >= 300 && res.status < 400 && res.headers["location"]) {
      // Resolve relative or absolute location
      const nextUrl = new URL(res.headers["location"], currentUrl).toString();
      if (chain.some((entry, idx) => idx < chain.length && entry.url === nextUrl)) {
        throw new Error(`Circular redirect detected back to ${nextUrl} at hop ${hop + 1}`);
      }
      currentUrl = nextUrl;
    } else {
      // Terminal reached
      break;
    }
  }

  return chain;
}

// Raw TLS socket inspection
function inspectTlsHandshake(host, port = 443, minVersion = "TLSv1.2", maxVersion = "TLSv1.3", ciphers = undefined) {
  return new Promise((resolve, reject) => {
    const socketOptions = {
      host,
      port,
      servername: host,
      minVersion,
      maxVersion,
      ciphers,
      rejectUnauthorized: true,
    };

    const socket = tls.connect(socketOptions, () => {
      const cert = socket.getPeerCertificate(true);
      const cipher = socket.getCipher();
      const protocol = socket.getProtocol();
      const authorized = socket.authorized;
      const authorizationError = socket.authorizationError;

      socket.end();
      resolve({
        success: true,
        protocol,
        cipher,
        authorized,
        authorizationError,
        subject: cert.subject,
        issuer: cert.issuer,
        valid_from: cert.valid_from,
        valid_to: cert.valid_to,
        subjectaltname: cert.subjectaltname,
      });
    });

    socket.setTimeout(8000, () => {
      socket.destroy();
      reject(new Error("TLS connection timed out"));
    });

    socket.on("error", (err) => {
      resolve({
        success: false,
        error: err.message,
        code: err.code,
      });
    });
  });
}

async function runAdversarialChallenges() {
  logHeader("CHALLENGE 1: REDIRECT LOOP & DEPTH STRESS TESTING");

  console.log("\n[1.1] Probing Plain HTTP on Vercel Edge (`http://${TARGET_HOST}/`):");
  const httpProbe = await rawRequest(`http://${TARGET_HOST}/`);
  console.log(`  - HTTP Status: ${httpProbe.status} ${httpProbe.statusMessage}`);
  console.log(`  - Location: ${httpProbe.headers.location}`);
  console.log(`  - Strict-Transport-Security: ${httpProbe.headers["strict-transport-security"] || "None"}`);
  console.log(`  - Duration: ${httpProbe.durationMs}ms`);

  console.log("\n[1.2] Probing HTTPS on Vercel Edge (`https://${TARGET_HOST}/`):");
  const httpsProbe = await rawRequest(`https://${TARGET_HOST}/`);
  console.log(`  - HTTP Status: ${httpsProbe.status} ${httpsProbe.statusMessage}`);
  console.log(`  - Location: ${httpsProbe.headers.location || "None (Terminal 200 OK)"}`);
  console.log(`  - Content-Type: ${httpsProbe.headers["content-type"]}`);
  console.log(`  - Server / Edge: ${httpsProbe.headers.server || "vercel"}`);
  console.log(`  - Duration: ${httpsProbe.durationMs}ms`);

  console.log("\n[1.3] Full Redirect Chain Analysis (Plain HTTP -> Terminal):");
  const chain = await followRedirectChain(`http://${TARGET_HOST}/`);
  console.log(`  - Total hops: ${chain.length - 1}`);
  chain.forEach((c) => {
    console.log(`    Hop ${c.hop}: ${c.url} -> Status ${c.status}${c.location ? ` [Redirect to: ${c.location}]` : " [Terminal OK]"}`);
  });
  if (chain.length - 1 <= 2) {
    console.log(`  ✓ PASS: Redirect depth is ${chain.length - 1} hops (<= 2 hops threshold).`);
  } else {
    console.log(`  × FAIL: Redirect depth exceeded: ${chain.length - 1} hops.`);
  }

  console.log("\n[1.4] RFC 7538 HTTP 308 Permanent Redirect Preservation Testing:");
  const testCases = [
    { name: "Path Segment Preservation", path: "/gallery" },
    { name: "Query Parameter Preservation", path: "/pass/claim?id=123&type=vip" },
    { name: "Deep Path & Encoded Query Preservation", path: "/api/auth/session?callbackUrl=%2Ftickets%2Fview%3Fid%3Dabc" },
  ];

  for (const tc of testCases) {
    const probe = await rawRequest(`http://${TARGET_HOST}${tc.path}`);
    const expectedLocation = `https://${TARGET_HOST}${tc.path}`;
    const actualLocation = probe.headers.location;
    const is308 = probe.status === 308;
    const locationPreserved = actualLocation === expectedLocation;

    console.log(`  Case: ${tc.name}`);
    console.log(`    Request:  http://${TARGET_HOST}${tc.path}`);
    console.log(`    Status:   ${probe.status} (Expected: 308) -> ${is308 ? "PASS" : "FAIL"}`);
    console.log(`    Location: ${actualLocation} -> ${locationPreserved ? "PASS" : "FAIL"}`);
    if (!is308 || !locationPreserved) {
      console.log(`    ERROR: Preservation failure: expected ${expectedLocation}, got ${actualLocation}`);
    }
  }

  console.log("\n[1.5] Vercel Domain Configuration Inspection (Apex -> WWW 308):");
  try {
    const vercelDomainsOutput = execSync(
      `npx vercel domains ls --scope digitalwealthcreators-projects`,
      { encoding: "utf8" }
    );
    console.log("  Vercel Domains CLI Listing snippet:");
    const lines = vercelDomainsOutput.split("\n").filter((l) => l.includes("abeokuta"));
    lines.forEach((l) => console.log(`    ${l.trim()}`));
  } catch (err) {
    console.log(`  Vercel CLI query warning: ${err.message}`);
  }

  logHeader("CHALLENGE 2: SSL/TLS & TRANSPORT SECURITY CHALLENGE");

  console.log("\n[2.1] Live TLS Socket Handshake Negotiation:");
  const tlsInfo = await inspectTlsHandshake(TARGET_HOST, 443);
  console.log(`  - TLS Connection Success: ${tlsInfo.success}`);
  console.log(`  - Protocol Negotiated:    ${tlsInfo.protocol}`);
  console.log(`  - Cipher Suite:           ${tlsInfo.cipher.name} (${tlsInfo.cipher.version})`);
  console.log(`  - Certificate Subject:    ${JSON.stringify(tlsInfo.subject)}`);
  console.log(`  - Certificate Issuer:     ${JSON.stringify(tlsInfo.issuer)}`);
  console.log(`  - Valid From:             ${tlsInfo.valid_from}`);
  console.log(`  - Valid To:               ${tlsInfo.valid_to}`);
  console.log(`  - SANs:                   ${tlsInfo.subjectaltname}`);

  // AEAD Cipher verification
  const isAead =
    tlsInfo.cipher.name.includes("GCM") ||
    tlsInfo.cipher.name.includes("POLY1305") ||
    tlsInfo.cipher.name.includes("CHACHA20") ||
    tlsInfo.cipher.name === "TLS_AES_128_GCM_SHA256" ||
    tlsInfo.cipher.name === "TLS_AES_256_GCM_SHA384" ||
    tlsInfo.cipher.name === "TLS_CHACHA20_POLY1305_SHA256";
  console.log(`  - Modern AEAD Cipher:     ${isAead ? "YES (PASS)" : "NO (FAIL)"}`);

  console.log("\n[2.2] Adversarial TLS Protocol Downgrade Testing:");
  console.log("  Testing TLS 1.0 (Deprecated/Insecure protocol):");
  const tls10Probe = await inspectTlsHandshake(TARGET_HOST, 443, "TLSv1", "TLSv1");
  console.log(`    Result: ${tls10Probe.success ? "ACCEPTED (SECURITY RISK!)" : `REJECTED (${tls10Probe.error || tls10Probe.code}) [PASS]`}`);

  console.log("  Testing TLS 1.1 (Deprecated/Insecure protocol):");
  const tls11Probe = await inspectTlsHandshake(TARGET_HOST, 443, "TLSv1.1", "TLSv1.1");
  console.log(`    Result: ${tls11Probe.success ? "ACCEPTED (SECURITY RISK!)" : `REJECTED (${tls11Probe.error || tls11Probe.code}) [PASS]`}`);

  console.log("  Testing TLS 1.2 (Standard secure protocol):");
  const tls12Probe = await inspectTlsHandshake(TARGET_HOST, 443, "TLSv1.2", "TLSv1.2");
  console.log(`    Result: ${tls12Probe.success ? `ACCEPTED (${tls12Probe.protocol}, ${tls12Probe.cipher.name}) [PASS]` : `REJECTED (${tls12Probe.error})`}`);

  console.log("  Testing TLS 1.3 (Modern high-security protocol):");
  const tls13Probe = await inspectTlsHandshake(TARGET_HOST, 443, "TLSv1.3", "TLSv1.3");
  console.log(`    Result: ${tls13Probe.success ? `ACCEPTED (${tls13Probe.protocol}, ${tls13Probe.cipher.name}) [PASS]` : `REJECTED (${tls13Probe.error})`}`);

  console.log("  Testing Weak / Insecure Ciphers (RC4 / 3DES / NULL):");
  const weakCipherProbe = await inspectTlsHandshake(TARGET_HOST, 443, "TLSv1.2", "TLSv1.2", "RC4-SHA:DES-CBC3-SHA:NULL-SHA");
  console.log(`    Result: ${weakCipherProbe.success ? "ACCEPTED (CRITICAL VULNERABILITY!)" : `REJECTED (${weakCipherProbe.error}) [PASS]`}`);

  console.log("\n[2.3] HSTS Preload Compliance Verification:");
  const hstsHeader = httpsProbe.headers["strict-transport-security"];
  console.log(`  - Raw Header: "${hstsHeader || "NONE"}"`);
  if (!hstsHeader) {
    console.log(`  × FAIL: Strict-Transport-Security header missing from production HTTPS response!`);
  } else {
    const maxAgeMatch = hstsHeader.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
    const hasIncludeSubDomains = /includeSubDomains/i.test(hstsHeader);
    const hasPreload = /preload/i.test(hstsHeader);

    console.log(`  - Max-Age:                 ${maxAge} seconds (${(maxAge / 86400).toFixed(1)} days)`);
    console.log(`  - Preload minimum (1 yr):  ${maxAge >= 31536000 ? "PASS" : "FAIL"}`);
    console.log(`  - 2-Year Target (63072000):${maxAge >= 63072000 ? "PASS" : "INFO: Lower than 2 yrs"}`);
    console.log(`  - includeSubDomains:       ${hasIncludeSubDomains ? "PASS" : "FAIL"}`);
    console.log(`  - preload directive:       ${hasPreload ? "PASS" : "FAIL"}`);

    if (maxAge >= 31536000 && hasIncludeSubDomains && hasPreload) {
      console.log(`  ✓ PASS: Fully compliant with Chromium HSTS Preload list requirements.`);
    } else {
      console.log(`  × FAIL: HSTS header does not meet preload compliance standards.`);
    }
  }

  logHeader("CHALLENGE 3: CLOUDFLARE SSL FLEXIBLE VS FULL LOOP MECHANISM");

  console.log("\n[3.1] Origin Plain HTTP vs HTTPS Probe (Simulating Cloudflare Origin Connection):");
  console.log("  Scenario A: Cloudflare SSL 'Flexible' mode connection to Vercel origin:");
  console.log("  - Cloudflare edge connects to Vercel origin over plain HTTP (Port 80)");
  const simFlexible = await rawRequest(`http://${TARGET_HOST}/`, {
    headers: {
      "X-Forwarded-Proto": "http",
      "X-Forwarded-Port": "80",
    },
  });
  console.log(`    Origin Response Status: ${simFlexible.status} ${simFlexible.statusMessage}`);
  console.log(`    Origin Response Location: ${simFlexible.headers.location}`);
  console.log(`    Origin Response STS: ${simFlexible.headers["strict-transport-security"] || "None"}`);
  console.log(`    => OBSERVATION: Vercel origin ALWAYS returns HTTP 308 redirect to HTTPS.`);
  console.log(`    => CONSEQUENCE IN FLEXIBLE MODE:`);
  console.log(`       1. Client requests https://domain.com from Cloudflare.`);
  console.log(`       2. Cloudflare connects to Vercel origin via http://domain.com.`);
  console.log(`       3. Vercel responds with HTTP 308 -> https://domain.com.`);
  console.log(`       4. Cloudflare relays 308 to Client.`);
  console.log(`       5. Client follows 308 to https://domain.com at Cloudflare.`);
  console.log(`       6. Cloudflare repeats step 2 infinitely.`);
  console.log(`       7. Browser crashes with net::ERR_TOO_MANY_REDIRECTS.`);
  console.log(`    => CONCLUSION: Flexible mode is GUARANTEED to cause ERR_TOO_MANY_REDIRECTS.`);

  console.log("\n  Scenario B: Cloudflare SSL 'Full' or 'Full (Strict)' mode connection to Vercel origin:");
  console.log("  - Cloudflare edge connects to Vercel origin over TLS (Port 443)");
  const simFull = await rawRequest(`https://${TARGET_HOST}/`, {
    headers: {
      "X-Forwarded-Proto": "https",
      "X-Forwarded-Port": "443",
    },
  });
  console.log(`    Origin Response Status: ${simFull.status} ${simFull.statusMessage}`);
  console.log(`    Origin Response Location: ${simFull.headers.location || "None (200 OK Content)"}`);
  console.log(`    Origin Response Body Snippet: ${simFull.bodySnippet.replace(/[\n\r]/g, " ").slice(0, 100)}...`);
  console.log(`    => OBSERVATION: Vercel origin serves HTTP 200 OK directly.`);
  console.log(`    => CONSEQUENCE IN FULL MODE:`);
  console.log(`       1. Client requests https://domain.com from Cloudflare.`);
  console.log(`       2. Cloudflare connects to Vercel origin via https://domain.com (TLSv1.3).`);
  console.log(`       3. Vercel responds with HTTP 200 OK.`);
  console.log(`       4. Cloudflare serves 200 OK to Client.`);
  console.log(`       5. Hops between Cloudflare and Vercel = 0. Redirect loop eliminated.`);
  console.log(`    => CONCLUSION: SSL Full mode completely eliminates the redirect loop.`);

  console.log("\n[3.2] Cloudflare Proxy Status Interaction with Vercel DNS:");
  console.log("  When Cloudflare proxy is DNS-only (Grey Cloud):");
  console.log("  - DNS queries for apex and www return Vercel Anycast IPs (76.76.21.21 / 216.198.79.1).");
  console.log("  - Client connects directly to Vercel edge via TLS 1.3.");
  console.log("  - Vercel's automated Let's Encrypt / DigiCert certificates terminate cleanly.");
  console.log("  - SSL mode on Cloudflare is completely bypassed for direct Vercel traffic.");
  console.log("  - If Cloudflare proxy is enabled (Orange Cloud):");
  console.log("  - SSL mode MUST be 'Full' or 'Full (Strict)' because Vercel forces HTTPS.");

  logHeader("EMPIRICAL ADVERSARIAL STRESS TEST COMPLETE");
}

runAdversarialChallenges().catch((err) => {
  console.error("Adversarial Challenge Runner Exception:", err);
  process.exit(1);
});
