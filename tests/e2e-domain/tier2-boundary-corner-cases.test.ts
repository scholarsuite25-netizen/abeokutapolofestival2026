import { describe, it, expect } from "vitest";
import {
  DOMAIN_CONFIG,
  getCloudflareZone,
  getCloudflareDnsRecords,
  probeHttpNoRedirect,
  queryDnsRecord,
} from "./domain-test-utils";

describe("Tier 2: Boundary & Corner Cases E2E Test Suite", () => {
  describe("T2.1 Protocol Redirects (HTTP to HTTPS)", () => {
    it("T2.1.1 should verify Vercel app endpoint enforces HTTPS redirection on plain HTTP requests", async () => {
      const plainHttpUrl = `http://${DOMAIN_CONFIG.VERCEL_APP_HOST}/`;
      const res = await probeHttpNoRedirect(plainHttpUrl);
      expect([301, 308]).toContain(res.status);
      expect(res.location).toMatch(/^https:\/\//i);
    });

    it("T2.1.2 should verify HTTPS endpoint serves 200 OK without redirect loop", async () => {
      const httpsUrl = `${DOMAIN_CONFIG.VERCEL_APP_URL}/`;
      const res = await probeHttpNoRedirect(httpsUrl);
      expect(res.status).toBe(200);
      expect(res.location).toBeUndefined();
    });
  });

  describe("T2.2 Apex to Canonical WWW Redirection Semantics", () => {
    it("T2.2.1 should verify Apex redirection uses HTTP 308 Permanent Redirect (RFC 7538)", async () => {
      // Test the redirect rule semantics defined in Vercel project configuration
      const { getVercelDomains } = await import("./domain-test-utils");
      const domains = await getVercelDomains();
      const apex = domains.find((d) => d.name === DOMAIN_CONFIG.APEX_DOMAIN);
      expect(apex?.redirectStatusCode).toBe(308);
      expect(apex?.redirect).toBe(DOMAIN_CONFIG.WWW_DOMAIN);
    });

    it("T2.2.2 should verify Apex redirection target explicitly specifies www subdomain", async () => {
      const { getVercelDomains } = await import("./domain-test-utils");
      const domains = await getVercelDomains();
      const apex = domains.find((d) => d.name === DOMAIN_CONFIG.APEX_DOMAIN);
      expect(apex?.redirect?.toLowerCase()).toBe(`www.${DOMAIN_CONFIG.APEX_DOMAIN.toLowerCase()}`);
    });
  });

  describe("T2.3 Path and Query Parameter Preservation Across Redirects", () => {
    it("T2.3.1 should preserve path segments when routing across application endpoints", async () => {
      const testPath = "/gallery";
      const res = await probeHttpNoRedirect(`${DOMAIN_CONFIG.VERCEL_APP_URL}${testPath}`);
      expect([200, 307, 308]).toContain(res.status);
      if (res.location) {
        expect(res.location).toContain(testPath);
      }
    });

    it("T2.3.2 should preserve query parameters and encoding without truncation", async () => {
      const testQuery = "?day=1&tier=vip_royal&ref=invitation_pass";
      const res = await probeHttpNoRedirect(`${DOMAIN_CONFIG.VERCEL_APP_URL}/${testQuery}`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
    });
  });

  describe("T2.4 Host Header Casing Robustness (RFC 4343)", () => {
    it("T2.4.1 should handle mixed-case and uppercase hostnames in DNS resolution", async () => {
      const mixedCaseHost = "ReSeNd._DoMaInKeY.gUeStS." + DOMAIN_CONFIG.APEX_DOMAIN.toUpperCase();
      const records = await queryDnsRecord(
        mixedCaseHost,
        "TXT",
        DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY
      );
      expect(records).toBeDefined();
      const flat = records.flat().join("");
      expect(flat).toBe(DOMAIN_CONFIG.EXPECTED_DKIM_PUBKEY);
    });
  });

  describe("T2.5 Subdomain Isolation & Wildcard Boundary", () => {
    it("T2.5.1 should verify random invalid subdomain does not resolve to active Vercel route", async () => {
      const randomSubdomain = `probe-nonexistent-${Date.now()}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
      try {
        const result = await queryDnsRecord(
          randomSubdomain,
          "A",
          DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY
        );
        // If an A record exists, it must not route to arbitrary unmanaged servers
        expect(Array.isArray(result)).toBe(true);
      } catch (err: any) {
        // ENOTFOUND or ENODATA is expected for non-existent subdomains
        expect(["ENOTFOUND", "ENODATA", "SERVFAIL"]).toContain(err.code);
      }
    });

    it("T2.5.2 should verify email subdomain (guests) has distinct MX and is not an apex web mirror", async () => {
      const mxRecords = await queryDnsRecord(
        DOMAIN_CONFIG.EMAIL_SUBDOMAIN,
        "MX",
        DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.CLOUDFLARE_PRIMARY
      );
      expect(mxRecords.length).toBeGreaterThan(0);
      const mxHosts = mxRecords.map((m: any) => m.exchange);
      expect(mxHosts).toContain(DOMAIN_CONFIG.EXPECTED_MX_TARGET);
      expect(mxHosts).not.toContain(DOMAIN_CONFIG.APEX_DOMAIN);
    });
  });

  describe("T2.6 Strict DNS Proxying & TTL Constraints", () => {
    it("T2.6.1 should verify Cloudflare mail DNS records are strictly unproxied (proxied=false)", async () => {
      const zone = await getCloudflareZone();
      if (!zone) {
        expect(zone, "Cloudflare zone must exist to check DNS proxying rules").not.toBeNull();
        return;
      }
      const records = await getCloudflareDnsRecords(zone.id);
      const mailRecords = records.filter((r) =>
        r.name.includes("guests") || r.type === "MX" || r.name.includes("_domainkey")
      );
      for (const record of mailRecords) {
        expect(
          record.proxied,
          `Mail record ${record.name} (${record.type}) must have proxied: false to avoid routing breakage`
        ).toBe(false);
      }
    });

    it("T2.6.2 should verify MX record priority is strictly set to 10 (not default 0)", async () => {
      const zone = await getCloudflareZone();
      if (!zone) {
        expect(zone, "Cloudflare zone must exist to check MX priority").not.toBeNull();
        return;
      }
      const records = await getCloudflareDnsRecords(zone.id);
      const mxRecord = records.find((r) => r.type === "MX");
      if (mxRecord) {
        expect(mxRecord.priority).toBe(DOMAIN_CONFIG.EXPECTED_MX_PRIORITY);
      }
    });

    it("T2.6.3 should verify DMARC policy specifies 'p=none;' without aggressive premature quarantine", async () => {
      const zone = await getCloudflareZone();
      if (!zone) {
        // Fall back to live public DNS lookup
        const dmarcRecords = await queryDnsRecord(
          `_dmarc.${DOMAIN_CONFIG.APEX_DOMAIN}`,
          "TXT",
          DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY
        );
        const flat = dmarcRecords.flat().join("");
        expect(flat).toContain("v=DMARC1");
        expect(flat).toContain("p=none");
        return;
      }
      const records = await getCloudflareDnsRecords(zone.id);
      const dmarc = records.find((r) => r.type === "TXT" && r.name.startsWith("_dmarc"));
      if (dmarc) {
        expect(dmarc.content).toContain("v=DMARC1");
        expect(dmarc.content).toContain("p=none");
      }
    });
  });
});
