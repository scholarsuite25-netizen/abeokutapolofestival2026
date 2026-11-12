import { createHash } from "node:crypto";
import type { ComplimentaryInvitation, InvitationDeviceBindingResult } from "./types";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

interface InvitationDbRow {
  id: string;
  invitation_code: string;
  first_name: string | null;
  surname: string | null;
  designation: string;
  category: string;
  is_custom_category: boolean | null;
  security_seal: string | null;
  qr_payload: string | null;
  qr_token: string | null;
  bound_device_id: string | null;
  is_locked_to_device: boolean | null;
  claimed_at: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
}

interface CredentialDbRow {
  id: string;
  pass_code: string;
  holder_name: string;
  pass_type: string;
  organization: string | null;
  affiliation_type: string | null;
  bound_device_id: string | null;
  is_locked_to_device: boolean | null;
  claimed_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Robust in-memory storage fallback for Complimentary Invitations.
 * Keyed by upper-cased invitation code and by UUID ID.
 */
const memoryInvitations = new Map<string, ComplimentaryInvitation>();

/**
 * Synchronous in-memory lookup by code or ID.
 */
export function getInvitationByCodeSync(codeOrId: string): ComplimentaryInvitation | null {
  if (!codeOrId) return null;
  const normalized = codeOrId.trim().toUpperCase();
  return memoryInvitations.get(normalized) || memoryInvitations.get(codeOrId.trim()) || null;
}

/**
 * Clears the in-memory invitations store (primarily for unit tests).
 */
export function clearInvitationsMemoryStore(): void {
  memoryInvitations.clear();
}

/**
 * Hashes a token for safe at-rest database storage and lookup.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Saves a complimentary invitation using dual-persistence:
 * 1. Immediate in-memory persistence.
 * 2. Async persistence to Supabase `invitations` table or `credentials` table fallback.
 */
export async function saveInvitation(
  invitation: ComplimentaryInvitation
): Promise<ComplimentaryInvitation> {
  const normalizedCode = invitation.invitationCode.toUpperCase().trim();
  const stored: ComplimentaryInvitation = {
    ...invitation,
    invitationCode: normalizedCode,
    updatedAt: new Date().toISOString(),
  };

  // 1. In-memory storage (guaranteed availability)
  memoryInvitations.set(normalizedCode, stored);
  if (stored.id) {
    memoryInvitations.set(stored.id, stored);
  }

  // 2. Dual-persistence: Attempt Supabase storage
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // Primary attempt: dedicated `invitations` table
      const invitationRow: InvitationDbRow = {
        id: stored.id,
        invitation_code: stored.invitationCode,
        first_name: stored.firstName || null,
        surname: stored.surname || null,
        designation: stored.designation,
        category: stored.category,
        is_custom_category: stored.isCustomCategory,
        security_seal: stored.securitySeal,
        qr_payload: stored.qrPayload,
        qr_token: stored.qrToken || null,
        bound_device_id: stored.boundDeviceId || null,
        is_locked_to_device: stored.isLockedToDevice,
        claimed_at: stored.claimedAt || null,
        status: stored.status || "active",
        created_at: stored.createdAt,
        updated_at: stored.updatedAt || null,
      };

      const { error: inviteError } = await supabase
        .from("invitations")
        .upsert(invitationRow, { onConflict: "invitation_code" });

      if (inviteError) {
        // Fallback: sync into existing `credentials` table
        const holderName =
          [stored.firstName, stored.surname].filter(Boolean).join(" ") ||
          stored.designation ||
          "Distinguished Guest";

        const tokenHash = hashToken(stored.qrToken || stored.qrPayload || stored.invitationCode);

        await supabase.from("credentials").upsert(
          {
            id: stored.id,
            pass_code: stored.invitationCode,
            holder_name: holderName,
            pass_type: "complimentary",
            token_hash: tokenHash,
            zone_access: ["vip_lounge", "royal_box", "general_lawn"],
            status: stored.status || "active",
            organization: stored.category,
            affiliation_type: stored.isCustomCategory ? "custom_invitation" : "complimentary",
            bound_device_id: stored.boundDeviceId || null,
            is_locked_to_device: stored.isLockedToDevice,
            claimed_at: stored.claimedAt || null,
            created_at: stored.createdAt,
            updated_at: stored.updatedAt || new Date().toISOString(),
          },
          { onConflict: "pass_code" }
        );
      }
    } catch {
      // In-memory record remains intact and authoritative in offline / test mode
    }
  }

  return stored;
}

/**
 * Retrieves a complimentary invitation by code or ID.
 *
 * Queries Supabase FIRST when configured so device bindings are durable and
 * consistent across all serverless instances, falling back to in-memory store
 * for offline/unit-test environments.
 */
export async function getInvitationByCode(codeOrId: string): Promise<ComplimentaryInvitation | null> {
  if (!codeOrId) return null;
  const trimmed = codeOrId.trim();
  const normalized = trimmed.toUpperCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

  // 1. Check Supabase first so device locks are authoritative across instances
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // Try `invitations` table first (avoid passing non-UUID codes into id.eq)
      const invQuery = supabase.from("invitations").select("*");
      const { data: invData } = await (isUuid
        ? invQuery.or(`invitation_code.ilike.${normalized},id.eq.${trimmed}`)
        : invQuery.ilike("invitation_code", normalized)
      ).maybeSingle<InvitationDbRow>();

      if (invData) {
        const item: ComplimentaryInvitation = {
          id: invData.id,
          invitationCode: invData.invitation_code,
          firstName: invData.first_name,
          surname: invData.surname,
          designation: invData.designation,
          category: invData.category,
          isCustomCategory: Boolean(invData.is_custom_category),
          securitySeal: "Aare Elesin",
          qrPayload: invData.qr_payload || "",
          qrToken: invData.qr_token || undefined,
          boundDeviceId: invData.bound_device_id,
          isLockedToDevice: Boolean(invData.is_locked_to_device),
          claimedAt: invData.claimed_at,
          status: (invData.status as "active" | "revoked") || "active",
          createdAt: invData.created_at,
          updatedAt: invData.updated_at || undefined,
        };
        memoryInvitations.set(item.invitationCode.toUpperCase(), item);
        memoryInvitations.set(item.id, item);
        return item;
      }

      // Fallback: check `credentials` table
      const credQuery = supabase.from("credentials").select("*");
      const { data: credData } = await (isUuid
        ? credQuery.or(`pass_code.ilike.${normalized},id.eq.${trimmed}`)
        : credQuery.ilike("pass_code", normalized)
      ).maybeSingle<CredentialDbRow>();

      if (credData && credData.pass_type === "complimentary") {
        const item: ComplimentaryInvitation = {
          id: credData.id,
          invitationCode: credData.pass_code,
          firstName: null,
          surname: null,
          designation: credData.holder_name || "Honoured Guest",
          category: credData.organization || "VIP",
          isCustomCategory: credData.affiliation_type === "custom_invitation",
          securitySeal: "Aare Elesin",
          qrPayload: `/invitation/verify?id=${credData.pass_code}&seal=Aare+Elesin`,
          boundDeviceId: credData.bound_device_id,
          isLockedToDevice: Boolean(credData.is_locked_to_device),
          claimedAt: credData.claimed_at,
          status: credData.status === "revoked" ? "revoked" : "active",
          createdAt: credData.created_at,
          updatedAt: credData.updated_at,
        };
        memoryInvitations.set(item.invitationCode.toUpperCase(), item);
        memoryInvitations.set(item.id, item);
        return item;
      }
    } catch {
      // Fall back to in-memory store below
    }
  }

  // 2. Fallback to in-memory store (used in unit tests or offline mode)
  const memoryHit = memoryInvitations.get(normalized) || memoryInvitations.get(trimmed);
  if (memoryHit) return memoryHit;

  return null;
}

/**
 * Lists all issued complimentary invitations sorted by creation date descending.
 */
export async function listInvitations(): Promise<ComplimentaryInvitation[]> {
  const results = new Map<string, ComplimentaryInvitation>();

  // 1. Populate from in-memory cache
  for (const inv of memoryInvitations.values()) {
    results.set(inv.invitationCode.toUpperCase(), inv);
  }

  // 2. Fetch from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // Query `invitations` table
      const { data: invRows } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<InvitationDbRow[]>();

      if (invRows && invRows.length > 0) {
        for (const row of invRows) {
          const item: ComplimentaryInvitation = {
            id: row.id,
            invitationCode: row.invitation_code,
            firstName: row.first_name,
            surname: row.surname,
            designation: row.designation,
            category: row.category,
            isCustomCategory: Boolean(row.is_custom_category),
            securitySeal: "Aare Elesin",
            qrPayload: row.qr_payload || "",
            qrToken: row.qr_token || undefined,
            boundDeviceId: row.bound_device_id,
            isLockedToDevice: Boolean(row.is_locked_to_device),
            claimedAt: row.claimed_at,
            status: (row.status as "active" | "revoked") || "active",
            createdAt: row.created_at,
            updatedAt: row.updated_at || undefined,
          };
          results.set(item.invitationCode.toUpperCase(), item);
          memoryInvitations.set(item.invitationCode.toUpperCase(), item);
          memoryInvitations.set(item.id, item);
        }
      } else {
        // Query `credentials` table for complimentary passes
        const { data: credRows } = await supabase
          .from("credentials")
          .select("*")
          .ilike("pass_code", "ABK-2026-INV-%")
          .order("created_at", { ascending: false })
          .returns<CredentialDbRow[]>();

        if (credRows && credRows.length > 0) {
          for (const c of credRows) {
            const code = c.pass_code.toUpperCase();
            if (!results.has(code)) {
              const item: ComplimentaryInvitation = {
                id: c.id,
                invitationCode: c.pass_code,
                firstName: null,
                surname: null,
                designation: c.holder_name,
                category: c.organization || "VIP",
                isCustomCategory: c.affiliation_type === "custom_invitation",
                securitySeal: "Aare Elesin",
                qrPayload: `/invitation/verify?id=${c.pass_code}&seal=Aare+Elesin`,
                boundDeviceId: c.bound_device_id,
                isLockedToDevice: Boolean(c.is_locked_to_device),
                claimedAt: c.claimed_at,
                status: c.status === "revoked" ? "revoked" : "active",
                createdAt: c.created_at,
                updatedAt: c.updated_at,
              };
              results.set(code, item);
              memoryInvitations.set(code, item);
              memoryInvitations.set(item.id, item);
            }
          }
        }
      }
    } catch {
      // In-memory returns cleanly
    }
  }

  return Array.from(results.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Binds an invitation to a recipient client device, enforcing non-transferability.
 */
export async function bindInvitationToDevice(
  codeOrId: string,
  deviceId: string
): Promise<InvitationDeviceBindingResult> {
  const invitation = await getInvitationByCode(codeOrId);
  if (!invitation) {
    return {
      authorized: false,
      status: "not_found",
      message: "Invitation not found.",
    };
  }

  const cleanDeviceId = deviceId.trim();
  if (!cleanDeviceId) {
    return {
      authorized: false,
      status: "not_found",
      message: "Device identifier is required.",
    };
  }

  // Already bound to this device
  if (invitation.boundDeviceId === cleanDeviceId) {
    return {
      authorized: true,
      status: "already_bound",
      boundDeviceId: cleanDeviceId,
      message: "Invitation verified for this authorized device.",
    };
  }

  // Bound to another device -> block unauthorized transfer
  if (invitation.boundDeviceId && invitation.boundDeviceId !== cleanDeviceId) {
    return {
      authorized: false,
      status: "forwarding_blocked",
      boundDeviceId: invitation.boundDeviceId,
      message:
        "This complimentary invitation has already been claimed and locked to another mobile device. Under Abeokuta Polo Festival 2026 security protocol, dignitary passes are non-transferable.",
    };
  }

  // Not yet bound -> bind to this device
  invitation.boundDeviceId = cleanDeviceId;
  invitation.isLockedToDevice = true;
  invitation.claimedAt = new Date().toISOString();

  await saveInvitation(invitation);

  return {
    authorized: true,
    status: "newly_bound",
    boundDeviceId: cleanDeviceId,
    message: "Invitation successfully claimed and bound to this device.",
  };
}

/**
 * Resets an invitation device binding (Secretariat override if dignitary changes mobile phone).
 */
export async function resetInvitationDeviceBinding(
  codeOrId: string
): Promise<{ ok: boolean; message: string }> {
  const invitation = await getInvitationByCode(codeOrId);
  if (!invitation) {
    return { ok: false, message: "Invitation not found." };
  }

  invitation.boundDeviceId = null;
  invitation.isLockedToDevice = false;
  invitation.claimedAt = null;

  await saveInvitation(invitation);

  return {
    ok: true,
    message: `Device binding cleared for invitation ${invitation.invitationCode}. The pass can now be claimed by the recipient's new mobile phone.`,
  };
}
