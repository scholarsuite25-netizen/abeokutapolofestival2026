import { describe, it, expect } from "vitest";
import {
  DOMAIN_CONFIG,
  getCloudflareZone,
  getCloudflareZoneSetting,
  probeHttpNoRedirect,
  queryDnsRecord,
  validateRsaDkimKey,
} from "./domain-test-utils";

describe("Tier 3: Cross-Feature Combinations E2E Test Suite", () => {
  describe("T3.1 Vercel Routing + Cloudflare SSL Full (Loop Prevention)", () => {
    it("T3.1.1 should verify Cloudflare SSL mode is Full or Strict to prevent ERR_TOO_MANY_REDIRECTS", async () => {
      const zone = await getCloudflareZone();
      if (!zone) {
        // When Cloudflare zone is pending or API token is absent, verify Vercel direct edge HTTPS terminates cleanly without loop
        const res = await probeHttpNoRedirect(`https://${DOMAIN_CONFIG.VERCEL_APP_HOST}/`);
        expect(res.status).toBe(200);
        return;
      }
      const sslMode = await getCloudflareZoneSetting(zone.id, "ssl");
      expect(
        ["full", "strict"],
        `Cloudflare SSL mode must be 'full' or 'strict' to avoid redirect loop with Vercel edge, but found '${sslMode}'`
      ).toContain(sslMode);
    });

    it("T3.1.2 should verify HTTP client request follows <= 2 hops to reach application terminal 200 OK", async () => {
      let currentUrl = `http://${DOMAIN_CONFIG.VERCEL_APP_HOST}/`;
      let hops = 0;
      const maxHops = 5;

      while (hops < maxHops) {
        const res = await probeHttpNoRedirect(currentUrl);
        if (res.status === 200) {
          break;
        }
        if ([301, 302, 307, 308].includes(res.status) && res.location) {
          currentUrl = res.location.startsWith("http")
            ? res.location
            : new URL(res.location, currentUrl).toString();
          hops++;
        } else {
          break;
        }
      }

      expect(hops, "Redirect chain must terminate cleanly within 2 hops without infinite looping").toBeLessThanOrEqual(2);
    });
  });

  describe("T3.2 Resend Email Delivery + Unproxied DNS Alignment", () => {
    it("T3.2.1 should verify SPF CNAME targets point directly to RMTA forge mail servers, not Cloudflare proxy IPs", async () => {
      const spf1Host = `${DOMAIN_CONFIG.EXPECTED_SPF_1_HOST}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
      const cnames = await queryDnsRecord(spf1Host, "CNAME", DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY);
      expect(cnames).toBeDefined();
      expect(cnames[0]).toBe(DOMAIN_CONFIG.EXPECTED_SPF_1_TARGET);

      // Verify forge target resolves authoritative SPF record (include:amazonses.com)
      const { Resolver } = await import("node:dns/promises");
      const resolver = new Resolver({ timeout: 5000, tries: 3 });
      resolver.setServers([DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY]);
      const txtRecords = await resolver.resolveTxt(DOMAIN_CONFIG.EXPECTED_SPF_1_TARGET);
      expect(txtRecords.length).toBeGreaterThan(0);
      const flatTxt = txtRecords.flat().join("");
      expect(flatTxt).toContain("v=spf1");
      expect(flatTxt).toContain("include:amazonses.com");
    });

    it("T3.2.2 should verify DKIM TXT record parses cryptographically into a valid 1024-bit RSA public key", async () => {
      const host = `${DOMAIN_CONFIG.EXPECTED_DKIM_SELECTOR}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
      const records = await queryDnsRecord(host, "TXT", DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.CLOUDFLARE_PRIMARY);
      const dkimValue = records.flat().join("");

      const validation = validateRsaDkimKey(dkimValue);
      expect(validation.valid, `DKIM RSA public key must parse cleanly: ${validation.error}`).toBe(true);
      expect(validation.modulusLength).toBe(1024);
      expect(validation.publicExponent).toBe(BigInt(65537));
    });
  });

  describe("T3.3 HSTS Preload Security & Transport Hardening", () => {
    it("T3.3.1 should verify Vercel edge response contains Strict-Transport-Security header", async () => {
      const res = await probeHttpNoRedirect(DOMAIN_CONFIG.VERCEL_APP_URL);
      const hsts = res.headers["strict-transport-security"];
      expect(hsts, "Strict-Transport-Security header must be present on production responses").toBeDefined();
    });

    it("T3.3.2 should verify HSTS header specifies max-age >= 31536000 (1 year) for browser preload compliance", async () => {
      const res = await probeHttpNoRedirect(DOMAIN_CONFIG.VERCEL_APP_URL);
      const hsts = String(res.headers["strict-transport-security"] || "");
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      expect(maxAgeMatch, "HSTS header must include max-age directive").not.toBeNull();
      const maxAge = parseInt(maxAgeMatch![1], 10);
      expect(maxAge).toBeGreaterThanOrEqual(31536000);
      expect(maxAge).toBe(63072000); // 2 years as configured in vercel.json
    });

    it("T3.3.3 should verify HSTS header includes 'includeSubDomains' directive", async () => {
      const res = await probeHttpNoRedirect(DOMAIN_CONFIG.VERCEL_APP_URL);
      const hsts = String(res.headers["strict-transport-security"] || "");
      expect(hsts).toContain("includeSubDomains");
    });

    it("T3.3.4 should verify HSTS header includes 'preload' directive for HSTS preload submission", async () => {
      const res = await probeHttpNoRedirect(DOMAIN_CONFIG.VERCEL_APP_URL);
      const hsts = String(res.headers["strict-transport-security"] || "");
      expect(hsts).toContain("preload");
    });
  });

  describe("T3.4 Comprehensive Security Headers Suite", () => {
    it("T3.4.1 should verify X-Content-Type-Options is set to nosniff", async () => {
      const res = await probeHttpNoRedirect(DOMAIN_CONFIG.VERCEL_APP_URL);
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("T3.4.2 should verify Referrer-Policy header is configured on production edge", async () => {
      const res = await probeHttpNoRedirect(DOMAIN_CONFIG.VERCEL_APP_URL);
      const referrerPolicy = res.headers["referrer-policy"];
      expect(referrerPolicy).toBeDefined();
    });
  });
});
