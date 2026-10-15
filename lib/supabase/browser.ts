import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/**
 * Browser (anon) Supabase client.
 * Uses the published anon key only — never the service-role key.
 */
export function createClient() {
  const env = getPublicEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return createBrowserClient(url, anonKey);
}
