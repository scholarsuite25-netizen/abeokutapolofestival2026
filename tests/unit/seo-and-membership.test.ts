import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Cormorant_Garamond: () => ({ variable: "--font-display" }),
  Manrope: () => ({ variable: "--font-sans" }),
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { metadata } from "@/app/layout";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

describe("SEO & Global Discoverability Configuration", () => {
  it("robots.ts specifies canonical sitemap on www.abeokutapolofestival2026.org.ng without obsolete domains", () => {
    const robotsConfig = robots();
    expect(robotsConfig.sitemap).toContain("www.abeokutapolofestival2026.org.ng/sitemap.xml");
    expect(robotsConfig.sitemap).not.toContain("2026abeokutapolofestival.com");

    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
    const wildcardRule = rules.find((r) => r.userAgent === "*");
    expect(wildcardRule).toBeDefined();

    // Verify key public landing paths are explicitly allowed
    const allowed = Array.isArray(wildcardRule?.allow) ? wildcardRule.allow : [wildcardRule?.allow];
    expect(allowed).toContain("/register");
    expect(allowed).toContain("/tables");
    expect(allowed).toContain("/affiliates");
    expect(allowed).toContain("/programme");
    expect(allowed).toContain("/royal-cup");
    expect(allowed).toContain("/pass/lookup");

    // Verify admin and sensitive operational paths are disallowed
    const disallowed = Array.isArray(wildcardRule?.disallow) ? wildcardRule.disallow : [wildcardRule?.disallow];
    expect(disallowed).toContain("/abawole");
    expect(disallowed).toContain("/admin");
    expect(disallowed).toContain("/api/*");
    expect(disallowed).toContain("/auth/*");
  });

  it("sitemap.ts covers all primary festival paths with canonical host", () => {
    const sitemapEntries = sitemap();
    expect(sitemapEntries.length).toBeGreaterThanOrEqual(15);

    const urls = sitemapEntries.map((e) => e.url);
    expect(urls.every((u) => u.startsWith("https://www.abeokutapolofestival2026.org.ng"))).toBe(true);

    // Verify high-priority pages are indexed
    expect(urls).toContain("https://www.abeokutapolofestival2026.org.ng");
    expect(urls).toContain("https://www.abeokutapolofestival2026.org.ng/register");
    expect(urls).toContain("https://www.abeokutapolofestival2026.org.ng/tables");
    expect(urls).toContain("https://www.abeokutapolofestival2026.org.ng/affiliates");
    expect(urls).toContain("https://www.abeokutapolofestival2026.org.ng/programme");
    expect(urls).toContain("https://www.abeokutapolofestival2026.org.ng/royal-cup");
    expect(urls).toContain("https://www.abeokutapolofestival2026.org.ng/pass/lookup");
  });

  it("app/layout.tsx metadata contains complete OpenGraph, Twitter, and canonical configuration", () => {
    expect(metadata.metadataBase?.toString()).toContain("www.abeokutapolofestival2026.org.ng");
    expect(metadata.alternates?.canonical).toBe("https://www.abeokutapolofestival2026.org.ng");

    // OpenGraph
    const og = metadata.openGraph as Record<string, unknown> | undefined;
    expect(og?.type).toBe("website");
    expect(og?.url).toBe("https://www.abeokutapolofestival2026.org.ng");
    expect(og?.images).toBeDefined();

    // Twitter
    const tw = metadata.twitter as Record<string, unknown> | undefined;
    expect(tw?.card).toBe("summary_large_image");
    expect(tw?.images).toBeDefined();

    // Robots meta directive
    const robotsMeta = metadata.robots as Record<string, unknown> | undefined;
    expect(robotsMeta?.index).toBe(true);
    expect(robotsMeta?.follow).toBe(true);
  });

  it("static og-image.png exists in public directory with valid non-zero byte size", () => {
    const ogPath = path.join(ROOT, "public", "og-image.png");
    expect(fs.existsSync(ogPath)).toBe(true);
    const stat = fs.statSync(ogPath);
    expect(stat.size).toBeGreaterThan(1000);
  });

  it("structured-data.tsx renders valid schema.org JSON-LD graph with SportsEvent, Organization, and Offers", () => {
    const structuredDataPath = path.join(ROOT, "components", "shared", "structured-data.tsx");
    expect(fs.existsSync(structuredDataPath)).toBe(true);
    const content = fs.readFileSync(structuredDataPath, "utf8");

    expect(content).toContain("https://schema.org");
    expect(content).toContain("SportsEvent");
    expect(content).toContain("OfflineEventAttendanceMode");
    expect(content).toContain("EventScheduled");
    expect(content).toContain("Abeokuta Polo Club");
    expect(content).toContain("https://abeokutapoloclub.org.ng");
    expect(content).toContain("Day 1 Pass — Opening Chukka & Grand Reception");
    expect(content).toContain("Day 3 VVIP Royal Cup Grand Finale Pass");
  });
});

describe("Membership Menu Link Verification", () => {
  const EXPECTED_MEMBERSHIP_URL = "https://www.abeokutapoloclub.org.ng/register";

  it("public-header.tsx contains Membership menu link resolving externally to abeokutapoloclub.org.ng/register", () => {
    const headerPath = path.join(ROOT, "components", "design", "public", "public-header.tsx");
    const content = fs.readFileSync(headerPath, "utf8");

    expect(content).toContain(EXPECTED_MEMBERSHIP_URL);
    expect(content).toContain('target="_blank"');
    expect(content).toContain('rel="noopener noreferrer"');
    expect(content).toContain("Membership");
  });

  it("public-footer.tsx contains Membership link resolving externally to abeokutapoloclub.org.ng/register", () => {
    const footerPath = path.join(ROOT, "components", "design", "public", "public-footer.tsx");
    const content = fs.readFileSync(footerPath, "utf8");

    expect(content).toContain(EXPECTED_MEMBERSHIP_URL);
    expect(content).toContain("Membership");
  });

  it("social-share-bar.tsx exists and implements WhatsApp, Twitter/X, and clipboard copying", () => {
    const sharePath = path.join(ROOT, "components", "shared", "social-share-bar.tsx");
    expect(fs.existsSync(sharePath)).toBe(true);
    const content = fs.readFileSync(sharePath, "utf8");

    expect(content).toContain("https://api.whatsapp.com/send");
    expect(content).toContain("https://twitter.com/intent/tweet");
    expect(content).toContain("navigator.clipboard");
  });
});
