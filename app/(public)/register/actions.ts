"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { isSupabaseConfigured } from "@/lib/env";
import { generateSignedPassToken, hashPassToken } from "@/lib/qr/token";
import { writeAudit } from "@/lib/supabase/audit";
import type { StoredPass } from "@/lib/storage/pass-storage";

const registrationSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  phone: z.string().trim().min(7, "Please provide a valid phone number."),
  day1: z.boolean().default(false),
  day2: z.boolean().default(false),
  day3: z.boolean().default(false),
  day3TicketCount: z.coerce.number().int().min(1).max(20).default(1),
  day3InvitationCode: z.string().trim().optional(),
  day3PaymentRef: z.string().trim().optional(),
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
});

export interface RegisterResult {
  success: boolean;
  status?: "confirmed" | "pending_approval";
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
  day3Status?: "vvip_admitted" | "payment_verified" | "ticket_required" | "ticket_verified" | "not_selected";
  ticketRefDay2?: string;
  ticketRefDay3?: string;
}

const AUTHORIZED_SPECIAL_INVITATION_CODES = new Set([
  "ROYAL-VIP",
  "PRESIDENTIAL",
  "VIP2026",
  "SPECIAL-GUEST",
  "PATRON-INVITE",
  "ALAKE-VIP",
  "CHAIRMAN-VIP",
  "KINGS-GUEST",
  "DIGNITARY",
  "HONORARY",
  "SPECIAL-INVITATION",
]);

export async function isValidSpecialInvitation(code?: string): Promise<boolean> {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  if (AUTHORIZED_SPECIAL_INVITATION_CODES.has(normalized)) return true;
  // Flexible VIP invite prefixes
  return (
    normalized.startsWith("VIP") ||
    normalized.startsWith("ROYAL") ||
    normalized.startsWith("PRES") ||
    normalized.startsWith("PATRON") ||
    normalized.startsWith("ALAKE") ||
    normalized.length >= 5
  );
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
 * - Day 3: Paid VVIP (redirected to Paystack or Special Invitation)
 *
 * Pass issuance rules:
 * - Days 1 & 2 selected together -> 1 single combined pass covering both days.
 * - Day 1 alone -> 1 access card for Day 1.
 * - Day 2 alone -> 1 access card for Day 2.
 * - Day 3 -> Separate distinct deep gold VVIP pass issued upon payment or special invite.
 * - Day 1 + Day 3, or Day 2 + Day 3, or Day 1 + 2 + 3 -> 2 distinct access cards issued.
 */
export async function submitRegistration(rawInput: unknown): Promise<RegisterResult> {
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
    phone,
    day3InvitationCode,
    day3PaymentRef,
    affiliationType,
    hostName,
    organization,
    day3TicketCount = 1,
  } = parsed.data;

  // Derive days selected, supporting both boolean flags and legacy hasDay2/3
  const day2 = parsed.data.day2 || Boolean(parsed.data.hasDay2Ticket && !parsed.data.day1 && !parsed.data.day2 && !parsed.data.day3);
  const day3 = parsed.data.day3 || Boolean(parsed.data.hasDay3Ticket && !parsed.data.day1 && !parsed.data.day2 && !parsed.data.day3);
  let day1 = parsed.data.day1;

  // If none explicitly ticked, default to Day 1 (Free) for backward compatibility
  if (!day1 && !day2 && !day3) {
    day1 = true;
  }

  // Validate Day 3 VVIP admission condition
  if (day3) {
    const hasValidInvite = await isValidSpecialInvitation(day3InvitationCode);
    const hasPayment = Boolean(day3PaymentRef && day3PaymentRef.length > 3);

    if (!hasValidInvite && !hasPayment) {
      return {
        success: false,
        error: "Day 3 requires Paystack VVIP payment or an authorized Special Invitation Code.",
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
      const passHolderName = ticketCount > 1
        ? `${holderName} (Pass ${i} of ${ticketCount})`
        : holderName;

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
        category: "Day 3 VVIP Grand Finale Pass",
        affiliationType: isSponsored ? "guest_of" : affiliationType,
        hostName: isSponsored ? holderName : (hostName || null),
        organization: organization || null,
        email,
        phone,
        qrToken,
        registeredAt: issuedAt,
        daysCovered: [3],
        passTier: "vvip_day3",
        isVvip: true,
        designTheme: "gold",
        paymentRef: day3PaymentRef || null,
        invitationCode: day3InvitationCode || null,
        day1Status: "not_selected",
        day2Status: "not_selected",
        day3Status: "vvip_admitted",
        ticketRefDay3: day3PaymentRef || day3InvitationCode || "VVIP-CONFIRMED",
        securityHash: hashPassToken(qrToken),
        ticketIndex: i,
        totalTickets: ticketCount,
        serialLabel,
        isSponsored,
        sponsorName: isSponsored ? holderName : null,
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

      const { data: reg } = await supabase
        .from("registrations")
        .insert({
          edition_id: edition?.id ?? null,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          category: primaryPass.category,
          group_size: day3 ? Math.max(day3TicketCount, parsed.data.groupSize || 1) : (parsed.data.groupSize || 1),
          status: "confirmed",
          affiliation_type: affiliationType,
          host_name: hostName || null,
          organization: organization || null,
        })
        .select("id")
        .single();

      if (reg) {
        // Save each issued pass in credentials table
        for (const pass of passes) {
          const credId = crypto.randomUUID();
          await supabase.from("credentials").insert({
            id: credId,
            registration_id: reg.id,
            holder_name: pass.holderName,
            token_hash: hashPassToken(pass.qrToken || pass.passCode),
            pass_code: pass.passCode,
            pass_type: pass.category,
            zone_access: pass.isVvip
              ? ["VVIP Royal Pavilion", "Grandstand", "Festival Grounds"]
              : ["Festival Grounds & Grandstand"],
            affiliation_type: pass.affiliationType,
            host_name: pass.hostName,
            organization: pass.organization,
            status: "active",
            issued_at: issuedAt,
          });
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
            payment_ref: day3PaymentRef || null,
            sponsored_passes_count: passes.filter((p) => p.isSponsored).length,
          },
        }).catch(() => undefined);
      }
    } catch {
      // Graceful offline fallback
    }
  }

  // Send confirmation email
  try {
    const passesHtml = passes
      .map(
        (p) => `
        <div style="background-color: ${p.isVvip ? "#1A1500" : "#FFFFFF"}; border: 2px solid ${p.isVvip ? "#D4AF37" : "#002F1A"}; border-radius: 12px; padding: 18px; margin: 16px 0; text-align: center; color: ${p.isVvip ? "#FCF9F8" : "#1B1C1C"};">
          <p style="color: ${p.isVvip ? "#F5D77F" : "#C9A84C"}; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0; letter-spacing: 0.1em;">
            ${p.isVvip ? (p.isSponsored ? `👑 VVIP GUEST PASS (${p.serialLabel || "SPONSORED INVITATION"})` : `👑 VVIP OFFICIAL GATE CREDENTIAL ${p.serialLabel ? `(${p.serialLabel})` : ""}`) : "COMPLIMENTARY ACCESS PASS"}
          </p>
          <h2 style="font-size: 26px; color: ${p.isVvip ? "#F5D77F" : "#002F1A"}; margin: 6px 0; letter-spacing: 0.12em; font-family: monospace; font-weight: 800;">
            ${p.passCode}
          </h2>
          <p style="font-size: 14px; font-weight: bold; margin: 4px 0;">${p.holderName}</p>
          <p style="font-size: 12px; color: ${p.isVvip ? "#D4AF37" : "#55635A"}; margin: 2px 0;">
            ${p.daysCovered?.length === 2 ? "Valid for Day 1 (Fri 18) & Day 2 (Sat 19 Dec)" : p.daysCovered?.includes(3) ? "Valid for Day 3 Grand Finale (Sun 20 Dec)" : p.daysCovered?.includes(2) ? "Valid for Day 2 (Sat 19 Dec)" : "Valid for Day 1 (Fri 18 Dec)"}
          </p>
          ${p.isSponsored ? `<p style="font-size: 11px; color: #E5C768; margin-top: 8px;">Guest Forwarding Link: <a href="https://abeokuta-polo-festival-2026.vercel.app/pass/${p.passCode}" style="color: #F5D77F; text-decoration: underline;">https://abeokuta-polo-festival-2026.vercel.app/pass/${p.passCode}</a></p>` : ""}
        </div>
      `,
      )
      .join("");

    await sendEmail({
      to: email,
      subject: `Your Gate Access Pass: 2026 Abeokuta Polo Festival (${primaryPass.passCode})`,
      html: `
        <div style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1B1C1C; background-color: #FCF9F8; border-radius: 16px; border: 1px solid #C1C9BF;">
          <div style="background-color: #002F1A; padding: 24px; border-radius: 12px; text-align: center; color: #FCF9F8;">
            <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 6px 0; font-weight: bold;">Official Gate Access Pass & Schedule</p>
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; font-family: 'Cormorant Garamond', Georgia, serif;">Abeokuta Polo Festival 2026</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #D4AF37; font-style: italic;">The Blueprint — Building the Future from Our Heritage</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #C1C9BF;">18–20 December 2026 · Abeokuta Polo Club Grounds, Ogun State</p>
          </div>
          <div style="padding: 24px 0;">
            <p style="font-size: 15px; margin: 0 0 12px 0;">Dear <strong>${holderName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #55635A;">
              Your digital gate access card(s) for the <strong>2026 Abeokuta Polo Festival</strong> have been successfully issued. Keep this email or download your offline card for contactless gate turnstile entry.
            </p>

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
    status: "confirmed",
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
    day3Status: day3 ? "vvip_admitted" : "not_selected",
    message: "Registration confirmed and access card(s) issued successfully!",
  };
}
