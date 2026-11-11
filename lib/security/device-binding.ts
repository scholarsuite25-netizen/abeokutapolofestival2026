"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { writeAudit } from "@/lib/supabase/audit";
import { sendEmail } from "@/lib/email/client";
import { siteUrl } from "@/lib/site";

export type DeviceType = "mobile" | "desktop" | "tablet";

export interface DeviceBindingStatus {
  isBound: boolean;
  boundDeviceId: string | null;
  isAuthorized: boolean;
  isCurrentDeviceMobile: boolean;
  deviceType: DeviceType;
  rejectionReason?: "FORWARDING_LOCKED" | "DESKTOP_ACCESS_RESTRICTED" | "DEVICE_MISMATCH";
}

export interface DeviceBindingRecord {
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
 * Retrieves the persisted device binding record for a pass code.
 *
 * Review finding L3: the durable registry is now authoritative — the
 * database is read FIRST whenever Supabase is configured, and this
 * instance's memory map is only a fallback/cache. A registry row with a
 * null binding (e.g. a Secretariat reset performed on another instance)
 * clears any stale in-memory record instead of shadowing it.
 */
export async function getPassBindingRecord(passCodeInput: string): Promise<DeviceBindingRecord | null> {
  const passCode = passCodeInput.toUpperCase().trim();
  if (!passCode) return null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("credentials")
        .select("id, bound_device_id, holder_name, created_at, claimed_at")
        .eq("pass_code", passCode)
        .maybeSingle();

      if (!error && data) {
        if ((data as any).bound_device_id) {
          const record: DeviceBindingRecord = {
            deviceId: (data as any).bound_device_id,
            passCode,
            holderName: data.holder_name,
            claimedAt: (data as any).claimed_at || data.created_at,
          };
          memoryBindingRegistry.set(passCode, record);
          return record;
        }
        // Authoritative "unbound" answer — purge stale local memory.
        memoryBindingRegistry.delete(passCode);
        return null;
      }
      // No credential row (e.g. invitation codes) or query error: fall back
      // to the local registry below.
    } catch {
      // Database unreachable: fall back to the local registry.
    }
  }

  return memoryBindingRegistry.get(passCode) || null;
}

/**
 * Verifies or binds a pass to a recipient device identifier.
 * - If passCode is Table Host (-S01-): unrestricted master access for purchaser.
 * - If deviceId is empty and pass is unbound: returns status "unrestricted".
 * - If deviceId is empty and pass is already bound: returns "forwarding_blocked".
 * - If pass is not yet bound: binds exclusively to this device.
 * - If pass is already bound to this device: authorizes display.
 * - If pass is bound to another device: blocks third-party forwarding with access-locked message.
 */
export async function verifyPassDeviceBinding(
  passCodeInput: string,
  deviceIdInput: string,
  holderName?: string,
): Promise<{
  isAuthorized: boolean;
  status: "newly_bound" | "already_bound_to_this_device" | "forwarding_blocked" | "unrestricted" | "persistence_failed";
  boundDeviceId?: string;
  message?: string;
}> {
  const passCode = passCodeInput.toUpperCase().trim();
  const deviceId = deviceIdInput.trim();

  if (!passCode) {
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

  const existing = await getPassBindingRecord(passCode);

  // If no device ID provided (e.g. desktop unbound preview or empty check)
  if (!deviceId) {
    if (!existing) {
      return {
        isAuthorized: true,
        status: "unrestricted",
      };
    }
    // Pass is already bound, but no matching device provided
    return {
      isAuthorized: false,
      status: "forwarding_blocked",
      boundDeviceId: existing.deviceId,
      message:
        "Pass is non-transferable and locked to another device. This pass has already been claimed and bound to another recipient's mobile device. Under Abeokuta Polo Festival anti-scalping security protocol, passes cannot be forwarded or accessed from secondary devices.",
    };
  }

  // Case A: Not yet bound -> Bind to this device
  if (!existing) {
    const record: DeviceBindingRecord = {
      deviceId,
      passCode,
      holderName,
      claimedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      // Review finding L3: persist the binding BEFORE claiming success.
      // A binding that only exists in this instance's memory is lost on the
      // next invocation — so any failure to write the durable registry
      // fails CLOSED instead of reporting "newly bound".
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("credentials")
          .update({
            bound_device_id: deviceId,
            is_locked_to_device: true,
            claimed_at: record.claimedAt,
          } as any)
          .eq("pass_code", passCode)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
          console.warn(
            `[device-binding] Refused binding claim for "${passCode}": no credential row exists to persist the binding to.`,
          );
          return {
            isAuthorized: false,
            status: "persistence_failed",
            boundDeviceId: deviceId,
            message:
              "This pass could not be securely claimed right now. Please try again in a moment or visit the Secretariat desk for accreditation.",
          };
        }
      } catch (err) {
        console.error(
          `[device-binding] Failed to persist binding for "${passCode}":`,
          err,
        );
        return {
          isAuthorized: false,
          status: "persistence_failed",
          boundDeviceId: deviceId,
          message:
            "This pass could not be securely claimed right now. Please try again in a moment or visit the Secretariat desk for accreditation.",
        };
      }
    }

    memoryBindingRegistry.set(passCode, record);

    if (isSupabaseConfigured()) {
      try {
        await writeAudit({
          action: "pass.device_bound",
          entityType: "credential",
          entityId: passCode,
          metadata: { deviceId, holderName, passCode },
        });
      } catch (auditErr) {
        // The binding is already durable; an audit hiccup must not revoke it.
        console.error(
          `[device-binding] Audit write failed for pass.device_bound ("${passCode}"):`,
          auditErr,
        );
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
      "Pass is non-transferable and locked to another device. This pass has already been claimed and bound to another recipient's mobile device. Under Abeokuta Polo Festival anti-scalping security protocol, passes cannot be forwarded, transferred, or shared with third parties once claimed.",
  };
}

/**
 * Binds a pass exclusively to a mobile device.
 */
export async function bindPassToMobileDevice(
  passCodeInput: string,
  mobileDeviceId: string,
  holderName?: string,
): Promise<{
  success: boolean;
  status: "newly_bound" | "already_bound_to_this_device" | "forwarding_blocked" | "invalid_device" | "persistence_failed";
  boundDeviceId?: string;
  error?: string;
}> {
  const cleanId = mobileDeviceId.trim();
  if (!cleanId) {
    return {
      success: false,
      status: "invalid_device",
      error: "Device identifier cannot be empty",
    };
  }

  const res = await verifyPassDeviceBinding(passCodeInput, cleanId, holderName);
  if (res.isAuthorized) {
    return {
      success: true,
      status: res.status === "already_bound_to_this_device" ? "already_bound_to_this_device" : "newly_bound",
      boundDeviceId: res.boundDeviceId,
    };
  }

  if (res.status === "persistence_failed") {
    return {
      success: false,
      status: "persistence_failed",
      boundDeviceId: res.boundDeviceId,
      error: res.message || "Binding could not be persisted to the durable registry",
    };
  }

  return {
    success: false,
    status: "forwarding_blocked",
    boundDeviceId: res.boundDeviceId,
    error: res.message || "Pass is non-transferable and locked to another device",
  };
}

/**
 * Checks pass device access and returns detailed interface contract status.
 */
export async function checkPassDeviceAccess(
  passCodeInput: string,
  currentDeviceId: string | null,
  isMobile: boolean,
): Promise<DeviceBindingStatus> {
  const passCode = passCodeInput.toUpperCase().trim();
  const deviceId = (currentDeviceId || "").trim();

  // Host pass check
  if (passCode.includes("-S01-")) {
    return {
      isBound: false,
      boundDeviceId: null,
      isAuthorized: true,
      isCurrentDeviceMobile: isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
    };
  }

  const existing = await getPassBindingRecord(passCode);

  if (!existing) {
    return {
      isBound: false,
      boundDeviceId: null,
      isAuthorized: true,
      isCurrentDeviceMobile: isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
    };
  }

  // Bound pass viewed from desktop
  if (!isMobile) {
    return {
      isBound: true,
      boundDeviceId: existing.deviceId,
      isAuthorized: false,
      isCurrentDeviceMobile: false,
      deviceType: "desktop",
      rejectionReason: "DESKTOP_ACCESS_RESTRICTED",
    };
  }

  // Bound pass viewed on mobile
  if (deviceId && deviceId === existing.deviceId) {
    return {
      isBound: true,
      boundDeviceId: existing.deviceId,
      isAuthorized: true,
      isCurrentDeviceMobile: true,
      deviceType: "mobile",
    };
  }

  return {
    isBound: true,
    boundDeviceId: existing.deviceId,
    isAuthorized: false,
    isCurrentDeviceMobile: true,
    deviceType: "mobile",
    rejectionReason: "FORWARDING_LOCKED",
  };
}

/**
 * Resets a pass device binding (Secretariat override tool).
 *
 * Review finding L3: with the database configured, the durable reset must
 * succeed before this reports success — a DB error returns `success: false`
 * instead of silently pretending the pass is unlocked. The audit write runs
 * in its own try/catch so it can never flip the outcome.
 */
export async function resetPassDeviceBinding(passCodeInput: string): Promise<{ success: boolean }> {
  const passCode = passCodeInput.toUpperCase().trim();
  memoryBindingRegistry.delete(passCode);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("credentials")
        .update({
          bound_device_id: null,
          is_locked_to_device: false,
          claimed_at: null,
        } as any)
        .eq("pass_code", passCode)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        // No durable binding existed for this code; local memory is cleared.
        console.warn(
          `[device-binding] Reset for "${passCode}" matched no credential row — nothing durable to unlock.`,
        );
      }
    } catch (err) {
      console.error(
        `[device-binding] Failed to persist binding reset for "${passCode}":`,
        err,
      );
      return { success: false };
    }

    try {
      await writeAudit({
        action: "pass.device_reset",
        entityType: "credential",
        entityId: passCode,
        metadata: { passCode },
      });
    } catch (auditErr) {
      console.error(
        `[device-binding] Audit write failed for pass.device_reset ("${passCode}"):`,
        auditErr,
      );
    }

    return { success: true };
  }

  return { success: true };
}

/**
 * Dispatches an email containing the direct mobile binding link to the attendee.
 */
export async function sendPassMobileBindingEmail(params: {
  email: string;
  passCode: string;
  holderName?: string;
  passUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, passCode, holderName, passUrl } = params;
  if (!email || !email.includes("@")) {
    return { success: false, error: "Invalid email address" };
  }

  const name = holderName || "Esteemed Guest";
  const bindingUrl = passUrl || siteUrl(`/pass/${passCode}?bind=mobile`);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #141f18; background-color: #faf8f5;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; padding: 4px 12px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
          Abeokuta Polo Festival 2026 — Official Gate Pass
        </span>
        <h1 style="color: #064e3b; margin: 12px 0 4px; font-size: 24px;">Bind Your Official Gate Pass</h1>
        <p style="color: #4b5563; font-size: 14px; margin: 0;">18–20 December 2026 · Kobape Grounds, Abeokuta</p>
      </div>

      <div style="background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center;">
        <p style="font-size: 15px; margin-bottom: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
          Your gate pass code is <strong style="font-family: monospace; color: #064e3b; font-size: 16px;">${passCode}</strong>.
          Under festival anti-scalping security protocol, your pass must be bound exclusively to your mobile phone for contactless turnstile admission.
        </p>

        <a href="${bindingUrl}" style="display: inline-block; background-color: #064e3b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(6,78,59,0.3);">
          📱 Open &amp; Bind Pass to My Phone
        </a>

        <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; font-size: 12px; color: #166534; text-align: left;">
          <strong>Turnstile Notice:</strong> Opening this link on your smartphone automatically locks the pass to your device. Passes cannot be forwarded or screenshotted for multiple admissions.
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #6b7280;">
        <p>Abeokuta Polo Club · Kobape Expressway, Abeokuta, Ogun State</p>
        <p>Under the Royal Patronage of HRM Oba Dr. Michael Aremu Gbadebo CFR</p>
      </div>
    </div>
  `;

  try {
    const res = await sendEmail({
      to: email,
      subject: `📱 Your Mobile Gate Pass Binding Link — Abeokuta Polo Festival 2026 (${passCode})`,
      html,
    });
    return { success: res.success, error: res.error };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to send email" };
  }
}
