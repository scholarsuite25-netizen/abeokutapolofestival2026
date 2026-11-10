import { Resolver } from "node:dns/promises";
import { queryDnsRecord, queryDnsRecordRaw, DOMAIN_CONFIG } from "./e2e-domain/domain-test-utils.ts";

async function runEmpiricalStressTest() {
  console.log("================================================================================");
  console.log("  EMPIRICAL CHALLENGER: ADVERSARIAL STRESS TEST & RESILIENCE SUITE");
  console.log("================================================================================\n");

  const secondaryIp = DOMAIN_CONFIG.HARMONWEB_SECONDARY_IP; // 162.19.227.133 (EREFUSED)
  const primaryIp = DOMAIN_CONFIG.HARMONWEB_PRIMARY_IP;     // 162.19.227.132 (Authoritative)

  let passedAssertions = 0;
  let totalAssertions = 0;

  function assert(condition, description) {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
      console.log(`  [PASS] ${description}`);
    } else {
      console.error(`  [FAIL] ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  }

  // --- SUITE 1: Direct Secondary & Primary Behavior ---
  console.log("--- 1. Direct Authoritative DNS Behavior (dns2 vs dns1) ---");
  const rawSecondary = await queryDnsRecordRaw(DOMAIN_CONFIG.APEX_DOMAIN, "A", secondaryIp);
  assert(rawSecondary.code === "EREFUSED", "dns2.harmonweb.net (162.19.227.133) returns EREFUSED");

  const rawPrimary = await queryDnsRecordRaw(DOMAIN_CONFIG.APEX_DOMAIN, "A", primaryIp);
  assert(rawPrimary.success === true && Array.isArray(rawPrimary.data), "dns1.harmonweb.net (162.19.227.132) returns success");
  assert(rawPrimary.data.includes("162.19.227.132"), "dns1 returns authoritative A record for apex");

  // --- SUITE 2: Automatic Fallback on Secondary EREFUSED ---
  console.log("\n--- 2. Automatic Fallback on Secondary EREFUSED across Record Types ---");
  
  // A Record Fallback
  const resA = await queryDnsRecord(DOMAIN_CONFIG.APEX_DOMAIN, "A", secondaryIp);
  assert(Array.isArray(resA) && resA.includes("162.19.227.132"), "Apex A fallback succeeds from dns2 -> dns1");

  // TXT (DKIM) Fallback
  const dkimHost = `${DOMAIN_CONFIG.EXPECTED_DKIM_SELECTOR}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
  const resDkim = await queryDnsRecord(dkimHost, "TXT", secondaryIp);
  const flatDkim = resDkim.flat().join("");
  assert(flatDkim === DOMAIN_CONFIG.EXPECTED_DKIM_PUBKEY, "DKIM TXT fallback succeeds and matches exact RSA pubkey");

  // MX Fallback
  const resMx = await queryDnsRecord(DOMAIN_CONFIG.EMAIL_SUBDOMAIN, "MX", secondaryIp);
  assert(
    resMx.some((m) => m.exchange === DOMAIN_CONFIG.EXPECTED_MX_TARGET && m.priority === 10),
    "MX fallback succeeds with priority 10"
  );

  // NS Fallback
  const resNs = await queryDnsRecord(DOMAIN_CONFIG.APEX_DOMAIN, "NS", secondaryIp);
  assert(
    resNs.some((ns) => ns.includes("harmonweb.net")),
    "NS fallback succeeds returning HarmonWeb nameservers"
  );

  // SOA Fallback
  const resSoa = await queryDnsRecord(DOMAIN_CONFIG.APEX_DOMAIN, "SOA", secondaryIp);
  assert(resSoa && resSoa.nsname && resSoa.nsname.includes("harmonweb"), "SOA fallback succeeds returning valid SOA record");

  // --- SUITE 3: Truly Non-Existent Domain / False Positive Resistance ---
  console.log("\n--- 3. False Positive Resistance & ENOTFOUND Preservation ---");
  const nonExistentSub = `stress-nonexistent-${Date.now()}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
  const nonExistentApex = `stress-nonexistent-domain-${Date.now()}.org.ng`;

  // Querying nonexistent subdomain on secondary:
  // Initial query to secondary gives EREFUSED -> triggers fallback to primary -> primary gives ENOTFOUND -> returns []
  const subResult = await queryDnsRecord(nonExistentSub, "A", secondaryIp);
  assert(Array.isArray(subResult) && subResult.length === 0, "Nonexistent subdomain returns empty array [] (no false positive)");

  // Raw query to primary on nonexistent subdomain returns ENOTFOUND
  const rawSubPrimary = await queryDnsRecordRaw(nonExistentSub, "A", primaryIp);
  assert(rawSubPrimary.code === "ENOTFOUND", "Raw query on primary returns ENOTFOUND for nonexistent subdomain");

  // Raw query to public resolver on nonexistent domain returns ENOTFOUND
  const rawPublic = await queryDnsRecordRaw(nonExistentApex, "A", "8.8.8.8");
  assert(rawPublic.code === "ENOTFOUND", "Public resolver (8.8.8.8) returns ENOTFOUND for nonexistent domain");

  // --- SUITE 4: Timeout & Dead Resolver Fallback ---
  console.log("\n--- 4. Unreachable / Blackhole Resolver Fallback ---");
  // RFC 5737 TEST-NET-1 (192.0.2.1) will timeout
  const timeoutServer = "192.0.2.1";
  const startTimeout = Date.now();
  // Using queryDnsRecord with timeoutServer should trigger ETIMEOUT / fallback to primary authoritative
  // Note: timeout is set to 5000ms with tries:3 in resolver, so we test that fallback handles ETIMEOUT
  console.log("  Testing timeout resilience (querying non-routable 192.0.2.1 with fallback enabled)...");
  const resTimeoutFallback = await queryDnsRecord(DOMAIN_CONFIG.APEX_DOMAIN, "A", timeoutServer, {
    fallbackToAuthoritative: true,
  });
  const timeoutDuration = Date.now() - startTimeout;
  assert(
    Array.isArray(resTimeoutFallback) && resTimeoutFallback.includes("162.19.227.132"),
    `Dead resolver successfully fell back to primary IP (completed in ${timeoutDuration}ms)`
  );

  // --- SUITE 5: High-Concurrency Burst Stress Test ---
  console.log("\n--- 5. Concurrency Stress Test (30 parallel burst queries to degraded dns2) ---");
  const concurrencyCount = 30;
  const promises = [];
  for (let i = 0; i < concurrencyCount; i++) {
    const qType = i % 3 === 0 ? "A" : (i % 3 === 1 ? "TXT" : "MX");
    const target = i % 3 === 0 
      ? DOMAIN_CONFIG.APEX_DOMAIN 
      : (i % 3 === 1 ? dkimHost : DOMAIN_CONFIG.EMAIL_SUBDOMAIN);
    promises.push(queryDnsRecord(target, qType, secondaryIp));
  }

  const burstResults = await Promise.all(promises);
  assert(burstResults.length === concurrencyCount, `All ${concurrencyCount} concurrent requests resolved`);
  const allSucceeded = burstResults.every((res) => Array.isArray(res) && res.length > 0);
  assert(allSucceeded, "100% of concurrent fallback requests succeeded without packet drop or deadlock");

  console.log("\n================================================================================");
  console.log(`  STRESS TEST COMPLETE: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED (100%)`);
  console.log("================================================================================\n");
}

runEmpiricalStressTest().catch((err) => {
  console.error("\nFATAL STRESS TEST FAILURE:", err);
  process.exit(1);
});
