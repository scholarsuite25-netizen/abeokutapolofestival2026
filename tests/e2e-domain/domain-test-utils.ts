/**
 * Shared Utilities for Custom Domain, Cloudflare DNS, Vercel Routing, and Resend E2E Tests
 */

import { Resolver } from "node:dns/promises";
import * as https from "node:https";
import * as http from "node:http";
import * as tls from "node:tls";
import * as crypto from "node:crypto";
import { execSync } from "node:child_process";

export const DOMAIN_CONFIG = {
  APEX_DOMAIN: "abeokutapolofestival2026.org.ng",
  WWW_DOMAIN: "www.abeokutapolofestival2026.org.ng",
  EMAIL_SUBDOMAIN: "guests.abeokutapolofestival2026.org.ng",
  VERCEL_APP_URL: "https://abeokuta-polo-festival-2026.vercel.app",
  VERCEL_APP_HOST: "abeokuta-polo-festival-2026.vercel.app",
  VERCEL_PROJECT_ID: "prj_UcKFQTOyc9BFfqJD8JyhSvf3hByd",
  VERCEL_PROJECT_NAME: "abeokuta-polo-festival-2026",
  VERCEL_TEAM_ID: "team_KO2A4taoxmCSQgmB3vbao42B",
  VERCEL_SCOPE: "digitalwealthcreators-projects",
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || "aed0a3ce52c51760cd46d76d616f38ce",
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || "",
  RESEND_DOMAIN_ID: "6bf9d051-5bcc-4375-8ca4-edfe6416ae2a",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  EXPECTED_VERCEL_APEX_IP: "76.76.21.21",
  EXPECTED_VERCEL_CNAME_TARGET: "cname.vercel-dns.com",
  EXPECTED_DKIM_SELECTOR: "resend._domainkey.guests",
  EXPECTED_DKIM_PUBKEY:
    "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCuMSW9RpJ2N1KHzdz7+DtquZJhlPGJjh4exnPGNZiXB+jL1PBwnQKfJuIqAW1aBGy7fZNxAp/zlCcE1R4plnGLFnqVeA3xVh0RyYvd4IJBLp4GZmmDES9CDQzPrE8mZqIbRHNq5J4LJNXy+6tM1Fbv0wLFgQ9tRzUYWIruc7+SJwIDAQAB",
  EXPECTED_SPF_1_HOST: "rsend.guests",
  EXPECTED_SPF_1_TARGET: "rsend-euw1.forge.rmta.net",
  EXPECTED_SPF_2_HOST: "send.guests",
  EXPECTED_SPF_2_TARGET: "send.forge.rmta.net",
  EXPECTED_MX_HOST: "guests",
  EXPECTED_MX_TARGET: "receive-euw1.forge.rmta.net",
  EXPECTED_MX_PRIORITY: 10,
  EXPECTED_DMARC_HOST: "_dmarc",
  EXPECTED_DMARC_VALUE: "v=DMARC1; p=none;",
  HARMONWEB_AUTHORITATIVE_NS: ["dns1.harmonweb.net", "dns2.harmonweb.net"],
  PUBLIC_DNS_RESOLVERS: {
    CLOUDFLARE_PRIMARY: "1.1.1.1",
    CLOUDFLARE_SECONDARY: "1.0.0.1",
    GOOGLE_PRIMARY: "8.8.8.8",
    GOOGLE_SECONDARY: "8.8.4.4",
  },
};

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
  account: { id: string; name: string };
  paused: boolean;
  type: string;
}

export interface CloudflareDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  priority?: number;
}

export interface CloudflareSetting {
  id: string;
  value: any;
  editable: boolean;
}

export interface VercelDomainRecord {
  name: string;
  apexName: string;
  projectId: string;
  redirect: string | null;
  redirectStatusCode: number | null;
  gitBranch: string | null;
  verified: boolean;
}

export interface ResendDomainDetails {
  object: string;
  id: string;
  name: string;
  status: string;
  region: string;
  capabilities: { sending: string; receiving: string };
  records: Array<{
    record: string;
    name: string;
    value: string;
    type: string;
    status: string;
    ttl: string;
    priority?: number;
  }>;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  location?: string;
  body: string;
}

export interface TlsHandshakeInfo {
  protocol: string;
  cipher: { name: string; version: string; standardName?: string };
  valid_from: string;
  valid_to: string;
  subject: Record<string, string>;
  issuer: Record<string, string>;
  subjectaltname?: string;
  authorized: boolean;
}

/**
 * Perform Cloudflare API GET request
 */
export async function cfApiGet<T>(endpoint: string): Promise<T> {
  const url = `https://api.cloudflare.com/client/v4${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${DOMAIN_CONFIG.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Cloudflare API error ${response.status}: ${text}`);
  }
  return (await response.json()) as T;
}

/**
 * Retrieve Cloudflare Account information
 */
export async function getCloudflareAccount(): Promise<{ id: string; name: string } | null> {
  const data = await cfApiGet<{ result: Array<{ id: string; name: string }>; success: boolean }>(
    "/accounts"
  );
  if (!data.success || !data.result || data.result.length === 0) {
    return null;
  }
  return data.result.find((a) => a.id === DOMAIN_CONFIG.CLOUDFLARE_ACCOUNT_ID) || data.result[0];
}

/**
 * Retrieve Cloudflare Zone for festival domain
 */
export async function getCloudflareZone(): Promise<CloudflareZone | null> {
  const data = await cfApiGet<{ result: CloudflareZone[]; success: boolean }>(
    `/zones?name=${DOMAIN_CONFIG.APEX_DOMAIN}`
  );
  if (!data.success || !data.result || data.result.length === 0) {
    return null;
  }
  return data.result[0];
}

/**
 * Retrieve Cloudflare Zone DNS records
 */
export async function getCloudflareDnsRecords(zoneId: string): Promise<CloudflareDnsRecord[]> {
  const data = await cfApiGet<{ result: CloudflareDnsRecord[]; success: boolean }>(
    `/zones/${zoneId}/dns_records?per_page=100`
  );
  return data.result || [];
}

/**
 * Retrieve Cloudflare Zone setting value
 */
export async function getCloudflareZoneSetting(
  zoneId: string,
  settingKey: string
): Promise<any> {
  const data = await cfApiGet<{ result: CloudflareSetting; success: boolean }>(
    `/zones/${zoneId}/settings/${settingKey}`
  );
  return data.result?.value;
}

let cachedVercelDomains: VercelDomainRecord[] | null = null;

/**
 * Query Vercel API for custom domains on project
 */
export async function getVercelDomains(forceRefresh: boolean = false): Promise<VercelDomainRecord[]> {
  if (cachedVercelDomains && !forceRefresh) {
    return cachedVercelDomains;
  }
  try {
    const cmd = `npx vercel api /v9/projects/${DOMAIN_CONFIG.VERCEL_PROJECT_NAME}/domains?teamId=${DOMAIN_CONFIG.VERCEL_TEAM_ID}`;
    const output = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 });
    const jsonStr = output.substring(output.indexOf("{"));
    const parsed = JSON.parse(jsonStr);
    cachedVercelDomains = parsed.domains || [];
    return cachedVercelDomains!;
  } catch (err: any) {
    throw new Error(`Failed to query Vercel domains via CLI: ${err.message}`);
  }
}

/**
 * Query Resend API for domain details
 */
export async function getResendDomainDetails(): Promise<ResendDomainDetails> {
  const url = `https://api.resend.com/domains/${DOMAIN_CONFIG.RESEND_DOMAIN_ID}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${DOMAIN_CONFIG.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }
  return (await response.json()) as ResendDomainDetails;
}

/**
 * Resolve DNS records using a specific DNS server
 */
export async function queryDnsRecord(
  name: string,
  type: "TXT" | "CNAME" | "MX" | "A" | "NS" | "SOA",
  dnsServerIp: string
): Promise<any> {
  const resolver = new Resolver();
  resolver.setServers([dnsServerIp]);
  switch (type) {
    case "TXT":
      return await resolver.resolveTxt(name);
    case "CNAME":
      return await resolver.resolveCname(name);
    case "MX":
      return await resolver.resolveMx(name);
    case "A":
      return await resolver.resolve4(name);
    case "NS":
      return await resolver.resolveNs(name);
    case "SOA":
      return await resolver.resolveSoa(name);
    default:
      throw new Error(`Unsupported DNS record type: ${type}`);
  }
}

/**
 * Probe TLS connection and inspect certificate and ciphers
 */
export async function probeTlsHandshake(
  host: string,
  port: number = 443
): Promise<TlsHandshakeInfo> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      port,
      host,
      {
        servername: host,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol() || "unknown";
        const cipher = socket.getCipher() as { name: string; version: string };
        const authorized = socket.authorized;
        const info: TlsHandshakeInfo = {
          protocol,
          cipher,
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          subject: cert.subject as any,
          issuer: cert.issuer as any,
          subjectaltname: cert.subjectaltname,
          authorized,
        };
        socket.end();
        resolve(info);
      }
    );
    socket.on("error", (err) => {
      reject(err);
    });
    socket.setTimeout(8000, () => {
      socket.destroy();
      reject(new Error(`TLS connection timeout to ${host}:${port}`));
    });
  });
}

/**
 * Make an HTTP/HTTPS request without automatically following redirects
 */
export async function probeHttpNoRedirect(
  urlStr: string,
  headers: Record<string, string> = {}
): Promise<HttpResponse> {
  const parsed = new URL(urlStr);
  const client = parsed.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      urlStr,
      {
        method: "GET",
        headers: {
          "User-Agent": "AbeokutaPoloE2EValidator/1.0",
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers as Record<string, string | string[] | undefined>,
            location: res.headers.location,
            body,
          });
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`HTTP request timeout for ${urlStr}`));
    });
    req.end();
  });
}

/**
 * Validate RSA DKIM Public Key structure and modulus
 */
export function validateRsaDkimKey(dkimRecordValue: string): {
  valid: boolean;
  modulusLength?: number;
  publicExponent?: bigint;
  error?: string;
} {
  try {
    const match = dkimRecordValue.match(/p=([A-Za-z0-9+/=]+)/);
    if (!match) {
      return { valid: false, error: "No p= parameter found in DKIM value" };
    }
    const b64 = match[1];
    const pem = `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----`;
    const key = crypto.createPublicKey(pem);
    if (key.asymmetricKeyType !== "rsa") {
      return { valid: false, error: `Unexpected key type: ${key.asymmetricKeyType}` };
    }
    return {
      valid: true,
      modulusLength: key.asymmetricKeyDetails?.modulusLength,
      publicExponent: key.asymmetricKeyDetails?.publicExponent,
    };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}
