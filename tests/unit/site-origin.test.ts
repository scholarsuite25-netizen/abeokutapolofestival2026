import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSiteOrigin,
  siteUrl,
  siteHostname,
  CANONICAL_SITE_ORIGIN,
} from "@/lib/site";

/**
 * Review finding L4: all absolute URL generation must flow through the single
 * canonical helper in lib/site.ts with the documented precedence.
 */
describe("lib/site — canonical origin precedence (L4)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers an explicit non-local NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.org");
    expect(getSiteOrigin()).toBe("https://staging.example.org");
  });

  it("strips trailing slashes from the configured URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.org///");
    expect(getSiteOrigin()).toBe("https://staging.example.org");
  });

  it("honours an explicit localhost URL outside production builds", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "test");
    expect(getSiteOrigin()).toBe("http://localhost:3000");
  });

  it("never lets a localhost URL leak from a production build", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "production");
    expect(getSiteOrigin()).toBe(CANONICAL_SITE_ORIGIN);
  });

  it("uses the Vercel deployment URL on non-production deployments", () => {
    vi.stubEnv("VERCEL_URL", "feature-branch-abc123.vercel.app");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(getSiteOrigin()).toBe("https://feature-branch-abc123.vercel.app");
  });

  it("uses the canonical origin on production Vercel deployments (not the deployment URL)", () => {
    vi.stubEnv("VERCEL_URL", "feature-branch-abc123.vercel.app");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(getSiteOrigin()).toBe(CANONICAL_SITE_ORIGIN);
  });

  it("falls back to the canonical production origin when nothing is configured", () => {
    expect(getSiteOrigin()).toBe("https://www.abeokutapolofestival2026.org.ng");
  });

  it("siteUrl joins a path (with or without a leading slash)", () => {
    expect(siteUrl("/register")).toBe(`${CANONICAL_SITE_ORIGIN}/register`);
    expect(siteUrl("register")).toBe(`${CANONICAL_SITE_ORIGIN}/register`);
    expect(siteUrl("/pass/ABK-2026-X7K9")).toContain("/pass/ABK-2026-X7K9");
  });

  it("siteHostname strips the scheme for display strings", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.org");
    expect(siteHostname()).toBe("staging.example.org");
  });
});
