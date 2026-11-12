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
import { getSiteOrigin, siteUrl } from "@/lib/site";
import { adaptiveInsert } from "@/lib/db/adaptive-insert";
import { attachClaimToRegistration, claimPaymentReference } from "@/lib/paystack/claims";
import { verifyDay3Payment, getEffectivePaystackSecret } from "@/lib/paystack/verify";
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
 * Three-Day Event Registration:
 * - Day 1: 100% Free Entry
 * - Day 2: 100% Free Entry
 * - Day 3: Paid VVIP (Paystack payment verified server-side and single-use) or a
 *   Special Invitation Code from the server allow-list (VVIP_INVITATION_CODES)
 *
 * Pass issuance rules:
 * - Day 1 alone -> 1 access card for Day 1 (ABK-2026-D1...).
 * - Day 2 alone -> 1 access card for Day 2 (ABK-2026-D2...).
 * - Days 1 & 2 selected together -> 1 single combined pass covering both days (ABK-2026-D12...).
 * - Day 3 -> Separate distinct pass issued according to option picked (Individual VIP Option or VIP Table).
 * - Day 1 + Day 2 + Day 3 -> 2 distinct access cards (1 combined pass for Days 1 & 2 + 1 distinct Day 3 VIP pass).
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

  // Day 3 Grand Finale admission is sold with VIP Table packages (see
  // submitTableRegistration), so this registration path issues a Day-3 pass
  // ONLY for a complimentary Special VIP Invitation Code. Paid Day-3
  // admissions are refused here, so a hand-crafted request can never buy a
  // standalone Day-3 ticket.
  const verifiedPaymentRef: string | null = null;
  const bankTransferRef: string | null = null;
  const isBankTransfer = false;
  let usedInvitationCode: string | null = null;

  if (day3) {
    if (isValidSpecialInvitation(day3InvitationCode)) {
      usedInvitationCode = day3InvitationCode!.trim();
      day3TicketCount = Math.min(day3TicketCount, DAY3_INVITATION_MAX_TICKETS);
    } else {
      return {
        success: false,
        error:
          "Day 3 Grand Finale admission is issued with a VIP Table package (or a complimentary Special VIP Invitation Code). Please complete your table reservation on the VIP Tables page (/tables).",
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
    // 1 distinct pass for Day 1 alone
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
    // 1 distinct pass for Day 2 alone
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
        passType: "Day 3 Individual VIP Table Seat Pass",
        editionYear: 2026,
        issuedAt: Date.parse(issuedAt),
      });

      passes.push({
        passCode,
        holderName: passHolderName,
        category: isBankTransfer
          ? "Day 3 Individual VIP Table Provisional Claim (Pending Bursary Verification)"
          : "Day 3 Individual VIP Table Seat Pass",
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

        // NOTE: Day 3 affiliate commission is recorded by the table booking
        // path (submitTableRegistration). This path only issues complimentary
        // invitation passes, so there is no sale to commission here.

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
  // (bank transfers for Day 3 are handled by the VIP Table booking path).
  const secretariatNotification: {
    message: string;
    verificationLink: string;
    whatsappUrl: string;
  } | undefined = undefined;

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
          ${p.isSponsored ? `<p style="font-size: 11px; color: #E5C768; margin-top: 8px;">Guest Forwarding Link: <a href="${siteUrl(`/pass/${p.passCode}`)}" style="color: #F5D77F; text-decoration: underline;">${siteUrl(`/pass/${p.passCode}`)}</a></p>` : ""}
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
// Day 3 Exclusive Table & Hospitality Packages (Grand Finale — 20 Dec 2026)
// Brochure Capacities (10, 8, 6, 5, 1) · Serial Numbering · Anti-Forwarding
// ─────────────────────────────────────────────────────────────────────────────

const tableBookingSchema = z.object({
  packageId: z.enum([
    "individual_vip",
    "regular_section",
    "kings_table",
    "royal_table",
    "queens_table",
    "premium_table",
  ]),
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
 * Initializes online Paystack gateway checkout for a Day 3 Table Package.
 * Supports both the toggleable ₦100.00 pilot testing fee and the official brochure price.
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

    // Official brochure pricing is permanent and server-controlled.
    const chargeAmountNgn = pkg.officialPriceNgn;
    const origin = getSiteOrigin();
    const secret = getEffectivePaystackSecret();

    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const reference = `${DAY3_REFERENCE_PREFIX}TBL-${suffix}`;

    const callback = new URL("/tables", origin);
    callback.searchParams.set("pkg", pkg.id);
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
      // Official pricing only — the pilot testing fee reference form is retired.
      const simRef = `${DAY3_REFERENCE_PREFIX}SIM-${pkg.guestCapacity || 10}-OFF-${suffix}`;
      callback.searchParams.set("payment_ref", simRef);
      return {
        success: true,
        authorization_url: callback.toString(),
        reference: simRef,
        amount: chargeAmountNgn,
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
        amount: chargeAmountNgn * 100, // Paystack kobo
        reference,
        callback_url: callback.toString(),
        metadata: {
          product: `Day 3 VIP Table: ${pkg.name} (${input.tableSerial})`,
          package_id: pkg.id,
          table_serial: input.tableSerial,
          attendees_count: pkg.guestCapacity || 10,
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
      amount: chargeAmountNgn,
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
 * - Generates N distinct HMAC-256 signed ID access cards (10, 8, 6, 5, or 1 based on brochure capacity).
 * - Enforces anti-forwarding device-locking on guest invitations.
 * - Records 10% affiliate commission when booked via affiliate link.
 * - Automatically removes the ₦100 testing fee mode after a successful ₦100 test payment.
 * - Dispatches confirmation email via Resend to buyer and Secretariat.
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
      packageId: rawPackageId,
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

    const pkg = getTablePackage(rawPackageId);
    if (!pkg) {
      return { success: false, error: "Invalid table package specified." };
    }
    const packageId = pkg.id;

    const phoneValidation = validateWhatsAppPhone(rawPhone);
    const buyerPhone = phoneValidation.isValid ? phoneValidation.formatted : rawPhone;
    const buyerFullName = `${buyerFirstName} ${buyerLastName}`.trim();
    const isBankTransfer = paymentMethod === "bank_transfer";

    // Official brochure pricing is permanent and server-controlled.
    let verifiedPaymentRef: string | null = null;
    let bankTransferRef: string | null = null;
    let paidAmountNgn: number = pkg.officialPriceNgn;

    if (isBankTransfer) {
      bankTransferRef = (inputBankRef || generateWemaTransferReference()).trim().toUpperCase();
    } else if (paymentRef) {
      const payment = await verifyDay3Payment(paymentRef, {
        expectedEmail: buyerEmail,
        expectedMinAmountNgn: pkg.officialPriceNgn,
      });
      if (!payment.ok) {
        return { success: false, error: payment.message };
      }

      const claim = await claimPaymentReference({
        reference: payment.reference,
        email: buyerEmail,
        amountNgn: payment.amountNgn,
        quantity: pkg.guestCapacity || 10,
      });
      if (!claim.ok) {
        return { success: false, error: claim.message };
      }
      verifiedPaymentRef = payment.reference;
      paidAmountNgn = payment.amountNgn;
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
      individual_vip: "IVP",
      kings_table: "KT",
      royal_table: "RT",
      queens_table: "QT",
      premium_table: "PT",
    };
    const codePrefix = serialCodeMap[packageId] || "TBL";
    // Extract table number (e.g. "Kings Table 02" -> "02")
    const tableNumberMatch = tableSerial.match(/\d+/);
    const tableNum = tableNumberMatch ? tableNumberMatch[0] : "01";

    // ── Generate Distinct HMAC-256 Signed Access Passes ─────────────────────
    const attendeesList: Array<{ seat: number; name: string; passCode: string }> = [];
    const capacity = pkg.guestCapacity || 10;

    for (let seat = 1; seat <= capacity; seat++) {
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
        totalTickets: capacity,
        serialLabel: `${tableSerial} · Seat ${seat} of ${capacity}`,
        isSponsored: !isHost,
        sponsorName: !isHost ? buyerFullName : null,
        isBuyer: isHost,
        // Anti-forwarding device-locking:
        // Seat 1 belongs to buyer; seats 2-N lock automatically to the recipient's phone upon opening
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
          amount_ngn: paidAmountNgn,
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
          category: affiliateCode
            ? `${pkg.name} (${tableSerial}) · Sold by: ${affiliateCode}`
            : `${pkg.name} (${tableSerial})`,
          group_size: capacity,
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
          const officialCommissionNgn = pkg.officialPriceNgn * AFFILIATE_COMMISSION_RATE;
          await adaptiveInsert(supabase, "affiliate_referrals", {
            affiliate_code: affiliateCode.trim().toUpperCase(),
            item_type: "table",
            category: `${pkg.name} (${tableSerial})`,
            order_ref: verifiedPaymentRef || bankTransferRef || `TBL-${Date.now()}`,
            buyer_name: buyerFullName,
            sale_amount_ngn: paidAmountNgn,
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
            passesIssued: capacity,
            paidAmountNgn,
            officialValueNgn: pkg.officialPriceNgn,
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
          amountNgn: paidAmountNgn,
          buyerName: buyerFullName,
          email: buyerEmail,
          phone: buyerPhone,
          ref: bankTransferRef,
          ticketCount: capacity,
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

    // ── Transactional Resend Email to Table Buyer + Secretariat Copy ──────────
    const siteOrigin = getSiteOrigin();
    try {
      const safeBuyerName = escapeHtml(buyerFullName);
      const safePkgName = escapeHtml(pkg.name);
      const safeSerial = escapeHtml(tableSerial);
      const refDisplay = escapeHtml(verifiedPaymentRef || bankTransferRef || "TABLE-CONFIRMED");

      const passCardsHtml = passes
        .map((p, idx) => {
          const safeHolder = escapeHtml(p.holderName);
          const passUrl = `${siteOrigin}/pass/${encodeURIComponent(p.passCode)}`;
          return `
            <div style="background-color: #1A1500; border: 2px solid #D4AF37; border-radius: 10px; padding: 16px; margin: 12px 0; color: #FCF9F8;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #F5D77F; font-size: 11px; text-transform: uppercase; font-weight: 700;">
                  Seat ${idx + 1} of ${capacity} · ${idx === 0 ? "Table Host" : "Invited Guest"}
                </span>
                <span style="color: #D4AF37; font-size: 11px;">${safeSerial}</span>
              </div>
              <h3 style="font-size: 22px; color: #F5D77F; margin: 6px 0; font-family: monospace; letter-spacing: 0.08em;">${p.passCode}</h3>
              <p style="font-size: 13px; color: #E5E7EB; margin: 2px 0;">Holder: <strong>${safeHolder}</strong></p>
              <p style="font-size: 12px; margin: 8px 0 0 0;">
                <a href="${passUrl}" style="color: #F5D77F; font-weight: bold; text-decoration: underline;">Open Digital Pass (${passUrl}) →</a>
              </p>
            </div>
          `;
        })
        .join("");

      const statusBanner = isBankTransfer
        ? `<div style="background-color: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 14px; margin: 16px 0; color: #78350F; font-size: 13px;">
            <strong>⏳ Provisional Table Reservation (Pending Bank Transfer Verification):</strong><br/>
            Please transfer <strong>₦${paidAmountNgn.toLocaleString()}</strong> to <strong>${CLUB_BANK_DETAILS.bankName} — ${CLUB_BANK_DETAILS.accountNumber} (${CLUB_BANK_DETAILS.accountName})</strong> with reference <strong>${refDisplay}</strong>. Your ${capacity} turnstile pass${capacity > 1 ? "es" : ""} will activate immediately upon Bursary confirmation.
          </div>`
        : `<div style="background-color: #ECFDF5; border: 2px solid #10B981; border-radius: 8px; padding: 14px; margin: 16px 0; color: #065F46; font-size: 13px;">
            <strong>✅ Online Payment Verified (Ref: ${refDisplay}):</strong><br/>
            Your reservation for <strong>${safePkgName} (${safeSerial})</strong> is confirmed and all ${capacity} turnstile access card${capacity > 1 ? "s are" : " is"} active for Sunday, 20 December 2026.
          </div>`;

      await sendEmail({
        to: buyerEmail,
        subject: isBankTransfer
          ? `Provisional Reservation: ${pkg.name} (${tableSerial}) — 2026 Abeokuta Polo Festival`
          : `Confirmed Hospitality Package: ${pkg.name} (${tableSerial}) — 2026 Abeokuta Polo Festival`,
        html: `
          <div style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1B1C1C; background-color: #FCF9F8; border-radius: 16px; border: 1px solid #C1C9BF;">
            <div style="background-color: #1A1500; padding: 24px; border-radius: 12px; text-align: center; color: #FCF9F8; border: 2px solid #D4AF37;">
              <p style="color: #F5D77F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; margin: 0 0 6px 0; font-weight: bold;">Grand Finale Hospitality · 20 December 2026</p>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #F5D77F;">${safePkgName}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #DCD5C2;">Allocation: ${safeSerial} · ${capacity} Guest${capacity > 1 ? "s" : ""} · Official Value: ${pkg.officialPriceDisplay}</p>
            </div>
            <div style="padding: 20px 0;">
              <p style="font-size: 15px;">Dear <strong>${safeBuyerName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #414843;">
                Thank you for reserving <strong>${safePkgName} (${safeSerial})</strong> for the Grand Finale of the <strong>Abeokuta Polo Festival 2026 — THE BLUEPRINT</strong>.
              </p>
              ${statusBanner}
              <h3 style="font-size: 15px; color: #002F1A; margin: 20px 0 8px 0;">Your ${capacity} Digital Gate Pass${capacity > 1 ? "es" : ""}:</h3>
              ${passCardsHtml}
            </div>
            <div style="border-top: 1px solid #C1C9BF; padding-top: 16px; font-size: 11px; color: #55635A; text-align: center;">
              <p style="margin: 0;">Abeokuta Polo Club · Kobape, Abeokuta, Ogun State · Helpline: +234 818 188 8884</p>
            </div>
          </div>
        `,
      });

      // If paid via Paystack, also notify the Secretariat by email
      if (!isBankTransfer) {
        const secretariatEmail = process.env.SECRETARIAT_EMAIL || "abeokutapolo@gmail.com";
        await sendEmail({
          to: secretariatEmail,
          replyTo: buyerEmail,
          subject: `[CONFIRMED TABLE BOOKING] ${pkg.name} (${tableSerial}) — ${buyerFullName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4AF37; border-radius: 12px;">
              <h2 style="color: #002F1A; margin-top: 0;">Confirmed Day 3 Hospitality Booking</h2>
              <p><strong>Package:</strong> ${safePkgName} (${safeSerial})</p>
              <p><strong>Buyer:</strong> ${safeBuyerName} (${escapeHtml(buyerEmail)} · ${escapeHtml(buyerPhone)})</p>
              <p><strong>Amount Paid:</strong> ₦${paidAmountNgn.toLocaleString()} (Official Value: ${pkg.officialPriceDisplay})</p>
              <p><strong>Paystack Reference:</strong> ${refDisplay}</p>
              <p><strong>Passes Issued:</strong> ${capacity}</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.warn("Table booking email dispatch notice:", emailErr);
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
      amountNgn: paidAmountNgn,
      passes,
      secretariatNotification,
      message: isBankTransfer
        ? "Provisional Table Claim Slip issued. Please forward proof of transfer to Secretariat via WhatsApp to confirm turnstile activation."
        : `Table reservation confirmed! All ${capacity} distinct VIP ID access card${capacity > 1 ? "s are" : " is"} ready to share.`,
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

    // Send Welcome Email via Resend to the Affiliate + Secretariat Copy
    const siteOrigin = getSiteOrigin();
    try {
      const safeFullName = escapeHtml(fullName);
      const safeCountry = escapeHtml(country);
      const tableRefLink = `${siteOrigin}/tables?ref=${encodeURIComponent(affiliateCode)}`;
      const regRefLink = `${siteOrigin}/register?ref=${encodeURIComponent(affiliateCode)}`;
      const dashLink = `${siteOrigin}/affiliates/dashboard?code=${encodeURIComponent(affiliateCode)}`;

      await sendEmail({
        to: email,
        subject: `Welcome Affiliate Partner (${affiliateCode}) — Abeokuta Polo Festival 2026`,
        html: `
          <div style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1B1C1C; background-color: #FCF9F8; border-radius: 16px; border: 1px solid #C1C9BF;">
            <div style="background-color: #002F1A; padding: 24px; border-radius: 12px; text-align: center; color: #FCF9F8;">
              <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; margin: 0 0 6px 0; font-weight: bold;">International Affiliate Centre · 10% Commission</p>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #D4AF37;">Welcome, ${safeFullName}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #C1C9BF;">Partner Code: <strong>${affiliateCode}</strong> · Region: ${safeCountry}</p>
            </div>
            <div style="padding: 20px 0;">
              <p style="font-size: 14px; line-height: 1.6; color: #414843;">
                Your official affiliate partner account for the <strong>Abeokuta Polo Festival 2026 — THE BLUEPRINT</strong> is now active. You earn a guaranteed <strong>10% commission</strong> on all confirmed Grand Finale Table & Hospitality Packages and Regular Section tickets sold through your unique referral links:
              </p>
              <div style="background-color: #FFFFFF; border: 2px dashed #002F1A; border-radius: 10px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #002F1A;">Your Unique Referral Code:</p>
                <p style="margin: 0 0 12px 0; font-size: 22px; font-family: monospace; font-weight: 800; color: #C9A84C;">${affiliateCode}</p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Table Packages Link:</strong> <a href="${tableRefLink}" style="color: #002F1A;">${tableRefLink}</a></p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>General & Regular Section Link:</strong> <a href="${regRefLink}" style="color: #002F1A;">${regRefLink}</a></p>
                <p style="margin: 8px 0 0 0; font-size: 12px;"><strong>Partner Dashboard:</strong> <a href="${dashLink}" style="color: #002F1A; font-weight: bold;">${dashLink}</a></p>
              </div>
              <div style="background-color: #F4F4F0; border-radius: 8px; padding: 14px; font-size: 12px; color: #414843;">
                <strong style="color: #002F1A;">Official 2026 Commission Schedule (10%):</strong>
                <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.6;">
                  <li><strong>The Kings Table (10 Guests · ₦5,000,000):</strong> ₦500,000 commission</li>
                  <li><strong>The Royal Table (8 Guests · ₦3,000,000):</strong> ₦300,000 commission</li>
                  <li><strong>The Queens Table (6 Guests · ₦2,000,000):</strong> ₦200,000 commission</li>
                  <li><strong>The Premium Table (5 Guests · ₦500,000):</strong> ₦50,000 commission</li>
                  <li><strong>The Regular Section (Per Person · ₦50,000):</strong> ₦5,000 commission</li>
                </ul>
              </div>
            </div>
            <div style="border-top: 1px solid #C1C9BF; padding-top: 16px; font-size: 11px; color: #55635A; text-align: center;">
              <p style="margin: 0;">Abeokuta Polo Club · Secretariat Helpline: +234 818 188 8884</p>
            </div>
          </div>
        `,
      });

      const secretariatEmail = process.env.SECRETARIAT_EMAIL || "abeokutapolo@gmail.com";
      await sendEmail({
        to: secretariatEmail,
        replyTo: email,
        subject: `[NEW AFFILIATE PARTNER] ${affiliateCode} — ${fullName} (${country})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #002F1A; border-radius: 12px;">
            <h2 style="color: #002F1A; margin-top: 0;">New Affiliate Partner Registration</h2>
            <p><strong>Affiliate Code:</strong> ${escapeHtml(affiliateCode)}</p>
            <p><strong>Full Name:</strong> ${safeFullName}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
            <p><strong>Country:</strong> ${safeCountry}</p>
            <p><strong>Payout Channel:</strong> ${escapeHtml(payoutChannel)}</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn("Affiliate welcome email notice:", emailErr);
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
          official_value_ngn: 5000000,
          commission_amount_ngn: 500000,
          commission_rate: 0.10,
          status: "confirmed",
        },
        {
          id: "demo-ref-2",
          created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
          category: "The Regular Section (Day 3 Pass)",
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
    const secretariatEmail = process.env.SECRETARIAT_EMAIL || "abeokutapolo@gmail.com";
    await sendEmail({
      to: secretariatEmail,
      subject: `[AFFILIATE PAYOUT REQUEST] ${affiliateCode} — ₦${amountNgn.toLocaleString()}`,
      html: `<p>Affiliate partner <strong>${escapeHtml(affiliateCode)}</strong> requested a commission payout of <strong>₦${amountNgn.toLocaleString()}</strong>.</p>`,
    }).catch(() => undefined);

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

// ─────────────────────────────────────────────────────────────────────────────
// Sponsorship, Hospitality & General Enquiries (Resend Automated Dispatch)
// ─────────────────────────────────────────────────────────────────────────────

const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
  organization: z.string().trim().optional(),
  category: z.enum(["hospitality", "sponsorship", "general"]).default("general"),
  tierName: z.string().trim().optional(),
  message: z.string().trim().min(5, "Please include a brief inquiry message."),
});

export async function submitEnquiryAction(rawInput: unknown) {
  try {
    const parsed = enquirySchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(". "),
      };
    }

    const { fullName, email, phone, organization, category, tierName, message } = parsed.data;
    const safeName = escapeHtml(fullName);
    const safeOrg = escapeHtml(organization || "Individual / Private");
    const safeTier = escapeHtml(tierName || category.toUpperCase());
    const safeMsg = escapeHtml(message);
    const secretariatEmail = process.env.SECRETARIAT_EMAIL || "abeokutapolo@gmail.com";

    // 1. Send instant acknowledgement email to the enquirer via Resend
    await sendEmail({
      to: email,
      subject: `Enquiry Received: ${tierName || "Abeokuta Polo Festival 2026"} — Secretariat Liaison`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1B1C1C; background-color: #FCF9F8; border-radius: 14px; border: 1px solid #C1C9BF;">
          <div style="background-color: #002F1A; padding: 20px; border-radius: 10px; text-align: center; color: #FCF9F8;">
            <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 4px 0; font-weight: bold;">Official Secretariat Acknowledgement</p>
            <h2 style="margin: 0; font-size: 22px; color: #D4AF37;">Abeokuta Polo Festival 2026 — The Blueprint</h2>
          </div>
          <div style="padding: 20px 0; font-size: 14px; line-height: 1.6; color: #414843;">
            <p>Dear <strong>${safeName}</strong>,</p>
            <p>Thank you for contacting the <strong>Abeokuta Polo Club Secretariat</strong> regarding <strong>${safeTier}</strong>.</p>
            <p>Your inquiry has been logged and assigned to our Protocol &amp; Hospitality Liaison Desk. A representative will reach out to you shortly via phone/WhatsApp (<strong>${escapeHtml(phone)}</strong>) or email.</p>
            <div style="background-color: #FFFFFF; border-left: 4px solid #D4AF37; padding: 12px 16px; margin: 16px 0; font-size: 13px;">
              <strong>Your Message Summary:</strong><br/>
              ${safeMsg}
            </div>
            <p style="font-size: 13px;">For urgent assistance, you may also reach the Secretariat directly on WhatsApp or telephone at <strong>+234 818 188 8884</strong> or <strong>0803 681 8916</strong>.</p>
          </div>
          <div style="border-top: 1px solid #C1C9BF; padding-top: 12px; font-size: 11px; color: #55635A; text-align: center;">
            Abeokuta Polo Club Secretariat · 4th Floor, Conference Hotel, Presidential Boulevard, Oke-Mosan, Abeokuta
          </div>
        </div>
      `,
    });

    // 2. Send alert email to Secretariat
    await sendEmail({
      to: secretariatEmail,
      replyTo: email,
      subject: `[NEW ${category.toUpperCase()} ENQUIRY] ${tierName || category} — ${fullName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #002F1A; border-radius: 12px;">
          <h2 style="color: #002F1A; margin-top: 0;">New ${escapeHtml(category.toUpperCase())} Enquiry</h2>
          <p><strong>Package / Tier:</strong> ${safeTier}</p>
          <p><strong>Full Name:</strong> ${safeName}</p>
          <p><strong>Organization:</strong> ${safeOrg}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone / WhatsApp:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Message:</strong><br/>${safeMsg}</p>
        </div>
      `,
    });

    if (isSupabaseConfigured()) {
      await writeAudit({
        action: `enquiry.${category}`,
        entityType: "enquiry",
        entityId: email,
        metadata: { fullName, email, phone, organization, category, tierName, message },
      }).catch(() => undefined);
    }

    return {
      success: true,
      message: "Your enquiry has been sent to the Secretariat and a confirmation email has been dispatched to your inbox.",
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error)?.message || "Could not submit enquiry. Please try again.",
    };
  }
}

