import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireServerEnv } from "@/lib/env";

/**
 * Admin (service-role) Supabase client — bypasses RLS.
 *
 * RULES (ARCHITECTURE_PLAN.md §3.2 / §6.5):
 *  - import only from `server-only` modules (route handlers, server actions, jobs);
 *  - never pass this client to a component or public function;
 *  - every use must be justified by an audit-log write when it touches user data.
 */
export function createAdminClient() {
  const env = requireServerEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Admin client unavailable: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment",
    );
  }

  return createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
