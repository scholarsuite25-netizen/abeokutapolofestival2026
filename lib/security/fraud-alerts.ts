import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Raises a fraud / abuse alert for the Trust & Safety desk.
 *
 * Every guard in the system (duplicate registration, table already taken,
 * rate-limit trips) reports here so the Secretariat can review patterns
 * instead of chasing them one guest at a time. The write is deliberately
 * non-blocking: an alert that fails to record must never stop a guest.
 */

export type FraudSeverity = "low" | "medium" | "high" | "critical";
export type FraudCategory =
  | "duplicate_registration"
  | "table_double_booking"
  | "reference_reuse"
  | "rate_limited"
  | "unverified_payment_attempt"
  | "duplicate_scan"
  | "manual_override";

export interface FraudAlertInput {
  severity?: FraudSeverity;
  category: FraudCategory;
  subjectType?: string;
  subjectId?: string;
  details?: Record<string, unknown>;
}

export async function raiseFraudAlert(input: FraudAlertInput): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createAdminClient();
    await supabase.from("fraud_alerts").insert({
      severity: input.severity ?? "medium",
      category: input.category,
      subject_type: input.subjectType ?? null,
      subject_id: input.subjectId ?? null,
      details: (input.details ?? {}) as Record<string, unknown>,
      status: "open",
    });
  } catch (err) {
    console.warn(
      `[fraud-alert] Could not record "${input.category}":`,
      err instanceof Error ? err.message : String(err),
    );
  }
}
