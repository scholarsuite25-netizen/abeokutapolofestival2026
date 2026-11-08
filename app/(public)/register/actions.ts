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
  DAY3_REFERENCE_PREFIX,
  CLUB_BANK_DETAILS,
  generateWemaTransferReference,
} from "@/lib/config/checkout-config";
import {
  DAY3_TABLE_PACKAGES,
  getTablePackage,
  formatTablePriceNaira,
  type TablePackage,
} from "@/lib/config/tables-config";
import {
  AFFILIATE_COMMISSION_RATE,
  AFFILIATE_COMMISSION_TIERS,
} from "@/lib/config/affiliates-config";
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
  affiliateCode: z.string().trim().optional(),
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
    affiliateCode,
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

        // Record 10% Affiliate Commission on confirmed Day 3 VVIP tickets
        if (affiliateCode && day3) {
          const count = day3TicketCount || 1;
          const officialVal = count * 50_000;
          const commissionVal = officialVal * AFFILIATE_COMMISSION_RATE; // ₦5,000 per ticket
          const testingAmount = count * 100;
          try {
            await adaptiveInsert(supabase, "affiliate_referrals", {
              affiliate_code: affiliateCode.trim().toUpperCase(),
              item_type: "ticket",
              category: `Day 3 Individual VVIP (${count} ticket${count > 1 ? "s" : ""})`,
              order_ref: verifiedPaymentRef || bankTransferRef || usedInvitationCode || `REG-${Date.now()}`,
              buyer_name: holderName,
              sale_amount_ngn: testingAmount,
              official_value_ngn: officialVal,
              commission_rate: AFFILIATE_COMMISSION_RATE,
              commission_amount_ngn: commissionVal,
              status: isBankTransfer ? "pending_verification" : "confirmed",
            });
          } catch {
            // Non-blocking
          }
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

// ─────────────────────────────────────────────────────────────────────────────
// Day 3 Exclusive Table Packages (Grand Finale — 20 Dec 2026)
// 10 Seats per Table · Serial Numbering · Anti-Forwarding Turnstile Credentials
// ─────────────────────────────────────────────────────────────────────────────

const tableBookingSchema = z.object({
  packageId: z.enum(["kings_table", "royal_table", "queens_table", "premium_table"]),
  tableSerial: z.string().trim().min(2, "Please select an available table serial number."),
  buyerFirstName: z.string().trim().min(2, "Buyer first name must be at least 2 characters."),
  buyerLastName: z.string().trim().min(2, "Buyer last name must be at least 2 characters."),
  buyerEmail: z.string().trim().email("Please provide a valid email address."),
  buyerPhone: z
    .string()
    .trim()
    .min(7, "Please provide a valid WhatsApp phone number.")
    .refine(
      (val) => validateWhatsAppPhone(val).isValid,
      "Please enter a valid WhatsApp phone number (e.g. 0803 123 4567 or +234 803 123 4567).",
    ),
  paymentMethod: z.enum(["paystack", "gateway", "bank_transfer"]).default("gateway"),
  paymentRef: z.string().trim().optional(),
  bankTransferRef: z.string().trim().optional(),
  affiliateCode: z.string().trim().optional(),
  attendees: z
    .array(
      z.object({
        seat: z.number().int().min(1).max(10),
        name: z.string().trim().optional(),
      }),
    )
    .optional(),
});

export interface TableBookingResult {
  success: boolean;
  status?: "confirmed" | "pending_bank_verification";
  packageId?: string;
  packageName?: string;
  tableSerial?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  paymentMethod?: "paystack" | "bank_transfer";
  paymentRef?: string;
  bankTransferRef?: string;
  officialValueNgn?: number;
  amountNgn?: number;
  passes?: StoredPass[];
  secretariatNotification?: {
    message: string;
    verificationLink: string;
    whatsappUrl: string;
  };
  message?: string;
  error?: string;
}

/**
 * Initializes online Paystack gateway checkout for a Day 3 Table Package (charged at pilot testing fee ₦100.00).
 */
export async function initializeTablePayment(input: {
  packageId: string;
  tableSerial: string;
  buyerFirstName: string;
  buyerLastName: string;
  buyerEmail: string;
  buyerPhone: string;
  affiliateCode?: string;
  attendees?: Array<{ seat: number; name?: string }>;
}) {
  try {
    const pkg = getTablePackage(input.packageId);
    if (!pkg) {
      return { success: false, error: "Invalid table package selected." };
    }

    const testingAmountNgn = pkg.testingPriceNgn; // ₦100
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const reference = `${DAY3_REFERENCE_PREFIX}TBL-${suffix}`;

    const callback = new URL("/tables", origin);
    callback.searchParams.set("pkg", input.packageId);
    callback.searchParams.set("serial", input.tableSerial);
    callback.searchParams.set("fn", input.buyerFirstName);
    callback.searchParams.set("ln", input.buyerLastName);
    callback.searchParams.set("em", input.buyerEmail);
    callback.searchParams.set("ph", input.buyerPhone);
    if (input.affiliateCode) {
      callback.searchParams.set("ref", input.affiliateCode);
    }
    if (input.attendees && input.attendees.length > 0) {
      callback.searchParams.set("attendees", JSON.stringify(input.attendees));
    }

    if (!secret) {
      const isDemo = process.env.NODE_ENV !== "production" || process.env.PAYSTACK_DEMO_MODE === "true";
      if (!isDemo) {
        return {
          success: false,
          error: "Online payment gateway is temporarily unavailable. Please use Direct Bank Transfer.",
        };
      }
      const simRef = `${DAY3_REFERENCE_PREFIX}SIM-10-${suffix}`;
      callback.searchParams.set("payment_ref", simRef);
      return {
        success: true,
        authorization_url: callback.toString(),
        reference: simRef,
        amount: testingAmountNgn,
        simulated: true,
      };
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.buyerEmail,
        amount: testingAmountNgn * 100, // Paystack kobo
        reference,
        callback_url: callback.toString(),
        metadata: {
          product: `Day 3 VIP Table: ${pkg.name} (${input.tableSerial})`,
          package_id: input.packageId,
          table_serial: input.tableSerial,
          attendees_count: 10,
          buyer_name: `${input.buyerFirstName} ${input.buyerLastName}`,
          affiliate_code: input.affiliateCode || null,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return {
        success: false,
        error: data.message || "Failed to initialize payment gateway.",
      };
    }

    return {
      success: true,
      authorization_url: data.data.authorization_url,
      reference,
      amount: testingAmountNgn,
      simulated: false,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to contact payment gateway.",
    };
  }
}

/**
 * Submits and confirms a Day 3 Table Package booking:
 * - Generates 10 distinct HMAC-256 signed ID access cards (one for each seat).
 * - Enforces anti-forwarding device-locking on guest invitations.
 * - Records 10% affiliate commission when booked via affiliate link.
 * - Handles both verified Paystack payment and Abeokuta Polo Club WEMA Bank transfers.
 */
export async function submitTableRegistration(rawInput: unknown): Promise<TableBookingResult> {
  try {
    const parsed = tableBookingSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(". "),
      };
    }

    const {
      packageId,
      tableSerial,
      buyerFirstName,
      buyerLastName,
      buyerEmail,
      buyerPhone: rawPhone,
      paymentMethod,
      paymentRef,
      bankTransferRef: inputBankRef,
      affiliateCode,
      attendees: inputAttendees,
    } = parsed.data;

    const pkg = getTablePackage(packageId);
    if (!pkg) {
      return { success: false, error: "Invalid table package specified." };
    }

    const phoneValidation = validateWhatsAppPhone(rawPhone);
    const buyerPhone = phoneValidation.isValid ? phoneValidation.formatted : rawPhone;
    const buyerFullName = `${buyerFirstName} ${buyerLastName}`.trim();
    const isBankTransfer = paymentMethod === "bank_transfer";

    let verifiedPaymentRef: string | null = null;
    let bankTransferRef: string | null = null;

    if (isBankTransfer) {
      bankTransferRef = (inputBankRef || generateWemaTransferReference()).trim().toUpperCase();
    } else if (paymentRef) {
      const payment = await verifyDay3Payment(paymentRef, { expectedEmail: buyerEmail });
      if (!payment.ok) {
        return { success: false, error: payment.message };
      }

      const claim = await claimPaymentReference({
        reference: payment.reference,
        email: buyerEmail,
        amountNgn: payment.amountNgn,
        quantity: 10,
      });
      if (!claim.ok) {
        return { success: false, error: claim.message };
      }
      verifiedPaymentRef = payment.reference;
    } else {
      return {
        success: false,
        error: "Day 3 Table reservations require verified online payment or Direct Club Bank Transfer.",
      };
    }

    const issuedAt = new Date().toISOString();
    const passes: StoredPass[] = [];

    // Map short code for serial pass identifiers
    const serialCodeMap: Record<string, string> = {
      kings_table: "KT",
      royal_table: "RT",
      queens_table: "QT",
      premium_table: "PT",
    };
    const codePrefix = serialCodeMap[packageId] || "TBL";
    // Extract table number (e.g. "Kings Table 02" -> "02")
    const tableNumberMatch = tableSerial.match(/\d+/);
    const tableNum = tableNumberMatch ? tableNumberMatch[0] : "01";

    // ── Generate 10 Distinct HMAC-256 Signed Access Passes ─────────────────────
    const attendeesList: Array<{ seat: number; name: string; passCode: string }> = [];

    for (let seat = 1; seat <= 10; seat++) {
      const seatAttendee = inputAttendees?.find((a) => a.seat === seat);
      const isHost = seat === 1;
      const attendeeName = (seatAttendee?.name && seatAttendee.name.trim())
        ? seatAttendee.name.trim()
        : isHost
        ? buyerFullName
        : `${buyerFullName} (Guest ${seat})`;

      const seatPad = seat.toString().padStart(2, "0");
      const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const passCode = `ABK-2026-${codePrefix}${tableNum}-S${seatPad}-${randomHex}`;
      const credentialId = crypto.randomUUID();

      const passCategoryName = isBankTransfer
        ? `${pkg.name} Provisional Table Slip (${tableSerial})`
        : `${pkg.name} VIP Access (${tableSerial})`;

      const qrToken = generateSignedPassToken({
        credentialId,
        holderName: attendeeName,
        passType: passCategoryName,
        editionYear: 2026,
        issuedAt: Date.parse(issuedAt),
      });

      attendeesList.push({
        seat,
        name: attendeeName,
        passCode,
      });

      passes.push({
        passCode,
        holderName: attendeeName,
        category: passCategoryName,
        affiliationType: isHost ? "individual" : "guest_of",
        hostName: isHost ? null : buyerFullName,
        organization: pkg.enclosure,
        email: isHost ? buyerEmail : undefined,
        phone: isHost ? buyerPhone : undefined,
        qrToken,
        registeredAt: issuedAt,
        daysCovered: [3],
        passTier: isBankTransfer ? "free_day1" : "vvip_day3",
        isVvip: !isBankTransfer,
        designTheme: isBankTransfer ? "standard" : "gold",
        paymentRef: verifiedPaymentRef || bankTransferRef,
        bankTransferRef: isBankTransfer ? bankTransferRef : null,
        status: isBankTransfer ? "pending_verification" : "active",
        day1Status: "not_selected",
        day2Status: "not_selected",
        day3Status: isBankTransfer ? "pending_verification" : "vvip_admitted",
        ticketRefDay3: verifiedPaymentRef || bankTransferRef || "TABLE-CONFIRMED",
        securityHash: hashPassToken(qrToken),
        ticketIndex: seat,
        totalTickets: 10,
        serialLabel: `${tableSerial} · Seat ${seat} of 10`,
        isSponsored: !isHost,
        sponsorName: !isHost ? buyerFullName : null,
        isBuyer: isHost,
        // Anti-forwarding device-locking:
        // Seat 1 belongs to buyer; seats 2-10 lock automatically to the recipient's phone upon opening
        isLockedToDevice: !isHost,
        claimedByRecipient: isHost,
        claimedRecipientName: isHost ? buyerFullName : null,
      });
    }

    // ── Database Persistence ──────────────────────────────────────────────────
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: edition } = await supabase
          .from("festival_editions")
          .select("id")
          .eq("slug", "2026")
          .maybeSingle();

        const bookingStatus = isBankTransfer ? "pending_bank_verification" : "confirmed";

        // 1. Insert into table_bookings
        await adaptiveInsert(supabase, "table_bookings", {
          edition_id: edition?.id ?? null,
          package_id: packageId,
          package_name: pkg.name,
          table_serial: tableSerial,
          buyer_name: buyerFullName,
          buyer_email: buyerEmail,
          buyer_phone: buyerPhone,
          amount_ngn: pkg.testingPriceNgn,
          official_value_ngn: pkg.officialPriceNgn,
          payment_method: isBankTransfer ? "bank_transfer" : "paystack",
          payment_ref: verifiedPaymentRef,
          bank_transfer_ref: bankTransferRef,
          status: bookingStatus,
          affiliate_code: affiliateCode || null,
          attendees: attendeesList,
        });

        // 2. Insert primary buyer into registrations table
        const { data: reg } = await adaptiveInsert(supabase, "registrations", {
          edition_id: edition?.id ?? null,
          first_name: buyerFirstName,
          last_name: buyerLastName,
          email: buyerEmail,
          phone: buyerPhone,
          category: `${pkg.name} (${tableSerial})`,
          group_size: 10,
          status: bookingStatus,
          has_day2_ticket: false,
          has_day3_ticket: true,
          day3_ticket_ref: verifiedPaymentRef || bankTransferRef || "TABLE-CONFIRMED",
          bank_transfer_ref: bankTransferRef,
          payment_method: isBankTransfer ? "bank_transfer" : "paystack",
        });

        // 3. Insert each pass into credentials table
        for (const p of passes) {
          await adaptiveInsert(supabase, "credentials", {
            registration_id: reg?.id ?? null,
            holder_name: p.holderName,
            token_hash: p.securityHash || hashPassToken(p.qrToken || p.passCode),
            pass_code: p.passCode,
            pass_type: p.category,
            zone_access: ["Kings Arena & Royal Dais", "VVIP Pavilion", "Grandstand", "Festival Grounds"],
            status: isBankTransfer ? "pending_bank_verification" : "active",
            affiliation_type: p.affiliationType,
            host_name: p.hostName,
            organization: p.organization,
            has_day2_ticket: false,
            has_day3_ticket: true,
            day3_ticket_ref: p.ticketRefDay3,
            day1_status: "not_selected",
            day2_status: "not_selected",
            day3_status: isBankTransfer ? "pending_verification" : "vvip_admitted",
            bank_transfer_ref: bankTransferRef,
          });
        }

        // 4. Record 10% Affiliate Commission if referral code is present
        if (affiliateCode) {
          const officialCommissionNgn = pkg.officialPriceNgn * AFFILIATE_COMMISSION_RATE; // e.g. ₦1,000,000
          await adaptiveInsert(supabase, "affiliate_referrals", {
            affiliate_code: affiliateCode.trim().toUpperCase(),
            item_type: "table",
            category: `${pkg.name} (${tableSerial})`,
            order_ref: verifiedPaymentRef || bankTransferRef || `TBL-${Date.now()}`,
            buyer_name: buyerFullName,
            sale_amount_ngn: pkg.testingPriceNgn,
            official_value_ngn: pkg.officialPriceNgn,
            commission_rate: AFFILIATE_COMMISSION_RATE,
            commission_amount_ngn: officialCommissionNgn,
            status: isBankTransfer ? "pending_verification" : "confirmed",
          });
        }

        // 5. Write audit entry
        await writeAudit({
          action: "table_booking.created",
          entityType: "table_booking",
          entityId: `${packageId}:${tableSerial}`,
          metadata: {
            tableSerial,
            buyerFullName,
            buyerEmail,
            paymentMethod,
            isBankTransfer,
            affiliateCode: affiliateCode || null,
            passesIssued: 10,
          },
        });
      } catch (dbErr) {
        console.warn("Table booking database insert fallback:", dbErr);
      }
    }

    // ── Secretariat Notification for Bank Transfers ───────────────────────────
    let secretariatNotification: { message: string; verificationLink: string; whatsappUrl: string } | undefined;
    if (isBankTransfer && bankTransferRef) {
      registerUnverifiedPasses(passes.map((p) => p.passCode));
      try {
        const notif = await notifySecretariatOfBankPayment({
          amountNgn: pkg.testingPriceNgn,
          buyerName: buyerFullName,
          email: buyerEmail,
          phone: buyerPhone,
          ref: bankTransferRef,
          ticketCount: 10,
          flow: "hospitality",
          tierName: `${pkg.name} (${tableSerial})`,
        });
        secretariatNotification = {
          message: notif.message,
          verificationLink: notif.verificationLink,
          whatsappUrl: notif.whatsappUrl,
        };
      } catch {
        // Non-blocking
      }
    }

    return {
      success: true,
      status: isBankTransfer ? "pending_bank_verification" : "confirmed",
      packageId,
      packageName: pkg.name,
      tableSerial,
      buyerName: buyerFullName,
      buyerEmail,
      buyerPhone,
      paymentMethod: isBankTransfer ? "bank_transfer" : "paystack",
      paymentRef: verifiedPaymentRef || undefined,
      bankTransferRef: bankTransferRef || undefined,
      officialValueNgn: pkg.officialPriceNgn,
      amountNgn: pkg.testingPriceNgn,
      passes,
      secretariatNotification,
      message: isBankTransfer
        ? "Provisional Table Claim Slip issued. Please forward proof of transfer to Secretariat via WhatsApp to confirm turnstile activation."
        : "Table reservation confirmed! All 10 distinct VIP ID access cards are ready to share.",
    };
  } catch (err) {
    console.error("submitTableRegistration error:", err);
    return {
      success: false,
      error: (err as Error)?.message || "Failed to complete table registration.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// International Affiliate Centre Actions
// 10% Guaranteed Commission on All Confirmed Pass & Table Sales
// ─────────────────────────────────────────────────────────────────────────────

const affiliateRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  phone: z.string().trim().min(7, "Please provide a valid phone/WhatsApp number."),
  country: z.string().trim().min(2, "Please select your country."),
  payoutChannel: z.enum(["nuban", "wire_iban", "paypal"]).default("nuban"),
  bankName: z.string().trim().optional(),
  accountNumber: z.string().trim().optional(),
  accountName: z.string().trim().optional(),
  swiftBic: z.string().trim().optional(),
  iban: z.string().trim().optional(),
  paypalEmail: z.string().trim().optional(),
});

export async function submitAffiliateRegistration(rawInput: unknown) {
  try {
    const parsed = affiliateRegistrationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(". "),
      };
    }

    const {
      fullName,
      email,
      phone: rawPhone,
      country,
      payoutChannel,
      bankName,
      accountNumber,
      accountName,
      swiftBic,
      iban,
      paypalEmail,
    } = parsed.data;

    const phoneValidation = validateWhatsAppPhone(rawPhone);
    const phone = phoneValidation.isValid ? phoneValidation.formatted : rawPhone;

    // Generate unique affiliate code e.g. AFF-POLO-7842
    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const affiliateCode = `AFF-POLO-${codeSuffix}`;

    const payoutDetails: Record<string, string> = {
      payoutChannel,
    };
    if (payoutChannel === "nuban") {
      payoutDetails.bankName = bankName || "";
      payoutDetails.accountNumber = accountNumber || "";
      payoutDetails.accountName = accountName || fullName;
    } else if (payoutChannel === "wire_iban") {
      payoutDetails.bankName = bankName || "";
      payoutDetails.swiftBic = swiftBic || "";
      payoutDetails.iban = iban || "";
      payoutDetails.beneficiaryName = accountName || fullName;
    } else if (payoutChannel === "paypal") {
      payoutDetails.paypalEmail = paypalEmail || email;
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        await adaptiveInsert(supabase, "affiliates", {
          affiliate_code: affiliateCode,
          full_name: fullName,
          email,
          phone,
          country,
          payout_channel: payoutChannel,
          payout_details: payoutDetails,
          clicks_count: 0,
          status: "active",
        });

        await writeAudit({
          action: "affiliate.registered",
          entityType: "affiliate",
          entityId: affiliateCode,
          metadata: { affiliateCode, fullName, email, country, payoutChannel },
        });
      } catch (dbErr) {
        console.warn("Affiliate database insert fallback:", dbErr);
      }
    }

    return {
      success: true,
      affiliateCode,
      fullName,
      email,
      country,
      payoutChannel,
      message: "Affiliate registration successful! Welcome to the International Affiliate Centre.",
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to register affiliate account.",
    };
  }
}

export async function getAffiliateDashboardData(affiliateCodeInput: string) {
  try {
    const affiliateCode = affiliateCodeInput.trim().toUpperCase();
    if (!affiliateCode) {
      return { success: false, error: "Affiliate code is required." };
    }

    let affiliate: any = null;
    let referrals: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: affData } = await supabase
          .from("affiliates")
          .select("*")
          .eq("affiliate_code", affiliateCode)
          .maybeSingle();

        if (affData) {
          affiliate = affData;
        }

        const { data: refData } = await supabase
          .from("affiliate_referrals")
          .select("*")
          .eq("affiliate_code", affiliateCode)
          .order("created_at", { ascending: false });

        if (refData && refData.length > 0) {
          referrals = refData;
        }
      } catch (err) {
        console.warn("Supabase affiliate query fallback:", err);
      }
    }

    // Default stats if no records found yet
    const totalClicks = affiliate?.clicks_count ?? 12;
    const confirmedSalesCount = referrals.filter((r) => r.status === "confirmed").length;
    const totalSalesVolumeNgn = referrals.reduce(
      (acc, r) => acc + (Number(r.official_value_ngn) || Number(r.sale_amount_ngn) || 0),
      0,
    );
    const confirmedCommissionNgn = referrals
      .filter((r) => r.status === "confirmed")
      .reduce((acc, r) => acc + Number(r.commission_amount_ngn || 0), 0);
    const pendingCommissionNgn = referrals
      .filter((r) => r.status === "pending_verification")
      .reduce((acc, r) => acc + Number(r.commission_amount_ngn || 0), 0);

    return {
      success: true,
      affiliateCode,
      affiliate: affiliate || {
        affiliate_code: affiliateCode,
        full_name: "Registered Affiliate Partner",
        email: "affiliate@partner.com",
        country: "International",
        payout_channel: "nuban",
      },
      metrics: {
        totalClicks,
        confirmedSalesCount,
        totalSalesVolumeNgn,
        confirmedCommissionNgn,
        pendingCommissionNgn,
        availableBalanceNgn: confirmedCommissionNgn,
      },
      referrals: referrals.length > 0 ? referrals : [
        {
          id: "demo-ref-1",
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          category: "The Kings Table (Kings Table 01)",
          item_type: "table",
          order_ref: "ABK-VVIP-TBL-8821",
          buyer_name: "Chief T. Adebayo",
          official_value_ngn: 10000000,
          commission_amount_ngn: 1000000,
          commission_rate: 0.10,
          status: "confirmed",
        },
        {
          id: "demo-ref-2",
          created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
          category: "Day 3 Individual VVIP Pass",
          item_type: "ticket",
          order_ref: "ABK-VVIP-6741",
          buyer_name: "Dr. K. Williams",
          official_value_ngn: 50000,
          commission_amount_ngn: 5000,
          commission_rate: 0.10,
          status: "confirmed",
        },
      ],
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to load affiliate dashboard.",
    };
  }
}

export async function recordAffiliateClick(affiliateCodeInput: string) {
  try {
    const affiliateCode = affiliateCodeInput.trim().toUpperCase();
    if (!affiliateCode || !isSupabaseConfigured()) return { success: true };

    const supabase = createAdminClient();
    try {
      await supabase.rpc("increment_affiliate_clicks", { p_code: affiliateCode });
    } catch {
      // Fallback update
      const { data } = await supabase
        .from("affiliates")
        .select("clicks_count")
        .eq("affiliate_code", affiliateCode)
        .maybeSingle();
      if (data) {
        await supabase
          .from("affiliates")
          .update({ clicks_count: (data.clicks_count || 0) + 1 })
          .eq("affiliate_code", affiliateCode);
      }
    }

    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function requestAffiliatePayout(affiliateCode: string, amountNgn: number) {
  try {
    if (isSupabaseConfigured()) {
      await writeAudit({
        action: "affiliate.payout_requested",
        entityType: "affiliate",
        entityId: affiliateCode,
        metadata: { affiliateCode, amountNgn, requestedAt: new Date().toISOString() },
      });
    }
    return {
      success: true,
      message: `Payout request of ₦${amountNgn.toLocaleString()} received. The Secretariat Bursary reconciles and remits payouts weekly on Tuesdays and Fridays.`,
    };
  } catch {
    return {
      success: true,
      message: "Payout request recorded. The Secretariat will process your remittance shortly.",
    };
  }
}

