"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { generateSignedPassToken, hashPassToken } from "@/lib/qr/token";
import { sendEmail } from "@/lib/email/client";
import { writeAudit } from "@/lib/supabase/audit";
import {
  DAY3_VVIP_PRICE_NGN,
  DAY3_VVIP_OFFICIAL_PRICE_NGN,
} from "@/lib/config/checkout-config";
import { markPassVerified } from "@/lib/storage/unverified-passes";
import { getSiteOrigin } from "@/lib/site";
import {
  buildVvipPassReleaseWhatsAppMessage,
  formatWhatsAppUrl,
} from "@/lib/utils/phone";

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
        status: "active",
      });
    }

    await writeAudit({
      action: "registration.create",
      entityType: "registration",
      entityId: reg.id,
      metadata: { pass_code: passCode, category: resolvedCategory, affiliationType },
    }).catch(() => undefined);

    revalidatePath("/abawole/registrations");
    revalidatePath("/abawole/members");
    revalidatePath("/abawole");
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
  if (parsed.data.category || parsed.data.affiliationType) {
    updateData.category = parsed.data.category || formatParticipantCategory(
      parsed.data.affiliationType || "individual",
      parsed.data.hostName,
      parsed.data.organization
    );
  }
  if (parsed.data.groupSize !== undefined) updateData.group_size = parsed.data.groupSize;

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
        .select("first_name, last_name, category")
        .eq("id", registrationId)
        .single();

      if (reg) {
        await supabase
          .from("credentials")
          .update({
            holder_name: `${reg.first_name} ${reg.last_name}`.trim(),
            pass_type: reg.category,
            zone_access: zoneAccessFor(),
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

    revalidatePath("/abawole/registrations");
    revalidatePath("/abawole/members");
    revalidatePath("/abawole");
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

    revalidatePath("/abawole/registrations");
    revalidatePath("/abawole/members");
    revalidatePath("/abawole");
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
    .select("*")
    .eq("id", registrationId)
    .maybeSingle();

  if (fetchError || !reg) return { ok: false, error: "Registration not found." };
  
  const pendingStatuses = ["pending_approval", "pending_bank_verification", "pending_verification"];
  if (!pendingStatuses.includes(reg.status)) {
    return { ok: false, error: "This registration is not awaiting approval or bank verification." };
  }

  const holderName = `${reg.first_name} ${reg.last_name}`.trim();
  const bankTransferRef = (reg as { bank_transfer_ref?: string | null; day3_ticket_ref?: string | null }).bank_transfer_ref ||
    (reg as { day3_ticket_ref?: string | null }).day3_ticket_ref ||
    null;
  let passCode = "";
  const issuedAt = new Date().toISOString();

  // Check if credentials already exist (e.g. Day 3 bank transfer provisional slip)
  const { data: existingCreds } = await supabase
    .from("credentials")
    .select("id, pass_code")
    .eq("registration_id", reg.id);

  if (existingCreds && existingCreds.length > 0) {
    await supabase
      .from("credentials")
      .update({
        status: "active",
        zone_access: ["VVIP Royal Pavilion", "Grandstand", "Festival Grounds"],
      })
      .eq("registration_id", reg.id);
    passCode = existingCreds[0].pass_code;
  } else {
    const credentialId = crypto.randomUUID();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    passCode = `ABK-2026-${randomSuffix}`;

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
      status: "active",
    });

    if (credError) return { ok: false, error: "Could not issue the credential." };
  }

  if (passCode) {
    markPassVerified(passCode);
  }
  if (existingCreds) {
    existingCreds.forEach((c) => markPassVerified(c.pass_code));
  }
  if (bankTransferRef) {
    markPassVerified(bankTransferRef);
    await supabase
      .from("table_bookings")
      .update({ status: "confirmed" })
      .or(`bank_transfer_ref.eq.${bankTransferRef},payment_ref.eq.${bankTransferRef}`);
    await supabase
      .from("offline_commitments")
      .update({ status: "bank_wire_confirmed" })
      .eq("reference_code", bankTransferRef);
    await supabase
      .from("affiliate_referrals")
      .update({ status: "confirmed" })
      .eq("order_ref", bankTransferRef);
  }

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

  revalidatePath("/abawole/registrations");
  revalidatePath("/abawole/members");
  revalidatePath("/abawole");
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

  revalidatePath("/abawole/registrations");
  revalidatePath("/abawole/members");
  revalidatePath("/abawole");
  return { ok: true };
}

/**
 * 1-Click Approve & Release VVIP Pass for Direct Bank Wire Transfers (Wema Bank).
 * Can be called with either registrationId (UUID) or paymentReference (e.g. ABK-WEMA-XXXX).
 * Marks credentials active, updates offline finance ledger, logs audit,
 * sends confirmation email, and triggers direct WhatsApp delivery to buyer.
 */
export async function approveBankTransferAction(identifier: string): Promise<{
  ok: boolean;
  error?: string;
  passCodes?: string[];
  holderName?: string;
  phone?: string;
  amountNgn?: number;
  transferRef?: string;
  whatsappUrl?: string;
}> {
  try {
    await requirePermission("registration.manage");
  } catch (error) {
    try {
      await requirePermission("finance.read");
    } catch {
      if (error instanceof PermissionError) return { ok: false, error: error.message };
      throw error;
    }
  }

  const cleanId = (identifier || "").trim();

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

      let query = supabase
        .from("registrations")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          category,
          group_size,
          status,
          day3_ticket_ref,
          bank_transfer_ref,
          credentials (id, pass_code, status, pass_type, holder_name)
        `);

      if (isUuid) {
        query = query.eq("id", cleanId);
      } else {
        query = query.or(`bank_transfer_ref.eq.${cleanId},day3_ticket_ref.eq.${cleanId}`);
      }

      const { data: reg, error: fetchError } = await query.maybeSingle();

      if (fetchError || !reg) {
        // Check table_bookings and offline_commitments if not found directly in registrations
        const { data: tableBookingOnly } = await supabase
          .from("table_bookings")
          .select("id, buyer_name, amount_ngn, bank_transfer_ref, payment_ref")
          .or(`bank_transfer_ref.eq.${cleanId},payment_ref.eq.${cleanId}`)
          .maybeSingle();

        const { data: commitment } = await supabase
          .from("offline_commitments")
          .select("id, sponsor_name, reference_code, proposed_amount")
          .eq("reference_code", cleanId)
          .maybeSingle();

        if (tableBookingOnly || commitment) {
          if (tableBookingOnly) {
            await supabase
              .from("table_bookings")
              .update({ status: "confirmed" })
              .eq("id", tableBookingOnly.id);
          }

          if (commitment) {
            await supabase
              .from("offline_commitments")
              .update({
                status: "bank_wire_confirmed",
                confirmed_amount: commitment.proposed_amount,
              })
              .eq("id", commitment.id);
          }

          await supabase
            .from("affiliate_referrals")
            .update({ status: "confirmed" })
            .eq("order_ref", cleanId);

          markPassVerified(cleanId);

          const verifiedAmount =
            tableBookingOnly?.amount_ngn ||
            commitment?.proposed_amount ||
            DAY3_VVIP_OFFICIAL_PRICE_NGN;

          revalidatePath("/abawole/finance");
          revalidatePath("/abawole/registrations");
          revalidatePath("/abawole");
          revalidatePath("/tables");
          revalidatePath("/register");

          return {
            ok: true,
            holderName: tableBookingOnly?.buyer_name || commitment?.sponsor_name || "VVIP Patron",
            amountNgn: verifiedAmount,
            transferRef: cleanId,
            passCodes: [`ABK-2026-VVIP-${cleanId.replace("ABK-WEMA-", "")}`],
          };
        }

        return { ok: false, error: "Registration record or payment reference not found." };
      }

      const holderName = `${reg.first_name} ${reg.last_name}`.trim();
      const transferRef = reg.bank_transfer_ref || reg.day3_ticket_ref || cleanId || "WEMA-TRANSFER";
      const quantity = Math.max(1, reg.group_size || 1);

      // Check if there is an associated table booking or offline commitment with the exact amount
      const { data: linkedTableBooking } = await supabase
        .from("table_bookings")
        .select("id, amount_ngn")
        .or(`bank_transfer_ref.eq.${transferRef},payment_ref.eq.${transferRef}`)
        .maybeSingle();

      // Official brochure pricing is permanent: no testing-fee branch exists.
      const amountNgn =
        linkedTableBooking?.amount_ngn || quantity * DAY3_VVIP_OFFICIAL_PRICE_NGN;
      const siteOrigin = getSiteOrigin();

      if (linkedTableBooking) {
        await supabase
          .from("table_bookings")
          .update({ status: "confirmed" })
          .eq("id", linkedTableBooking.id);
      }

      await supabase
        .from("affiliate_referrals")
        .update({ status: "confirmed" })
        .eq("order_ref", transferRef);

      // 1. Mark registration confirmed
      await supabase
        .from("registrations")
        .update({ status: "confirmed" })
        .eq("id", reg.id);

      // 2. Activate or generate credentials
      let passCodes: string[] = [];
      const creds = (reg.credentials || []) as Array<{
        id: string;
        pass_code: string;
        status: string;
        pass_type?: string;
        holder_name?: string;
      }>;

      if (creds.length > 0) {
        await supabase
          .from("credentials")
          .update({ status: "active" })
          .eq("registration_id", reg.id);
        passCodes = creds.map((c) => c.pass_code);
      } else {
        const issuedAt = new Date().toISOString();
        for (let i = 1; i <= quantity; i++) {
          const credId = crypto.randomUUID();
          const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          const pCode = quantity > 1 ? `ABK-2026-VVIP${i}${randomSuffix}` : `ABK-2026-VVIP${randomSuffix}`;
          passCodes.push(pCode);

          const passHolder = quantity > 1 && i > 1 ? `${holderName} (Guest ${i})` : holderName;
          const qrToken = generateSignedPassToken({
            credentialId: credId,
            holderName: passHolder,
            passType: "Day 3 VVIP Grand Finale Pass",
            editionYear: 2026,
            issuedAt: Date.parse(issuedAt),
          });

          await supabase.from("credentials").insert({
            id: credId,
            registration_id: reg.id,
            holder_name: passHolder,
            token_hash: hashPassToken(qrToken),
            pass_code: pCode,
            pass_type: "Day 3 VVIP Grand Finale Pass",
            zone_access: ["VVIP Royal Pavilion", "Grandstand", "Festival Grounds"],
            status: "active",
            day3_ticket_ref: transferRef,
            bank_transfer_ref: transferRef,
            issued_at: issuedAt,
          });
        }
      }

      // 3. Update or insert in offline commitments ledger
      const { data: existingCommitment } = await supabase
        .from("offline_commitments")
        .select("id")
        .eq("reference_code", transferRef)
        .maybeSingle();

      if (existingCommitment) {
        await supabase
          .from("offline_commitments")
          .update({
            status: "bank_wire_confirmed",
            confirmed_amount: amountNgn,
          })
          .eq("id", existingCommitment.id);
      } else {
        await supabase.from("offline_commitments").insert({
          sponsor_name: holderName,
          tier: `Day 3 VVIP Ticket (${quantity} Pass${quantity > 1 ? "es" : ""})`,
          proposed_amount: amountNgn,
          confirmed_amount: amountNgn,
          status: "bank_wire_confirmed",
          channel: "Bank Wire Transfer (WEMA BANK 0126769779)",
          reference_code: transferRef,
        });
      }

      // 4. Audit Log
      await writeAudit({
        action: "registration.approve_bank_transfer",
        entityType: "registration",
        entityId: reg.id,
        metadata: {
          transfer_ref: transferRef,
          quantity,
          amount_ngn: amountNgn,
          pass_codes: passCodes,
        },
      }).catch(() => undefined);

      // 5. Confirmation Email
      try {
        await sendEmail({
          to: reg.email,
          subject: `Payment Confirmed: Day 3 VVIP Gate Pass Released (${passCodes[0]})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827; background-color: #FAF9F5; border-radius: 12px; border: 1px solid #DCD5C2;">
              <div style="background-color: #1A1500; padding: 20px; border-radius: 8px; text-align: center; color: #FAF9F5; border: 2px solid #D4AF37;">
                <p style="color: #F5D77F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 6px 0; font-weight: bold;">👑 VVIP Official Gate Credential</p>
                <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #F5D77F;">Abeokuta Polo Festival 2026</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #DCD5C2;">Bank Transfer Verified · Wema Bank Ref: ${transferRef}</p>
              </div>
              <div style="padding: 24px 0;">
                <p style="font-size: 16px; margin: 0 0 12px 0;">Dear <strong>${holderName}</strong>,</p>
                <p style="font-size: 14px; line-height: 1.6; color: #414843;">
                  Your direct bank transfer of <strong>₦${amountNgn.toLocaleString()}</strong> to Abeokuta Polo Club has been verified by the Secretariat. Your Day 3 VVIP Grand Finale access credentials have been officially released:
                </p>
                ${passCodes.map((c) => `
                  <div style="background-color: #1A1500; border: 2px solid #D4AF37; border-radius: 8px; padding: 18px; margin: 16px 0; text-align: center; color: #FCF9F8;">
                    <p style="color: #F5D77F; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0;">VVIP PASS CODE</p>
                    <h2 style="font-size: 26px; color: #F5D77F; margin: 6px 0; letter-spacing: 0.12em; font-family: monospace;">${c}</h2>
                    <p style="font-size: 13px; color: #DCD5C2; margin: 4px 0;">Day 3 VVIP Royal Pavilion Admission</p>
                    <p style="font-size: 11px; margin-top: 8px;"><a href="${siteOrigin}/pass/${c}" style="color: #F5D77F; text-decoration: underline;">Open Pass Online: ${siteOrigin}/pass/${c}</a></p>
                  </div>
                `).join("")}
              </div>
              <div style="border-top: 1px solid #DCD5C2; padding-top: 16px; font-size: 11px; color: #727973; text-align: center;">
                <p style="margin: 0;">Abeokuta Polo Club · Kobape Expressway, Abeokuta, Ogun State</p>
              </div>
            </div>
          `,
        });
      } catch {
        // Non-blocking
      }

      revalidatePath("/abawole/registrations");
      revalidatePath("/abawole/finance");
      revalidatePath("/abawole");

      // Mark passes verified in runtime memory
      passCodes.forEach(markPassVerified);

      const primaryPassCode = passCodes[0] || "ABK-2026-VVIP";
      const passUrl = `${siteOrigin}/pass/${primaryPassCode}`;
      const waMsg = buildVvipPassReleaseWhatsAppMessage({
        holderName,
        passCodes,
        quantity,
        totalAmount: amountNgn,
        transferRef,
        passUrl,
      });
      const whatsappUrl = formatWhatsAppUrl(reg.phone, waMsg);

      return {
        ok: true,
        passCodes,
        holderName,
        phone: reg.phone,
        amountNgn,
        transferRef,
        whatsappUrl,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve bank transfer.";
      return { ok: false, error: message };
    }
  }

  // Graceful offline fallback (for testing or dev without Supabase)
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const mockCode = `ABK-2026-VVIP${randomSuffix}`;
  const siteOrigin = getSiteOrigin();
  const passUrl = `${siteOrigin}/pass/${mockCode}`;
  const waMsg = buildVvipPassReleaseWhatsAppMessage({
    holderName: "VVIP Attendee",
    passCodes: [mockCode],
    quantity: 1,
    totalAmount: DAY3_VVIP_PRICE_NGN,
    transferRef: cleanId || "ABK-WEMA-SAMPLE",
    passUrl,
  });
  const whatsappUrl = formatWhatsAppUrl("+2348031234567", waMsg);

  return {
    ok: true,
    passCodes: [mockCode],
    holderName: "VVIP Attendee",
    phone: "+2348031234567",
    amountNgn: DAY3_VVIP_PRICE_NGN,
    transferRef: cleanId || "ABK-WEMA-SAMPLE",
    whatsappUrl,
  };
}
