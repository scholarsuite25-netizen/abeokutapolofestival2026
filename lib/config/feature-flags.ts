import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Governed feature flags.
 *
 * These replace the in-code "switches" that used to sit in the UI: a flag
 * can only be changed by an administrator, every change is recorded in
 * `feature_flag_history`, and a flag may expire. There is deliberately NO
 * public or guest-facing switch.
 *
 * Fails open to the caller's fallback when the table is not present or the
 * database cannot be reached.
 */

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: boolean; expiresAt: number }>();

export async function isFeatureEnabled(key: string, fallback = false): Promise<boolean> {
  if (!isSupabaseConfigured()) return fallback;

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("is_enabled, expires_at")
      .eq("flag_key", key)
      .maybeSingle();

    if (error || !data) return fallback;

    const expired = data.expires_at ? new Date(data.expires_at).getTime() <= Date.now() : false;
    const value = expired ? fallback : Boolean(data.is_enabled);

    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch {
    return fallback;
  }
}

/** Clears the cached flag values (used by tests and after a flag change). */
export function resetFeatureFlagCache(): void {
  cache.clear();
}
