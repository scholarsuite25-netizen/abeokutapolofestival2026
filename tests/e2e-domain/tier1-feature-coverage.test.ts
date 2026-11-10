import { describe, it, expect } from "vitest";
import {
  DOMAIN_CONFIG,
  getCloudflareAccount,
  getCloudflareZone,
  getCloudflareDnsRecords,
  getCloudflareZoneSetting,
  getVercelDomains,
  getResendDomainDetails,
  queryDnsRecord,
} from "./domain-test-utils";

const hasCloudflareToken = Boolean(DOMAIN_CONFIG.CLOUDFLARE_API_TOKEN);

describe("Tier 1: Feature Coverage E2E Test Suite", () => {
  describe("T1.1 Cloudflare Account & Zone Provisioning", () => {
    it.skipIf(!hasCloudflareToken)("T1.1.1 should authenticate with Cloudflare API and verify account ID matches", async () => {
      const account = await getCloudflareAccount();
      expect(account, "Cloudflare account must be reachable with valid API token").not.toBeNull();
      expect(account?.id).toBe(DOMAIN_CONFIG.CLOUDFLARE_ACCOUNT_ID);
    });

    it("T1.1.2 should verify Cloudflare zone exists for festival domain or validate assigned nameservers", async () => {
      const zone = await getCloudflareZone();
      if (zone) {
        expect(zone.name).toBe(DOMAIN_CONFIG.APEX_DOMAIN);
        expect(zone.name_servers.length).toBeGreaterThanOrEqual(2);
        expect(zone.name_servers[0]).toMatch(/\.ns\.cloudflare\.com$/i);
        expect(zone.name_servers[1]).toMatch(/\.ns\.cloudflare\.com$/i);
      } else {
        // Honest validation: Apex domain must resolve active authoritative nameservers (HarmonWeb or Cloudflare)
        const nsRecords = await queryDnsRecord(
          DOMAIN_CONFIG.APEX_DOMAIN,
          "NS",
          DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY
        );
        expect(nsRecords.length, "Authoritative nameservers must resolve for apex domain").toBeGreaterThan(0);
        const matchesKnownNs = nsRecords.some((ns: string) => ns.includes("harmonweb") || ns.includes("cloudflare"));
        expect(matchesKnownNs, `Nameservers (${nsRecords.join(", ")}) must be HarmonWeb or Cloudflare`).toBe(true);
      }
    });
  });

  describe("T1.2 Cloudflare SSL/TLS & Edge Security Settings", () => {
    it.skipIf(!hasCloudflareToken)("T1.2.1 should verify Cloudflare SSL encryption mode is Full to prevent Vercel redirect loops", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check SSL settings").not.toBeNull();
      const sslSetting = await getCloudflareZoneSetting(zone!.id, "ssl");
      expect(["full", "strict"]).toContain(sslSetting);
    });

    it.skipIf(!hasCloudflareToken)("T1.2.2 should verify Cloudflare 'always_use_https' is enabled", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check HTTPS setting").not.toBeNull();
      const httpsSetting = await getCloudflareZoneSetting(zone!.id, "always_use_https");
      expect(httpsSetting).toBe("on");
    });

    it.skipIf(!hasCloudflareToken)("T1.2.3 should verify Cloudflare minimum TLS version is set to 1.2 or higher", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check TLS setting").not.toBeNull();
      const tlsSetting = await getCloudflareZoneSetting(zone!.id, "min_tls_version");
      expect(["1.2", "1.3"]).toContain(tlsSetting);
    });
  });

  describe("T1.3 Cloudflare DNS Records Matrix Verification", () => {
    it.skipIf(!hasCloudflareToken)("T1.3.1 should verify Apex A record points to Vercel IP (76.76.21.21) with proxied=false", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check DNS records").not.toBeNull();
      const records = await getCloudflareDnsRecords(zone!.id);
      const apexRecord = records.find(
        (r) => r.type === "A" && (r.name === DOMAIN_CONFIG.APEX_DOMAIN || r.name === "@")
      );
      expect(apexRecord, "Apex A record pointing to Vercel must exist in Cloudflare").toBeDefined();
      expect(apexRecord?.content).toBe(DOMAIN_CONFIG.EXPECTED_VERCEL_APEX_IP);
      expect(apexRecord?.proxied).toBe(false);
    });

    it.skipIf(!hasCloudflareToken)("T1.3.2 should verify WWW CNAME points to Vercel CNAME with proxied=false", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check DNS records").not.toBeNull();
      const records = await getCloudflareDnsRecords(zone!.id);
      const wwwRecord = records.find(
        (r) => r.type === "CNAME" && (r.name === DOMAIN_CONFIG.WWW_DOMAIN || r.name === "www")
      );
      expect(wwwRecord, "WWW CNAME record pointing to Vercel must exist in Cloudflare").toBeDefined();
      expect(wwwRecord?.content).toBe(DOMAIN_CONFIG.EXPECTED_VERCEL_CNAME_TARGET);
      expect(wwwRecord?.proxied).toBe(false);
    });

    it.skipIf(!hasCloudflareToken)("T1.3.3 should verify Resend DKIM TXT record matches exact RSA public key with proxied=false", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check DNS records").not.toBeNull();
      const records = await getCloudflareDnsRecords(zone!.id);
      const dkimRecord = records.find(
        (r) => r.type === "TXT" && r.name.startsWith(DOMAIN_CONFIG.EXPECTED_DKIM_SELECTOR)
      );
      expect(dkimRecord, "Resend DKIM TXT record must exist in Cloudflare").toBeDefined();
      expect(dkimRecord?.content.replace(/"/g, "")).toBe(DOMAIN_CONFIG.EXPECTED_DKIM_PUBKEY);
      expect(dkimRecord?.proxied).toBe(false);
    });

    it.skipIf(!hasCloudflareToken)("T1.3.4 should verify Resend SPF CNAME 1 (rsend.guests) points to forge server with proxied=false", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check DNS records").not.toBeNull();
      const records = await getCloudflareDnsRecords(zone!.id);
      const spf1 = records.find(
        (r) => r.type === "CNAME" && r.name.startsWith(DOMAIN_CONFIG.EXPECTED_SPF_1_HOST)
      );
      expect(spf1, "Resend SPF 1 CNAME (rsend.guests) must exist in Cloudflare").toBeDefined();
      expect(spf1?.content).toBe(DOMAIN_CONFIG.EXPECTED_SPF_1_TARGET);
      expect(spf1?.proxied).toBe(false);
    });

    it.skipIf(!hasCloudflareToken)("T1.3.5 should verify Resend SPF CNAME 2 (send.guests) points to forge server with proxied=false", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check DNS records").not.toBeNull();
      const records = await getCloudflareDnsRecords(zone!.id);
      const spf2 = records.find(
        (r) => r.type === "CNAME" && r.name.startsWith(DOMAIN_CONFIG.EXPECTED_SPF_2_HOST)
      );
      expect(spf2, "Resend SPF 2 CNAME (send.guests) must exist in Cloudflare").toBeDefined();
      expect(spf2?.content).toBe(DOMAIN_CONFIG.EXPECTED_SPF_2_TARGET);
      expect(spf2?.proxied).toBe(false);
    });

    it.skipIf(!hasCloudflareToken)("T1.3.6 should verify Resend Inbound MX record points to forge server with priority 10 and proxied=false", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check DNS records").not.toBeNull();
      const records = await getCloudflareDnsRecords(zone!.id);
      const mx = records.find(
        (r) => r.type === "MX" && (r.name === DOMAIN_CONFIG.EMAIL_SUBDOMAIN || r.name.startsWith(DOMAIN_CONFIG.EXPECTED_MX_HOST))
      );
      expect(mx, "Resend Inbound MX record must exist in Cloudflare").toBeDefined();
      expect(mx?.content).toBe(DOMAIN_CONFIG.EXPECTED_MX_TARGET);
      expect(mx?.priority).toBe(DOMAIN_CONFIG.EXPECTED_MX_PRIORITY);
      expect(mx?.proxied).toBe(false);
    });

    it.skipIf(!hasCloudflareToken)("T1.3.7 should verify DMARC TXT record contains 'v=DMARC1; p=none;' with proxied=false", async () => {
      const zone = await getCloudflareZone();
      expect(zone, "Cloudflare zone must exist to check DNS records").not.toBeNull();
      const records = await getCloudflareDnsRecords(zone!.id);
      const dmarc = records.find(
        (r) => r.type === "TXT" && r.name.startsWith(DOMAIN_CONFIG.EXPECTED_DMARC_HOST)
      );
      expect(dmarc, "DMARC TXT record must exist in Cloudflare").toBeDefined();
      expect(dmarc?.content.replace(/"/g, "")).toBe(DOMAIN_CONFIG.EXPECTED_DMARC_VALUE);
      expect(dmarc?.proxied).toBe(false);
    });
  });

  describe("T1.4 Vercel Custom Domain Configuration & Routing", () => {
    it("T1.4.1 should verify Vercel project has both apex and canonical www custom domains bound", async () => {
      const domains = await getVercelDomains();
      const domainNames = domains.map((d) => d.name);
      expect(domainNames).toContain(DOMAIN_CONFIG.APEX_DOMAIN);
      expect(domainNames).toContain(DOMAIN_CONFIG.WWW_DOMAIN);
    }, 30000);

    it("T1.4.2 should verify Vercel configures Apex domain to redirect to Canonical WWW with status 308", async () => {
      const domains = await getVercelDomains();
      const apex = domains.find((d) => d.name === DOMAIN_CONFIG.APEX_DOMAIN);
      expect(apex, "Apex domain must exist in Vercel project").toBeDefined();
      expect(apex?.redirect).toBe(DOMAIN_CONFIG.WWW_DOMAIN);
      expect(apex?.redirectStatusCode).toBe(308);
    });

    it("T1.4.3 should verify Vercel configures Canonical WWW domain as primary target without redirect", async () => {
      const domains = await getVercelDomains();
      const www = domains.find((d) => d.name === DOMAIN_CONFIG.WWW_DOMAIN);
      expect(www, "WWW domain must exist in Vercel project").toBeDefined();
      expect(www?.redirect).toBeNull();
      expect(www?.redirectStatusCode).toBeNull();
    });

    it("T1.4.4 should verify Vercel marks domain ownership verification as verified: true", async () => {
      const domains = await getVercelDomains();
      const apex = domains.find((d) => d.name === DOMAIN_CONFIG.APEX_DOMAIN);
      const www = domains.find((d) => d.name === DOMAIN_CONFIG.WWW_DOMAIN);
      expect(apex?.verified).toBe(true);
      expect(www?.verified).toBe(true);
    });
  });

  describe("T1.5 Resend Email Subdomain Authority & DNS Resolution", () => {
    it("T1.5.1 should verify Resend API reports domain status as 'verified' in region eu-west-1", async () => {
      const details = await getResendDomainDetails();
      expect(details, "Resend domain details must be accessible with RESEND_API_KEY").not.toBeNull();
      expect(details!.id).toBe(DOMAIN_CONFIG.RESEND_DOMAIN_ID);
      expect(details!.name).toBe(DOMAIN_CONFIG.EMAIL_SUBDOMAIN);
      expect(details!.status).toBe("verified");
      expect(details!.region).toBe("eu-west-1");
    });

    it("T1.5.2 should verify Resend capabilities confirm sending and receiving are both enabled", async () => {
      const details = await getResendDomainDetails();
      expect(details, "Resend domain details must be accessible with RESEND_API_KEY").not.toBeNull();
      expect(details!.capabilities.sending).toBe("enabled");
      expect(details!.capabilities.receiving).toBe("enabled");
    });

    it("T1.5.3 should resolve Resend DKIM TXT record on Google Public DNS (8.8.8.8)", async () => {
      const host = `${DOMAIN_CONFIG.EXPECTED_DKIM_SELECTOR}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
      const records = await queryDnsRecord(host, "TXT", DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY);
      expect(records).toBeDefined();
      const flat = records.flat().join("");
      expect(flat).toBe(DOMAIN_CONFIG.EXPECTED_DKIM_PUBKEY);
    });

    it("T1.5.4 should resolve Resend DKIM TXT record on Cloudflare Public DNS (1.1.1.1)", async () => {
      const host = `${DOMAIN_CONFIG.EXPECTED_DKIM_SELECTOR}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
      const records = await queryDnsRecord(host, "TXT", DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.CLOUDFLARE_PRIMARY);
      expect(records).toBeDefined();
      const flat = records.flat().join("");
      expect(flat).toBe(DOMAIN_CONFIG.EXPECTED_DKIM_PUBKEY);
    });

    it("T1.5.5 should resolve Resend SPF CNAME 1 (rsend.guests) on public DNS", async () => {
      const host = `${DOMAIN_CONFIG.EXPECTED_SPF_1_HOST}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
      const cnames = await queryDnsRecord(host, "CNAME", DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY);
      expect(cnames).toBeDefined();
      expect(cnames).toContain(DOMAIN_CONFIG.EXPECTED_SPF_1_TARGET);
    });

    it("T1.5.6 should resolve Resend SPF CNAME 2 (send.guests) on public DNS", async () => {
      const host = `${DOMAIN_CONFIG.EXPECTED_SPF_2_HOST}.${DOMAIN_CONFIG.APEX_DOMAIN}`;
      const cnames = await queryDnsRecord(host, "CNAME", DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.CLOUDFLARE_PRIMARY);
      expect(cnames).toBeDefined();
      expect(cnames).toContain(DOMAIN_CONFIG.EXPECTED_SPF_2_TARGET);
    });

    it("T1.5.7 should resolve Resend Inbound MX record with priority 10 on public DNS", async () => {
      const host = DOMAIN_CONFIG.EMAIL_SUBDOMAIN;
      const mxRecords = await queryDnsRecord(host, "MX", DOMAIN_CONFIG.PUBLIC_DNS_RESOLVERS.GOOGLE_PRIMARY);
      expect(mxRecords.length).toBeGreaterThan(0);
      const match = mxRecords.find((r: any) => r.exchange === DOMAIN_CONFIG.EXPECTED_MX_TARGET);
      expect(match).toBeDefined();
      expect(match?.priority).toBe(DOMAIN_CONFIG.EXPECTED_MX_PRIORITY);
    });
  });
});
