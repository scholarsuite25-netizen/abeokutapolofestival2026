import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Day 3 Pilot Testing Fee Mode (₦100.00) Controller
 *
 * Allows toggling between the ₦100.00 pilot testing fee and the official brochure prices:
 *  - The Kings Table: ₦5,000,000 (10 Guests)
 *  - The Royal Table: ₦3,000,000 (8 Guests)
 *  - The Queens Table: ₦2,000,000 (6 Guests)
 *  - The Premium Table: ₦500,000 (5 Guests)
 *  - The Regular Section: ₦50,000 Per Person (1 Guest)
 *
 * Auto-Removal Rule:
 * Once a ₦100.00 test payment is verified, the testing fee mode automatically disables
 * itself and reverts all checkouts to the official brochure amounts.
 */

let memoryTestingFeeEnabled: boolean | null = null;
let lastAutoRemovedRef: string | null = null;

export interface TestingFeeStatus {
  enabled: boolean;
  autoRemovedAfterPayment: boolean;
  lastPaymentRef?: string | null;
  updatedAt?: string | null;
  reason?: string | null;
}

export async function getTestingFeeStatus(): Promise<TestingFeeStatus> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("audit_logs")
        .select("details, created_at")
        .eq("action", "system.testing_fee_mode")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.details && typeof (data.details as Record<string, unknown>).enabled === "boolean") {
        const details = data.details as Record<string, unknown>;
        const enabled = Boolean(details.enabled);
        memoryTestingFeeEnabled = enabled;
        return {
          enabled,
          autoRemovedAfterPayment: String(details.reason || "").startsWith("auto_removed"),
          lastPaymentRef: (details.paymentRef as string) || lastAutoRemovedRef,
          updatedAt: data.created_at,
          reason: (details.reason as string) || null,
        };
      }
    } catch {
      // Fallback to in-memory state
    }
  }

  const enabled = memoryTestingFeeEnabled ?? true;
  return {
    enabled,
    autoRemovedAfterPayment: !enabled && Boolean(lastAutoRemovedRef),
    lastPaymentRef: lastAutoRemovedRef,
    updatedAt: null,
    reason: enabled ? "default_pilot_testing_active" : "disabled",
  };
}

export async function setTestingFeeMode(
  enabled: boolean,
  options: { reason?: string; paymentRef?: string } = {},
): Promise<TestingFeeStatus> {
  memoryTestingFeeEnabled = enabled;
  if (options.paymentRef) {
    lastAutoRemovedRef = options.paymentRef;
  }

  const reason =
    options.reason || (enabled ? "manual_toggle_enabled" : "manual_toggle_disabled");

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      await supabase.from("audit_logs").insert({
        action: "system.testing_fee_mode",
        resource_type: "pricing",
        resource_id: "day3_testing_fee",
        details: {
          enabled,
          reason,
          paymentRef: options.paymentRef || null,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Non-blocking fallback
    }
  }

  return {
    enabled,
    autoRemovedAfterPayment: reason.startsWith("auto_removed"),
    lastPaymentRef: options.paymentRef || lastAutoRemovedRef,
    updatedAt: new Date().toISOString(),
    reason,
  };
}

/**
 * Automatically disables and removes the ₦100 testing fee mode immediately after
 * a successful ₦100 testing fee payment is verified.
 */
export async function autoDisableTestingFeeAfterPayment(
  paymentRef: string,
  amountNgn: number,
): Promise<boolean> {
  // Only trigger auto-removal when the payment was a ₦100 testing fee transaction (< ₦50,000)
  if (amountNgn > 0 && amountNgn < 50_000) {
    await setTestingFeeMode(false, {
      reason: `auto_removed_after_successful_testing_fee_payment`,
      paymentRef,
    });
    return true;
  }
  return false;
}

export function resetTestingFeeModeForTests(enabled = true): void {
  memoryTestingFeeEnabled = enabled;
  lastAutoRemovedRef = null;
}
