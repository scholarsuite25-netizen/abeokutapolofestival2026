/**
 * Canonical public origin for absolute URLs — emails, PDFs, ICS feeds,
 * server-rendered share links, and SSR fallbacks in client components.
 *
 * Single source of truth (review finding L4): call sites must never hardcode
 * the domain, so an environment or domain change is a one-line edit here.
 *
 * This module is isomorphic: it reads only `process.env` (no server-only
 * imports), so both server and client components may use it. In the browser
 * `VERCEL_URL` is undefined and the configured `NEXT_PUBLIC_*` value is
 * inlined at build time.
 */

/** Production canonical origin (PROJECT.md §Apex Domain) used when no valid public URL is configured. */
export const CANONICAL_SITE_ORIGIN = "https://www.abeokutapolofestival2026.org.ng";

/**
 * Returns the public site origin with no trailing slash.
 *
 * Precedence:
 *  1. `NEXT_PUBLIC_SITE_URL` when set — a localhost value is honoured only
 *     outside production builds so local dev keeps working local links while
 *     deployed builds can never leak `localhost` URLs;
 *  2. `https://${VERCEL_URL}` on non-production Vercel deployments (preview
 *     and branch deploys get links that actually resolve);
 *  3. the canonical production origin.
 */
export function getSiteOrigin(): string {
  const configured = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) {
    if (!isLocalOrigin(configured)) return configured;
    if (process.env.NODE_ENV !== "production") return configured;
  }

  const isProductionDeploy = process.env.VERCEL_ENV === "production";
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && !isProductionDeploy) {
    const origin = trimTrailingSlash(`https://${vercelUrl}`);
    if (origin && !isLocalOrigin(origin)) return origin;
  }

  return CANONICAL_SITE_ORIGIN;
}

/** Joins the site origin with a path: `siteUrl("/register")` → origin + path. */
export function siteUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteOrigin()}${suffix}`;
}

/** Origin without scheme, for display strings (QR captions, PDF footers). */
export function siteHostname(): string {
  return getSiteOrigin().replace(/^https?:\/\//, "");
}

function trimTrailingSlash(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : null;
}

function isLocalOrigin(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1") || url.includes("[::1]");
}
