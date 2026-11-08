"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { writeAudit } from "@/lib/supabase/audit";

interface DeviceBindingRecord {
  deviceId: string;
  passCode: string;
  holderName?: string;
  claimedAt: string;
}

// In-memory device binding registry for rapid turnstile & client verification
const memoryBindingRegistry = new Map<string, DeviceBindingRecord>();

/**
 * Checks whether a pass code represents a Day 3 Table Package pass.
 * Codes match format ABK-2026-KT..., ABK-2026-RT..., ABK-2026-QT..., ABK-2026-PT...
 */
export async function isTablePassCode(passCode: string): Promise<boolean> {
  const upper = passCode.toUpperCase().trim();
  return (
    upper.includes("-KT") ||
    upper.includes("-RT") ||
    upper.includes("-QT") ||
    upper.includes("-PT") ||
    upper.includes("-TBL-")
  );
}

/**
 * Verifies or binds a pass to a recipient device identifier.
 * - If pass is not yet bound: binds to this device immediately.
 * - If pass is already bound to this device: authorizes display.
 * - If pass is bound to another device: blocks third-party forwarding.
 */
export async function verifyPassDeviceBinding(
  passCodeInput: string,
  deviceIdInput: string,
  holderName?: string,
): Promise<{
  isAuthorized: boolean;
  status: "newly_bound" | "already_bound_to_this_device" | "forwarding_blocked" | "unrestricted";
  boundDeviceId?: string;
  message?: string;
}> {
  const passCode = passCodeInput.toUpperCase().trim();
  const deviceId = deviceIdInput.trim();

  if (!passCode || !deviceId) {
    return {
      isAuthorized: true,
      status: "unrestricted",
    };
  }

  // Host tickets (Seat 1: e.g. -S01-) are unrestricted master passes for the buyer
  if (passCode.includes("-S01-")) {
    return {
      isAuthorized: true,
      status: "unrestricted",
    };
  }

  // Check 1: In-memory registry
  let existing = memoryBindingRegistry.get(passCode);

  // Check 2: Supabase credentials table
  if (!existing && isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("credentials")
        .select("id, bound_device_id, holder_name, created_at")
        .eq("pass_code", passCode)
        .maybeSingle();

      if (data && (data as any).bound_device_id) {
        existing = {
          deviceId: (data as any).bound_device_id,
          passCode,
          holderName: data.holder_name,
          claimedAt: data.created_at,
        };
        memoryBindingRegistry.set(passCode, existing);
      }
    } catch {
      // Fallback to memory
    }
  }

  // Case A: Not yet bound -> Bind to this device
  if (!existing) {
    const record: DeviceBindingRecord = {
      deviceId,
      passCode,
      holderName,
      claimedAt: new Date().toISOString(),
    };
    memoryBindingRegistry.set(passCode, record);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        await supabase
          .from("credentials")
          .update({
            bound_device_id: deviceId,
            claimed_at: record.claimedAt,
          } as any)
          .eq("pass_code", passCode);

        await writeAudit({
          action: "pass.device_bound",
          entityType: "credential",
          entityId: passCode,
          metadata: { deviceId, holderName, passCode },
        });
      } catch {
        // Safe fallback
      }
    }

    return {
      isAuthorized: true,
      status: "newly_bound",
      boundDeviceId: deviceId,
    };
  }

  // Case B: Matches this device -> Authorized
  if (existing.deviceId === deviceId) {
    return {
      isAuthorized: true,
      status: "already_bound_to_this_device",
      boundDeviceId: deviceId,
    };
  }

  // Case C: Mismatch -> Block third-party forwarding
  return {
    isAuthorized: false,
    status: "forwarding_blocked",
    boundDeviceId: existing.deviceId,
    message:
      "This Day 3 Table pass has already been claimed and bound to another recipient's mobile device. Under Abeokuta Polo Festival anti-scalping security protocol, VIP table passes cannot be forwarded or transferred to third parties.",
  };
}
