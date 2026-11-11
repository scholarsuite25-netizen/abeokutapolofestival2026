import "server-only";
import type { NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Credential-verification throttling — review findings L1 + L2.
 *
 *  L1 (client identity): `getClientIp` extracts the caller's IP safely.
 *     `req.ip` is preferred when the platform provides it; otherwise the LAST
 *     `x-forwarded-for` entry is used (the first entries are client-controlled
 *     and trivially spoofable — the last hop is appended by the trusted
 *     proxy), then `x-real-ip`. Without a usable IP every request collapses
 *     into a single shared `"anonymous"` bucket (fail closed, never fail open).
 *
 *  L2 (durability): the legacy limiter kept counts in this instance's memory,
 *     which resets per serverless invocation. `consumeRateLimit` now runs a
 *     two-layer check: a fast in-process bucket as the first guard, plus an
 *     atomic Postgres counter (`supabase/migrations/0017`) that survives
 *     deploys and spans all instances. A database error fails OPEN with a
 *     warning — HMAC token verification remains the primary protection — but
 *     the local guard keeps enforcing in the meantime.
 */

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_ATTEMPTS = 30;

interface LocalBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, LocalBucket>();
const LOCAL_BUCKET_CAP = 10_000;

/** Extract the best-effort client IP for throttling (see module docs). */
export function getClientIp(req: NextRequest): string {
  // `req.ip` exists on some Next runtimes (Edge/middleware) but is not part of
  // this version's route-handler NextRequest type — read it defensively.
  const platformIp = (req as unknown as { ip?: string }).ip;
  if (platformIp && platformIp.trim()) return platformIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    // Last entry = appended by the nearest trusted proxy; earlier entries are
    // attacker-controlled and must not select the bucket.
    const trusted = entries[entries.length - 1];
    if (trusted) return trusted;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  return "anonymous";
}

/** In-process bucket — fast first guard, identical semantics to the legacy limiter. */
function localConsume(key: string): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    if (buckets.size >= LOCAL_BUCKET_CAP) {
      // Drop expired entries first; as a last resort clear entirely so the
      // map can never grow without bound.
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
      if (buckets.size >= LOCAL_BUCKET_CAP) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}

/**
 * Durable counter via the `consume_rate_limit` RPC.
 * Returns `true`/`false` when the database answered, `null` on any error or
 * when Supabase is not configured (caller then fails open for this layer).
 */
async function durableConsume(key: string): Promise<boolean | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_bucket: key,
      p_window_seconds: Math.max(1, Math.round(RATE_LIMIT_WINDOW_MS / 1000)),
      p_max_attempts: RATE_LIMIT_MAX_ATTEMPTS,
    });
    if (error) {
      console.warn(
        `[rate-limit] Durable check failed for bucket "${key}": ${error.message} — falling back to local limiter.`,
      );
      return null;
    }
    return typeof data === "boolean" ? data : null;
  } catch (err) {
    console.warn(
      `[rate-limit] Durable check errored for bucket "${key}": ${err instanceof Error ? err.message : String(err)} — falling back to local limiter.`,
    );
    return null;
  }
}

/**
 * Consumes one attempt against the given bucket.
 * Returns `{ allowed: false }` only when a layer positively denies; database
 * failures fail open (documented above).
 */
export async function consumeRateLimit(key: string): Promise<{ allowed: boolean }> {
  if (!localConsume(key)) return { allowed: false };

  const durable = await durableConsume(key);
  if (durable === false) return { allowed: false };

  return { allowed: true };
}

/** Test helper: clears the in-process buckets between cases. */
export function resetLocalRateLimitBuckets(): void {
  buckets.clear();
}
