"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require";
import { writeAudit } from "@/lib/supabase/audit";
import {
  createInvitationPayload,
  generateSignedInvitationToken,
  buildInvitationVerificationUrl,
  ROYAL_SECURITY_SEAL,
  generateWhatsAppInvitationText,
} from "@/lib/invitations/issuance";
import {
  saveInvitation,
  listInvitations,
  resetInvitationDeviceBinding,
  getInvitationByCode,
} from "@/lib/invitations/storage";
import {
  STANDARD_INVITATION_CATEGORIES,
  type ComplimentaryInvitation,
} from "@/lib/invitations/types";

export interface IssueInvitationResult {
  ok: boolean;
  error?: string;
  invitation?: ComplimentaryInvitation;
  whatsAppText?: string;
}

/**
 * Server action to issue a new complimentary invitation.
 * Protected by `credential.issue` permission check.
 * Treats First Name and Surname as strictly optional.
 * Requires Designation and Category (Standard or Custom).
 */
export async function issueInvitationAction(
  formData: FormData
): Promise<IssueInvitationResult> {
  let session;
  try {
    session = await requirePermission("credential.issue");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized: credential.issue permission required.";
    return {
      ok: false,
      error: message,
    };
  }

  const firstName = (formData.get("firstName") as string)?.trim() || null;
  const surname = (formData.get("surname") as string)?.trim() || null;
  const designation = (formData.get("designation") as string)?.trim();
  const categorySelect = (formData.get("categorySelect") as string)?.trim();
  const customCategory = (formData.get("customCategory") as string)?.trim();

  // Designation is mandatory
  if (!designation) {
    return {
      ok: false,
      error: "Designation is required (e.g. Managing Director, Royal Envoy, Otunba).",
    };
  }

  // Determine Category (Standard vs. Custom)
  let finalCategory = categorySelect;
  let isCustomCategory = false;

  const isOther =
    !categorySelect ||
    categorySelect.toUpperCase() === "OTHER" ||
    categorySelect.toUpperCase() === "CUSTOM" ||
    categorySelect.toLowerCase().includes("custom");

  if (isOther) {
    if (!customCategory) {
      return {
        ok: false,
        error: "Please enter the custom category name.",
      };
    }
    finalCategory = customCategory;
    isCustomCategory = true;
  } else {
    // If not "OTHER", verify it's one of the standard categories or custom text
    const isStandard = (STANDARD_INVITATION_CATEGORIES as readonly string[]).includes(categorySelect);
    if (!isStandard) {
      isCustomCategory = true;
    }
  }

  if (!finalCategory) {
    return {
      ok: false,
      error: "Please select or enter an invitation category.",
    };
  }

  try {
    const invitation = createInvitationPayload({
      firstName,
      surname,
      designation,
      category: finalCategory,
      isCustomCategory,
      createdById: session?.user?.id,
      createdByName: session?.user?.email || "Secretariat Officer",
    });

    const saved = await saveInvitation(invitation);

    try {
      await writeAudit({
        action: "invitation.issue",
        entityType: "invitation",
        entityId: saved.invitationCode,
        metadata: {
          invitationCode: saved.invitationCode,
          designation: saved.designation,
          category: saved.category,
          isCustomCategory: saved.isCustomCategory,
          hasFirstName: Boolean(saved.firstName),
          hasSurname: Boolean(saved.surname),
          issuedBy: session?.user?.email,
        },
      });
    } catch {
      // Safe fallback if audit RPC is unreachable
    }

    revalidatePath("/abawole/invitations");

    const whatsAppText = generateWhatsAppInvitationText(saved);

    return {
      ok: true,
      invitation: saved,
      whatsAppText,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to issue invitation. Please retry.";
    return {
      ok: false,
      error: message,
    };
  }
}

/**
 * Server action to retrieve all issued complimentary invitations.
 */
export async function getInvitationsAction(): Promise<{
  ok: boolean;
  invitations: ComplimentaryInvitation[];
  error?: string;
}> {
  try {
    await requirePermission("credential.issue");
    const invitations = await listInvitations();
    return { ok: true, invitations };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized to view invitations.";
    return {
      ok: false,
      invitations: [],
      error: message,
    };
  }
}

/**
 * Server action to clear device binding on an invitation.
 */
export async function resetInvitationDeviceBindingAction(
  invitationCode: string
): Promise<{ ok: boolean; message: string }> {
  try {
    await requirePermission("credential.issue");
    const result = await resetInvitationDeviceBinding(invitationCode);
    revalidatePath("/abawole/invitations");
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized: credential.issue required to reset device binding.";
    return {
      ok: false,
      message,
    };
  }
}

/**
 * Server action to edit an existing invitation's name, designation, or category,
 * re-signing the cryptographic Aare Elesin seal while preserving its pass code
 * and device binding.
 */
export async function updateInvitationAction(formData: FormData): Promise<{
  ok: boolean;
  invitation?: ComplimentaryInvitation;
  message?: string;
  error?: string;
}> {
  let session;
  try {
    session = await requirePermission("credential.issue");
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unauthorized.",
    };
  }

  const invitationCode = (formData.get("invitationCode") as string)?.trim().toUpperCase();
  const firstName = (formData.get("firstName") as string)?.trim() || null;
  const surname = (formData.get("surname") as string)?.trim() || null;
  const designation = (formData.get("designation") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();

  if (!invitationCode || !designation || !category) {
    return { ok: false, error: "Invitation code, designation, and category are required." };
  }

  const existing = await getInvitationByCode(invitationCode);
  if (!existing) {
    return { ok: false, error: "Invitation not found." };
  }

  const holderName =
    [firstName, surname].filter(Boolean).join(" ") || designation || "Distinguished Guest";
  const isCustomCategory = !(STANDARD_INVITATION_CATEGORIES as readonly string[]).includes(
    category.toUpperCase()
  );

  const qrToken = generateSignedInvitationToken({
    credentialId: existing.invitationCode,
    holderName,
    passType: "complimentary",
    category,
    designation,
    securitySeal: ROYAL_SECURITY_SEAL,
    editionYear: 2026,
    issuedAt: new Date(existing.createdAt).getTime(),
  });
  const qrPayload = buildInvitationVerificationUrl(existing.invitationCode, qrToken);

  const updated = await saveInvitation({
    ...existing,
    firstName,
    surname,
    designation,
    category,
    isCustomCategory,
    qrToken,
    qrPayload,
  });

  try {
    await writeAudit({
      action: "invitation.update",
      entityType: "invitation",
      entityId: updated.invitationCode,
      metadata: {
        invitationCode: updated.invitationCode,
        firstName: updated.firstName,
        surname: updated.surname,
        designation: updated.designation,
        category: updated.category,
        updatedBy: session?.user?.email,
      },
    });
  } catch {
    // Non-fatal
  }

  revalidatePath("/abawole/invitations");
  revalidatePath(`/invitation/${updated.invitationCode}`);
  return {
    ok: true,
    invitation: updated,
    message: `Invitation ${updated.invitationCode} updated to ${holderName}.`,
  };
}

/**
 * Server action to get WhatsApp invitation text for an existing invitation.
 */
export async function getWhatsAppInvitationTextAction(
  invitationCode: string
): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    await requirePermission("credential.issue");
    const invitation = await getInvitationByCode(invitationCode);
    if (!invitation) {
      return { ok: false, error: "Invitation not found." };
    }
    const text = generateWhatsAppInvitationText(invitation);
    return { ok: true, text };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate text.";
    return { ok: false, error: message };
  }
}
