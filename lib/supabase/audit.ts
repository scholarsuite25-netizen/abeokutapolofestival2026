import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Writes an audit record via the `write_audit()` RPC (actor is always the
 * caller's own uid — set by current_user_id()). Fire-and-forget friendly.
 */
export async function writeAudit(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  await supabase.rpc("write_audit", {
    p_action: params.action,
    p_resource_type: params.entityType ?? null,
    p_resource_id: params.entityId ? String(params.entityId) : null,
    p_details: params.metadata ?? {},
  });
}
