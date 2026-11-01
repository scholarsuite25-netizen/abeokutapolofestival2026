"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { generateSignedPassToken, hashPassToken } from "@/lib/qr/token";
import { sendEmail } from "@/lib/email/client";
import { writeAudit } from "@/lib/supabase/audit";

export type ActionResult = { ok: boolean; error?: string };

function zoneAccessFor(): string[] {
  return ["Festival Grounds & Grandstand"];
}

function formatParticipantCategory(
  affiliationType: "individual" | "guest_of" | "corporate",
  hostName?: string | null,
  organization?: string | null,
): string {
  if (affiliationType === "guest_of") {
    return hostName ? `Guest of ${hostName}` : "Guest of Member";
  }
  if (affiliationType === "corporate") {
    return organization ? `Corporate Guest (${organization})` : "Corporate Guest";
  }
  return "Individual Attendee";
}

const participantSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  phone: z.string().trim().min(7, "Please provide a valid phone number."),
  category: z.string().optional(),
  groupSize: z.coerce.number().int().min(1).max(10).default(1),
  affiliationType: z.enum(["individual", "guest_of", "corporate"]).default("individual"),
  hostName: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  autoApprove: z.boolean().default(true),
});

/**
 * Creates a participant from the admin console with auto-credential option.
 */
export async function createParticipantAction(rawInput: unknown): Promise<ActionResult & { passCode?: string }> {
  try {
    await requirePermission("registration.manage");
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, error: error.message };
    throw error;
  }

  if (!isSupabaseConfigured()) return { ok: false, error: "Database not connected." };

  const parsed = participantSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(". ") };
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    category,
    groupSize,
    affiliationType,
    hostName,
    organization,
    autoApprove,
  } = parsed.data;

  const supabase = createAdminClient();
  const holderName = `${firstName} ${lastName}`.trim();
  const initialStatus = autoApprove ? "confirmed" : "pending_approval";
  const resolvedCategory = category || formatParticipantCategory(affiliationType, hostName, organization);

  try {
    const { data: edition } = await supabase
      .from("festival_editions")
      .select("id")
      .eq("slug", "2026")
      .maybeSingle();

    const { data: reg, error: regError } = await supabase
      .from("registrations")
      .insert({
        edition_id: edition?.id ?? null,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        category: resolvedCategory,
        group_size: groupSize,
        affiliation_type: affiliationType,
        host_name: hostName || null,
        organization: organization || null,
        status: initialStatus,
      })
      .select("id")
      .single();

    if (regError || !reg) {
      return { ok: false, error: "Could not record the participant." };
    }

    let passCode: string | undefined;

    if (autoApprove) {
      const credentialId = crypto.randomUUID();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      passCode = `ABK-2026-${randomSuffix}`;
      const issuedAt = new Date().toISOString();

      const qrToken = generateSignedPassToken({
        credentialId,
        holderName,
        passType: resolvedCategory,
        editionYear: 2026,
        issuedAt: Date.parse(issuedAt),
      });

      await supabase.from("credentials").insert({
        id: credentialId,
        registration_id: reg.id,
        holder_name: holderName,
        token_hash: hashPassToken(qrToken),
        pass_code: passCode,
        pass_type: resolvedCategory,
        zone_access: zoneAccessFor(),
        affiliation_type: affiliationType,
        host_name: hostName || null,
        organization: organization || null,
        status: "active",
        issued_at: issuedAt,
      });
    }

    await writeAudit({
      action: "registration.create",
      entityType: "registration",
      entityId: reg.id,
      metadata: { pass_code: passCode, category: resolvedCategory, affiliationType },
    }).catch(() => undefined);

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/members");
    return { ok: true, passCode };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create participant.";
    return { ok: false, error: message };
  }
}

/**
 * Updates an existing participant registration and linked credential.
 */
export async function updateParticipantAction(
  registrationId: string,
  rawInput: unknown,
): Promise<ActionResult> {
  try {
    await requirePermission("registration.manage");
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, error: error.message };
    throw error;
  }

  if (!isSupabaseConfigured()) return { ok: false, error: "Database not connected." };

  const parsed = participantSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(". ") };
  }

  const supabase = createAdminClient();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.firstName) updateData.first_name = parsed.data.firstName;
  if (parsed.data.lastName) updateData.last_name = parsed.data.lastName;
  if (parsed.data.email) updateData.email = parsed.data.email;
  if (parsed.data.phone) updateData.phone = parsed.data.phone;
  if (parsed.data.category) updateData.category = parsed.data.category;
  if (parsed.data.groupSize !== undefined) updateData.group_size = parsed.data.groupSize;
  if (parsed.data.affiliationType) updateData.affiliation_type = parsed.data.affiliationType;
  if (parsed.data.hostName !== undefined) updateData.host_name = parsed.data.hostName || null;
  if (parsed.data.organization !== undefined) updateData.organization = parsed.data.organization || null;

  try {
    const { error: regError } = await supabase
      .from("registrations")
      .update(updateData)
      .eq("id", registrationId);

    if (regError) return { ok: false, error: "Could not update registration record." };

    // Update credential holder name or tier if applicable
    if (parsed.data.firstName || parsed.data.lastName || parsed.data.category || parsed.data.affiliationType) {
      const { data: reg } = await supabase
        .from("registrations")
        .select("first_name, last_name, category, affiliation_type, host_name, organization")
        .eq("id", registrationId)
        .single();

      if (reg) {
        await supabase
          .from("credentials")
          .update({
            holder_name: `${reg.first_name} ${reg.last_name}`.trim(),
            pass_type: reg.category,
            zone_access: zoneAccessFor(),
            affiliation_type: reg.affiliation_type,
            host_name: reg.host_name,
            organization: reg.organization,
          })
          .eq("registration_id", registrationId);
      }
    }

    await writeAudit({
      action: "registration.update",
      entityType: "registration",
      entityId: registrationId,
      metadata: updateData,
    }).catch(() => undefined);

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/members");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update participant.";
    return { ok: false, error: message };
  }
}

/**
 * Permanently deletes a participant and cascades to their credentials.
 */
export async function deleteParticipantAction(registrationId: string): Promise<ActionResult> {
  try {
    await requirePermission("registration.manage");
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, error: error.message };
    throw error;
  }

  if (!isSupabaseConfigured()) return { ok: false, error: "Database not connected." };

  const supabase = createAdminClient();

  try {
    // Delete check-in events first if any exist
    const { data: creds } = await supabase
      .from("credentials")
      .select("id")
      .eq("registration_id", registrationId);

    if (creds && creds.length > 0) {
      const credIds = creds.map((c) => c.id);
      await supabase.from("check_in_events").delete().in("credential_id", credIds);
      await supabase.from("credentials").delete().eq("registration_id", registrationId);
    }

    const { error } = await supabase.from("registrations").delete().eq("id", registrationId);
    if (error) return { ok: false, error: "Could not delete participant record." };

    await writeAudit({
      action: "registration.delete",
      entityType: "registration",
      entityId: registrationId,
    }).catch(() => undefined);

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/members");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete participant.";
    return { ok: false, error: message };
  }
}

/**
 * Accreditation officer approves a pending registration and issues the
 * accredited QR credential.
 */
export async function approveRegistrationAction(registrationId: string): Promise<ActionResult> {
  try {
    await requirePermission("registration.manage");
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, error: error.message };
    throw error;
  }

  if (!isSupabaseConfigured()) return { ok: false, error: "Database not connected." };

  const supabase = createAdminClient();

  const { data: reg, error: fetchError } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, email, phone, category, status, affiliation_type, host_name, organization")
    .eq("id", registrationId)
    .maybeSingle();

  if (fetchError || !reg) return { ok: false, error: "Registration not found." };
  if (reg.status !== "pending_approval") {
    return { ok: false, error: "This registration is not awaiting approval." };
  }

  const holderName = `${reg.first_name} ${reg.last_name}`.trim();
  const credentialId = crypto.randomUUID();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const passCode = `ABK-2026-${randomSuffix}`;
  const issuedAt = new Date().toISOString();

  const qrToken = generateSignedPassToken({
    credentialId,
    holderName,
    passType: reg.category,
    editionYear: 2026,
    issuedAt: Date.parse(issuedAt),
  });

  const { error: credError } = await supabase.from("credentials").insert({
    id: credentialId,
    registration_id: reg.id,
    holder_name: holderName,
    token_hash: hashPassToken(qrToken),
    pass_code: passCode,
    pass_type: reg.category,
    zone_access: zoneAccessFor(),
    affiliation_type: reg.affiliation_type || "individual",
    host_name: reg.host_name,
    organization: reg.organization,
    status: "active",
    issued_at: issuedAt,
  });

  if (credError) return { ok: false, error: "Could not issue the credential." };

  const { error: regError } = await supabase
    .from("registrations")
    .update({ status: "confirmed" })
    .eq("id", reg.id);

  if (regError) return { ok: false, error: "Could not update the registration." };

  await writeAudit({
    action: "registration.approve",
    entityType: "registration",
    entityId: reg.id,
    metadata: { pass_code: passCode, pass_type: reg.category },
  }).catch(() => undefined);

  try {
    await sendEmail({
      to: reg.email,
      subject: `Your Accredited Pass: 2026 Abeokuta Polo Festival (${passCode})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827; background-color: #FAF9F5; border-radius: 12px; border: 1px solid #DCD5C2;">
          <div style="background-color: #062D1D; padding: 20px; border-radius: 8px; text-align: center; color: #FAF9F5;">
            <p style="color: #DFBE75; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 6px 0;">Official Digital Credential</p>
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">2026 Abeokuta Polo Festival</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #DCD5C2;">18–20 December 2026 · Abeokuta Polo Club Grounds</p>
          </div>
          <div style="padding: 24px 0;">
            <p style="font-size: 16px; margin: 0 0 12px 0;">Dear <strong>${holderName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #414843;">
              Your complimentary registration for the 2026 Abeokuta Polo Festival has been
              approved. Below are your official gate pass details:
            </p>
            <div style="background-color: #FFFFFF; border: 2px dashed #062D1D; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
              <p style="color: #795910; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0;">Pass Code / Ref</p>
              <h2 style="font-size: 26px; color: #062D1D; margin: 6px 0; letter-spacing: 0.1em; font-family: monospace;">${passCode}</h2>
              <p style="color: #414843; font-size: 13px; margin: 0;">Pass Category: <strong>${reg.category}</strong></p>
            </div>
            <div style="background-color: #F4F4F0; border-radius: 6px; padding: 14px; font-size: 13px; color: #414843;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #062D1D;">Daily Attendance Protocol:</p>
              <ul style="margin: 0; padding-left: 18px; line-height: 1.5;">
                <li>Present this pass code or your digital QR pass at the entrance on each tournament day.</li>
                <li>Gates open daily from 10:00 AM (18–20 December 2026).</li>
              </ul>
            </div>
          </div>
          <div style="border-top: 1px solid #DCD5C2; padding-top: 16px; font-size: 11px; color: #727973; text-align: center;">
            <p style="margin: 0;">Abeokuta Polo Club · Kobape, Ogun State</p>
          </div>
        </div>
      `,
    });
  } catch {
    // Non-blocking
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/admin/members");
  return { ok: true };
}

/** Declines a pending registration without issuing a credential. */
export async function denyRegistrationAction(registrationId: string): Promise<ActionResult> {
  try {
    await requirePermission("registration.manage");
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, error: error.message };
    throw error;
  }

  if (!isSupabaseConfigured()) return { ok: false, error: "Database not connected." };

  const supabase = createAdminClient();

  const { data: reg, error: fetchError } = await supabase
    .from("registrations")
    .select("id, status")
    .eq("id", registrationId)
    .maybeSingle();

  if (fetchError || !reg) return { ok: false, error: "Registration not found." };

  const { error: regError } = await supabase
    .from("registrations")
    .update({ status: "declined" })
    .eq("id", registrationId);

  if (regError) return { ok: false, error: "Could not update the registration." };

  // Revoke credentials if any exist
  await supabase
    .from("credentials")
    .update({ status: "revoked", revoked_reason: "Declined by Accreditation Secretariat" })
    .eq("registration_id", registrationId);

  await writeAudit({
    action: "registration.deny",
    entityType: "registration",
    entityId: registrationId,
  }).catch(() => undefined);

  revalidatePath("/admin/registrations");
  revalidatePath("/admin/members");
  return { ok: true };
}
