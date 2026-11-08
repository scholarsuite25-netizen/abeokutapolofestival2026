"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { isSupabaseConfigured } from "@/lib/env";
import { generateSignedPassToken, hashPassToken } from "@/lib/qr/token";
import { writeAudit } from "@/lib/supabase/audit";
import {
  DAY3_INVITATION_MAX_TICKETS,
  DAY3_VVIP_PRICE_NGN,
  CLUB_BANK_DETAILS,
  generateWemaTransferReference,
} from "@/lib/config/checkout-config";
import { isValidSpecialInvitation } from "@/lib/invitations/validate";
import { attachClaimToRegistration, claimPaymentReference } from "@/lib/paystack/claims";
import { verifyDay3Payment } from "@/lib/paystack/verify";
import type { StoredPass } from "@/lib/storage/pass-storage";
import { validateWhatsAppPhone } from "@/lib/utils/phone";
import { notifySecretariatOfBankPayment } from "@/lib/notifications/secretariat";
import { registerUnverifiedPasses } from "@/lib/storage/unverified-passes";

const registrationSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Please provide a valid WhatsApp phone number.")
    .refine(
      (val) => validateWhatsAppPhone(val).isValid,
      "Please enter a valid WhatsApp phone number (e.g. 0803 123 4567 or +234 803 123 4567).",
    ),
  day1: z.boolean().default(false),
  day2: z.boolean().default(false),
  day3: z.boolean().default(false),
  day3TicketCount: z.coerce.number().int().min(1).max(20).default(1),
  day3InvitationCode: z.string().trim().optional(),
  day3PaymentRef: z.string().trim().optional(),
  paymentMethod: z.enum(["paystack", "bank_transfer", "invitation", "free"]).optional(),
  bankTransferRef: z.string().trim().optional(),
  affiliationType: z.enum(["individual", "guest_of", "corporate"]).default("individual"),
  hostName: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  groupSize: z.coerce.number().optional().default(1),
  // Backward compatibility fields
  hasDay2Ticket: z.boolean().optional(),
  hasDay3Ticket: z.boolean().optional(),
  day2TicketRef: z.string().optional(),
  day3TicketRef: z.string().optional(),
  sendEmailReminders: z.boolean().default(true),
  sendWhatsappReminders: z.boolean().default(true),
  reminderCadence: z.enum(["weekly_and_daily", "weekly_only", "event_week_only"]).default("weekly_and_daily"),
  attendees: z
    .array(
      z.object({
        firstName: z.string().trim().max(80),
        lastName: z.string().trim().max(80),
      }),
    )
    .optional(),
});

export interface RegisterResult {
  success: boolean;
  status?: "confirmed" | "pending_approval" | "pending_verification" | "pending_bank_verification";
  bankTransferRef?: string;
  paymentMethod?: "paystack" | "bank_transfer" | "invitation" | "free";
  secretariatNotification?: {
    message: string;
    verificationLink: string;
    whatsappUrl: string;
  };
  message?: string;
  error?: string;
  passes?: StoredPass[];
  passCode?: string; // primary pass code for backwards compatibility
  qrToken?: string;
  holderName?: string;
  category?: string;
  affiliationType?: "individual" | "guest_of" | "corporate";
  hostName?: string;
  organization?: string;
  zoneAccess?: string[];
  day1Status?: "free_admitted" | "registered" | "not_selected";
  day2Status?: "free_admitted" | "registered" | "not_selected" | "ticket_required" | "ticket_verified";
  day3Status?: "vvip_admitted" | "payment_verified" | "ticket_required" | "ticket_verified" | "not_selected" | "pending_verification" | "pending_bank_verification";
  ticketRefDay2?: string;
  ticketRefDay3?: string;
}

/** Escapes user-supplied text before it is placed in the confirmation email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAffiliationLabel(
  affiliationType: "individual" | "guest_of" | "corporate",
  hostName?: string,
  organization?: string,
): string {
  if (affiliationType === "guest_of") {
    return hostName ? `Guest of ${hostName}` : "Guest of Member";
  }
  if (affiliationType === "corporate") {
    return organization ? `Corporate Guest (${organization})` : "Corporate Guest";
  }
  return "Individual Attendee";
}

/**
 * Resilient insert helper that handles remote database schema drift gracefully.
 * If PostgREST returns PGRST204 (column does not exist), it automatically prunes
 * the missing column and retries until insertion succeeds or base columns remain.
 */
async function adaptiveInsert<T extends Record<string, unknown>>(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  payload: T,
  selectQuery = "id",
): Promise<{ data: any; error: any }> {
  const currentPayload: Record<string, unknown> = { ...payload };
  const maxAttempts = Object.keys(payload).length + 1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await (supabase.from(table as any) as any)
      .insert(currentPayload)
      .select(selectQuery)
      .maybeSingle();

    if (!res.error) {
      return { data: res.data, error: null };
    }
    const msg = res.error.message || "";
    const match =
      msg.match(/Could not find the '([^']+)' column/) ||
      msg.match(/column "?([^"'\s]+)"? of relation "[^"]+" does not exist/);
    if (match && match[1] && match[1] in currentPayload) {
      delete currentPayload[match[1]];
      continue;
    }
    return { data: null, error: res.error };
  }
  return { data: null, error: new Error("Max insert attempts reached") };
}

/**
 * Three-Day Event Registration:
 * - Day 1: 100% Free Entry
 * - Day 2: 100% Free Entry
 * - Day 3: Paid VVIP (Paystack payment verified server-side and single-use) or a
 *   Special Invitation Code from the server allow-list (VVIP_INVITATION_CODES)
 *
 * Pass issuance rules:
 * - Days 1 & 2 selected together -> 1 single combined pass covering both days.
 * - Day 1 alone -> 1 access card for Day 1.
 * - Day 2 alone -> 1 access card for Day 2.
 * - Day 3 -> Separate distinct deep gold VVIP pass issued upon payment or special invite.
 * - Day 1 + Day 3, or Day 2 + Day 3, or Day 1 + 2 + 3 -> 2 distinct access cards issued.
 */
export async function submitRegistration(rawInput: unknown): Promise<RegisterResult> {
  try {
    const parsed = registrationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(". "),
    };
  }

  const {
    firstName,
    lastName,
    email,
    phone: rawPhone,
    day3InvitationCode,
    day3PaymentRef,
    affiliationType,
    hostName,
    organization,
  } = parsed.data;
  const phoneValidation = validateWhatsAppPhone(rawPhone);
  const phone = phoneValidation.isValid ? phoneValidation.formatted : rawPhone;
  let day3TicketCount = parsed.data.day3TicketCount;

  // Derive days selected, supporting both boolean flags and legacy hasDay2/3
  const day2 = parsed.data.day2 || Boolean(parsed.data.hasDay2Ticket && !parsed.data.day1 && !parsed.data.day2 && !parsed.data.day3);
  const day3 = parsed.data.day3 || Boolean(parsed.data.hasDay3Ticket && !parsed.data.day1 && !parsed.data.day2 && !parsed.data.day3);
  let day1 = parsed.data.day1;

  // If none explicitly ticked, default to Day 1 (Free) for backward compatibility
  if (!day1 && !day2 && !day3) {
    day1 = true;
  }

  // Day 3 VVIP admission: a Special Invitation Code from the server allow-list, a
  // Paystack payment verified server-side and claimed exactly once, OR a Direct Bank
  // Wire Transfer to the official Abeokuta Polo Club Wema Bank account (pending verification).
  let verifiedPaymentRef: string | null = null;
  let usedInvitationCode: string | null = null;
  let isBankTransfer = false;
  let bankTransferRef: string | null = null;

  if (day3) {
    if (isValidSpecialInvitation(day3InvitationCode)) {
      usedInvitationCode = day3InvitationCode!.trim();
      day3TicketCount = Math.min(day3TicketCount, DAY3_INVITATION_MAX_TICKETS);
    } else if (
      parsed.data.paymentMethod === "bank_transfer" ||
      (parsed.data.bankTransferRef && parsed.data.bankTransferRef.toUpperCase().startsWith("ABK-WEMA-"))
    ) {
      isBankTransfer = true;
      bankTransferRef = (parsed.data.bankTransferRef || generateWemaTransferReference()).trim().toUpperCase();
    } else if (day3PaymentRef) {
      const payment = await verifyDay3Payment(day3PaymentRef, { expectedEmail: email });
      if (!payment.ok) {
        return { success: false, error: payment.message };
      }

      const claim = await claimPaymentReference({
        reference: payment.reference,
        email,
        amountNgn: payment.amountNgn,
        quantity: payment.quantity,
      });
      if (!claim.ok) {
        return { success: false, error: claim.message };
      }

      verifiedPaymentRef = payment.reference;
      // The amount Paystack confirmed decides how many passes were bought.
      day3TicketCount = payment.quantity;
    } else {
      return {
        success: false,
        error: "Day 3 requires Paystack VVIP payment or an authorized Special Invitation Code (or Abeokuta Polo Club Bank Transfer).",
      };
    }
  }

  const holderName = `${firstName} ${lastName}`.trim();
  const affiliationLabel = formatAffiliationLabel(affiliationType, hostName, organization);
  const issuedAt = new Date().toISOString();
  const passes: StoredPass[] = [];

  // ── PASS 1: Free Day(s) Pass ──────────────────────────────────────────────
  if (day1 && day2) {
    // 1 single combined pass covering Day 1 & Day 2
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const passCode = `ABK-2026-D12${randomSuffix}`;
    const credentialId = crypto.randomUUID();
    const qrToken = generateSignedPassToken({
      credentialId,
      holderName,
      passType: "Day 1 & Day 2 Dual Pass",
      editionYear: 2026,
      issuedAt: Date.parse(issuedAt),
    });

    passes.push({
      passCode,
      holderName,
      category: "Day 1 & Day 2 Dual Pass",
      affiliationType,
      hostName: hostName || null,
      organization: organization || null,
      email,
      phone,
      qrToken,
      registeredAt: issuedAt,
      daysCovered: [1, 2],
      passTier: "free_day1_2",
      isVvip: false,
      designTheme: "standard",
      day1Status: "free_admitted",
      day2Status: "free_admitted",
      day3Status: "not_selected",
      isBuyer: true,
      isSponsored: false,
      isLockedToDevice: false,
    });
  } else if (day1) {
    // 1 pass for Day 1 alone
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const passCode = `ABK-2026-D1${randomSuffix}`;
    const credentialId = crypto.randomUUID();
    const qrToken = generateSignedPassToken({
      credentialId,
      holderName,
      passType: "Day 1 Access Pass (Free Entry)",
      editionYear: 2026,
      issuedAt: Date.parse(issuedAt),
    });

    passes.push({
      passCode,
      holderName,
      category: "Day 1 Access Pass (Free Entry)",
      affiliationType,
      hostName: hostName || null,
      organization: organization || null,
      email,
      phone,
      qrToken,
      registeredAt: issuedAt,
      daysCovered: [1],
      passTier: "free_day1",
      isVvip: false,
      designTheme: "standard",
      day1Status: "free_admitted",
      day2Status: "not_selected",
      day3Status: "not_selected",
      isBuyer: true,
      isSponsored: false,
      isLockedToDevice: false,
    });
  } else if (day2) {
    // 1 pass for Day 2 alone
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const passCode = `ABK-2026-D2${randomSuffix}`;
    const credentialId = crypto.randomUUID();
    const qrToken = generateSignedPassToken({
      credentialId,
      holderName,
      passType: "Day 2 Access Pass (Free Entry)",
      editionYear: 2026,
      issuedAt: Date.parse(issuedAt),
    });

    passes.push({
      passCode,
      holderName,
      category: "Day 2 Access Pass (Free Entry)",
      affiliationType,
      hostName: hostName || null,
      organization: organization || null,
      email,
      phone,
      qrToken,
      registeredAt: issuedAt,
      daysCovered: [2],
      passTier: "free_day2",
      isVvip: false,
      designTheme: "standard",
      day1Status: "not_selected",
      day2Status: "free_admitted",
      day3Status: "not_selected",
      isBuyer: true,
      isSponsored: false,
      isLockedToDevice: false,
    });
  }

  // ── PASS 2: Day 3 VVIP Pass(es) ──────────────────────────────────────────
  if (day3) {
    const ticketCount = Math.max(1, Math.min(20, day3TicketCount));
    for (let i = 1; i <= ticketCount; i++) {
      // Distinct Day 3 VVIP pass with Deep Gold classic styling
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const passCode = ticketCount > 1
        ? `ABK-2026-VVIP${i}${randomSuffix}`
        : `ABK-2026-VVIP${randomSuffix}`;
      
      const isSponsored = ticketCount > 1 && i > 1;
      const serialLabel = ticketCount > 1 ? `Pass ${i} of ${ticketCount}` : undefined;
      const attendee = parsed.data.attendees?.[i - 1];
      const hasAttendeeName = Boolean(attendee && (attendee.firstName?.trim() || attendee.lastName?.trim()));
      const attendeeFullName = hasAttendeeName
        ? `${attendee!.firstName.trim()} ${attendee!.lastName.trim()}`.trim()
        : (ticketCount > 1 ? `${holderName} (Pass ${i} of ${ticketCount})` : holderName);
      const passHolderName = attendeeFullName || holderName;

      const credentialId = crypto.randomUUID();
      const qrToken = generateSignedPassToken({
        credentialId,
        holderName: passHolderName,
        passType: "Day 3 VVIP Grand Finale Pass",
        editionYear: 2026,
        issuedAt: Date.parse(issuedAt),
      });

      passes.push({
        passCode,
        holderName: passHolderName,
        category: isBankTransfer
          ? "Day 3 VVIP Provisional Claim (Pending Bursary Verification)"
          : "Day 3 VVIP Grand Finale Pass",
        affiliationType: isSponsored ? "guest_of" : affiliationType,
        hostName: isSponsored ? holderName : (hostName || null),
        organization: organization || null,
        email,
        phone,
        qrToken,
        registeredAt: issuedAt,
        daysCovered: [3],
        passTier: isBankTransfer ? "free_day1" : "vvip_day3",
        isVvip: isBankTransfer ? false : true,
        designTheme: isBankTransfer ? "standard" : "gold",
        paymentRef: verifiedPaymentRef || (isBankTransfer ? bankTransferRef : null),
        bankTransferRef: isBankTransfer ? bankTransferRef : null,
        status: isBankTransfer ? "pending_verification" : "active",
        invitationCode: usedInvitationCode,
        day1Status: "not_selected",
        day2Status: "not_selected",
        day3Status: isBankTransfer ? "pending_verification" : "vvip_admitted",
        ticketRefDay3: verifiedPaymentRef || usedInvitationCode || (isBankTransfer ? bankTransferRef : "VVIP-CONFIRMED"),
        securityHash: hashPassToken(qrToken),
        ticketIndex: i,
        totalTickets: ticketCount,
        serialLabel,
        isSponsored,
        sponsorName: isSponsored ? holderName : null,
        isBuyer: i === 1,
        isLockedToDevice: isSponsored,
      });
    }
  }

  const primaryPass = passes[0];

  // Database persistence (if Supabase is connected)
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: edition } = await supabase
        .from("festival_editions")
        .select("id")
        .eq("slug", "2026")
        .maybeSingle();

      const regStatus = isBankTransfer ? "pending_bank_verification" : "confirmed";
      const paymentMethod = isBankTransfer
        ? "bank_transfer"
        : verifiedPaymentRef
        ? "paystack"
        : usedInvitationCode
        ? "invitation"
        : "free";

      const { data: reg } = await adaptiveInsert(
        supabase,
        "registrations",
        {
          edition_id: edition?.id ?? null,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          category: primaryPass.category,
          group_size: day3 ? Math.max(day3TicketCount, parsed.data.groupSize || 1) : (parsed.data.groupSize || 1),
          status: regStatus,
          affiliation_type: affiliationType,
          host_name: hostName || null,
          organization: organization || null,
          bank_transfer_ref: isBankTransfer ? bankTransferRef : null,
          payment_method: paymentMethod,
          has_day3_ticket: day3,
          day3_ticket_ref: bankTransferRef || verifiedPaymentRef || usedInvitationCode || null,
        },
        "id",
      );

      if (reg && reg.id) {
        if (verifiedPaymentRef) {
          await attachClaimToRegistration(verifiedPaymentRef, reg.id);
        }

        // Save each issued pass in credentials table with adaptive schema pruning
        for (const pass of passes) {
          const credId = crypto.randomUUID();
          await adaptiveInsert(
            supabase,
            "credentials",
            {
              id: credId,
              registration_id: reg.id,
              holder_name: pass.holderName,
              token_hash: hashPassToken(pass.qrToken || pass.passCode),
              pass_code: pass.passCode,
              pass_type: pass.category,
              zone_access: pass.isVvip
                ? ["VVIP Royal Pavilion", "Grandstand", "Festival Grounds"]
                : isBankTransfer
                ? ["Accreditation Desk Verification Only"]
                : ["Festival Grounds & Grandstand"],
              affiliation_type: pass.affiliationType,
              host_name: pass.hostName,
              organization: pass.organization,
              status: isBankTransfer ? "pending_verification" : "active",
              bank_transfer_ref: isBankTransfer ? bankTransferRef : null,
              day3_ticket_ref: bankTransferRef || verifiedPaymentRef || null,
              issued_at: issuedAt,
            },
            "id",
          );
        }

        if (isBankTransfer && bankTransferRef) {
          const totalNgn = (day3TicketCount || 1) * DAY3_VVIP_PRICE_NGN;
          try {
            await supabase.from("offline_commitments").insert({
              edition_id: edition?.id ?? null,
              sponsor_name: holderName,
              tier: `Day 3 VVIP Ticket (${day3TicketCount} Pass${day3TicketCount > 1 ? "es" : ""})`,
              proposed_amount: totalNgn,
              confirmed_amount: 0,
              status: "pledged",
              channel: "Bank Wire Transfer (WEMA BANK 0126769779)",
              reference_code: bankTransferRef,
            });
          } catch {
            // Ignore non-blocking offline ledger insert error
          }
        }

        await writeAudit({
          action: "registration.issue_passes",
          entityType: "registration",
          entityId: reg.id,
          metadata: {
            passes_count: passes.length,
            pass_codes: passes.map((p) => p.passCode),
            day1,
            day2,
            day3,
            day3_ticket_count: day3 ? day3TicketCount : 0,
            is_vvip: day3,
            payment_ref: verifiedPaymentRef,
            bank_transfer_ref: bankTransferRef,
            payment_method: paymentMethod,
            invitation_used: Boolean(usedInvitationCode),
            sponsored_passes_count: passes.filter((p) => p.isSponsored).length,
          },
        }).catch(() => undefined);
      }
    } catch {
      // Graceful offline fallback
    }
  }

  // Automated Secretariat Notification & In-Memory Gate Registration for Bank Transfers
  let secretariatNotification: { message: string; verificationLink: string; whatsappUrl: string } | undefined;
  if (isBankTransfer && bankTransferRef) {
    const totalNgn = (day3TicketCount || 1) * DAY3_VVIP_PRICE_NGN;
    registerUnverifiedPasses(passes.map((p) => p.passCode));
    try {
      secretariatNotification = await notifySecretariatOfBankPayment({
        amountNgn: totalNgn,
        buyerName: holderName,
        phone,
        email,
        ref: bankTransferRef,
        ticketCount: day3TicketCount,
        flow: "vvip_pass",
      });
    } catch {
      // Non-blocking
    }
  }

  // Send confirmation email
  try {
    const passesHtml = passes
      .map(
        (p) => `
        <div style="background-color: ${p.isVvip ? "#1A1500" : "#FFFFFF"}; border: 2px solid ${isBankTransfer ? "#F59E0B" : p.isVvip ? "#D4AF37" : "#002F1A"}; border-radius: 12px; padding: 18px; margin: 16px 0; text-align: center; color: ${p.isVvip ? "#FCF9F8" : "#1B1C1C"};">
          <p style="color: ${isBankTransfer ? "#F59E0B" : p.isVvip ? "#F5D77F" : "#C9A84C"}; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0; letter-spacing: 0.1em;">
            ${isBankTransfer ? "⚠️ PENDING VERIFICATION · VVIP TICKET" : p.isVvip ? (p.isSponsored ? `👑 VVIP GUEST PASS (${p.serialLabel || "SPONSORED INVITATION"})` : `👑 VVIP OFFICIAL GATE CREDENTIAL ${p.serialLabel ? `(${p.serialLabel})` : ""}`) : "COMPLIMENTARY ACCESS PASS"}
          </p>
          <h2 style="font-size: 26px; color: ${p.isVvip ? "#F5D77F" : "#002F1A"}; margin: 6px 0; letter-spacing: 0.12em; font-family: monospace; font-weight: 800;">
            ${p.passCode}
          </h2>
          <p style="font-size: 14px; font-weight: bold; margin: 4px 0;">${escapeHtml(p.holderName)}</p>
          <p style="font-size: 12px; color: ${p.isVvip ? "#D4AF37" : "#55635A"}; margin: 2px 0;">
            ${p.daysCovered?.length === 2 ? "Valid for Day 1 (Fri 18) & Day 2 (Sat 19 Dec)" : p.daysCovered?.includes(3) ? "Day 3 Grand Finale (Sun 20 Dec)" : p.daysCovered?.includes(2) ? "Valid for Day 2 (Sat 19 Dec)" : "Valid for Day 1 (Fri 18 Dec)"}
          </p>
          ${isBankTransfer ? `<p style="font-size: 11px; color: #F59E0B; margin-top: 8px; font-weight: bold;">Status: PENDING BURSARY VERIFICATION (Ref: ${bankTransferRef})</p>` : ""}
          ${p.isSponsored ? `<p style="font-size: 11px; color: #E5C768; margin-top: 8px;">Guest Forwarding Link: <a href="https://abeokuta-polo-festival-2026.vercel.app/pass/${p.passCode}" style="color: #F5D77F; text-decoration: underline;">https://abeokuta-polo-festival-2026.vercel.app/pass/${p.passCode}</a></p>` : ""}
        </div>
      `,
      )
      .join("");

    await sendEmail({
      to: email,
      subject: isBankTransfer
        ? `Pending Verification: Day 3 VVIP Bank Transfer Claim (${bankTransferRef})`
        : `Your Gate Access Pass: 2026 Abeokuta Polo Festival (${primaryPass.passCode})`,
      html: `
        <div style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1B1C1C; background-color: #FCF9F8; border-radius: 16px; border: 1px solid #C1C9BF;">
          <div style="background-color: #002F1A; padding: 24px; border-radius: 12px; text-align: center; color: #FCF9F8;">
            <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 6px 0; font-weight: bold;">Official Gate Access Pass & Schedule</p>
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; font-family: 'Cormorant Garamond', Georgia, serif;">Abeokuta Polo Festival 2026</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #D4AF37; font-style: italic;">The Blueprint — Building the Future from Our Heritage</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #C1C9BF;">18–20 December 2026 · Abeokuta Polo Club Grounds, Ogun State</p>
          </div>
          <div style="padding: 24px 0;">
            <p style="font-size: 15px; margin: 0 0 12px 0;">Dear <strong>${escapeHtml(holderName)}</strong>,</p>
            ${isBankTransfer ? `
              <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 18px; color: #92400E; font-size: 13px; line-height: 1.5;">
                <strong>⚠️ Immediate Action Required to Release Your Day 3 VVIP Passes:</strong><br />
                We have registered your bank wire transfer claim for <strong>${day3TicketCount} Day 3 VVIP ticket(s)</strong> with unique reference <strong>${bankTransferRef}</strong>.<br /><br />
                In accordance with festival gate security, passes remain in <strong>PENDING_VERIFICATION</strong> status and will deny turnstile admission until confirmed by the Bursary. Please send your bank payment debit slip to the Secretariat via WhatsApp (<a href="https://wa.me/2348181888884?text=Payment+Receipt+Ref+${bankTransferRef}" style="color: #92400E; font-weight: bold; text-decoration: underline;">+234 818 188 8884</a>) to verify and activate your passes.
              </div>
            ` : `
              <p style="font-size: 14px; line-height: 1.6; color: #55635A;">
                Your digital gate access card(s) for the <strong>2026 Abeokuta Polo Festival</strong> have been successfully issued. Keep this email or download your offline card for contactless gate turnstile entry.
              </p>
            `}

            ${passesHtml}

            <!-- Daily Schedule Breakdown -->
            <div style="background-color: #F4F4F0; border-radius: 12px; padding: 18px; font-size: 12.5px; color: #414843; margin: 20px 0; line-height: 1.55;">
              <p style="margin: 0 0 10px 0; font-weight: 700; color: #062D1D; font-size: 13px;">Tournament Schedule & Admission Rules:</p>
              <ul style="margin: 0; padding-left: 18px;">
                <li style="margin-bottom: 8px;">
                  <strong style="color: #065F46;">Day 1: Friday 18 Dec (100% FREE ENTRY)</strong><br />
                  <span>Media Tour, Festival Light-Up Ceremony & Welcome Dinner.</span>
                </li>
                <li style="margin-bottom: 8px;">
                  <strong style="color: #065F46;">Day 2: Saturday 19 Dec (100% FREE ENTRY)</strong><br />
                  <span>Royal Opening by HRM Oba Dr. Michael Aremu Gbadebo CFR, Foundation Layings, Queens Polo, Literary Debate & Sip/Paint.</span>
                </li>
                <li>
                  <strong style="color: #92400E;">Day 3: Sunday 20 Dec (PAID VVIP / SPECIAL INVITATION)</strong><br />
                  <span>Royal Cup Grand Finale, Aristos Band, 100 Kings Celebration, and Headline concert by BERRYOLA.</span>
                </li>
              </ul>
            </div>
          </div>
          <div style="text-align: center; font-size: 11px; color: #707973; border-top: 1px solid #DCD5C2; padding-top: 16px;">
            Abeokuta Polo Club & Country Resort · Kobape Expressway, Abeokuta, Ogun State, Nigeria
          </div>
        </div>
      `,
    });
  } catch {
    // Non-blocking
  }

    return {
      success: true,
      status: isBankTransfer ? "pending_verification" : "confirmed",
      bankTransferRef: isBankTransfer ? bankTransferRef || undefined : undefined,
      paymentMethod: isBankTransfer ? "bank_transfer" : verifiedPaymentRef ? "paystack" : usedInvitationCode ? "invitation" : "free",
      secretariatNotification,
      passes,
      passCode: primaryPass.passCode,
      qrToken: primaryPass.qrToken,
      holderName,
      category: affiliationLabel,
      affiliationType,
      hostName: hostName || undefined,
      organization: organization || undefined,
      zoneAccess: primaryPass.isVvip
        ? ["VVIP Royal Pavilion", "Grandstand", "Festival Grounds"]
        : ["Festival Grounds & Grandstand"],
      day1Status: day1 ? "free_admitted" : "not_selected",
      day2Status: day2 ? "free_admitted" : "not_selected",
      day3Status: day3 ? (isBankTransfer ? "pending_verification" : "vvip_admitted") : "not_selected",
      message: isBankTransfer
        ? "Bank transfer registered! Please submit your payment receipt to the Secretariat via WhatsApp to activate your Day 3 VVIP access credentials."
        : "Registration confirmed and access card(s) issued successfully!",
    };
  } catch (error) {
    console.error("submitRegistration error:", error);
    return {
      success: false,
      error: (error as Error)?.message || "Failed to process registration. Please verify details and try again.",
    };
  }
}
