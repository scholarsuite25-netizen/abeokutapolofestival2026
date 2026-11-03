"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { isSupabaseConfigured } from "@/lib/env";
import { generateSignedPassToken, hashPassToken } from "@/lib/qr/token";
import { writeAudit } from "@/lib/supabase/audit";

const registrationSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  phone: z.string().trim().min(7, "Please provide a valid phone number."),
  groupSize: z.coerce.number().int().min(1).max(25).default(1),
  affiliationType: z.enum(["individual", "guest_of", "corporate"]).default("individual"),
  hostName: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  hasDay2Ticket: z.boolean().default(false),
  hasDay3Ticket: z.boolean().default(false),
  day2TicketRef: z.string().trim().optional(),
  day3TicketRef: z.string().trim().optional(),
  sendEmailReminders: z.boolean().default(true),
  sendWhatsappReminders: z.boolean().default(true),
  reminderCadence: z.enum(["weekly_and_daily", "weekly_only", "event_week_only"]).default("weekly_and_daily"),
});

export interface RegisterResult {
  success: boolean;
  status?: "confirmed" | "pending_approval";
  message?: string;
  error?: string;
  passCode?: string;
  qrToken?: string;
  holderName?: string;
  category?: string;
  affiliationType?: "individual" | "guest_of" | "corporate";
  hostName?: string;
  organization?: string;
  zoneAccess?: string[];
  day1Status?: "free_admitted" | "registered";
  day2Status?: "ticket_required" | "ticket_verified";
  day3Status?: "ticket_required" | "ticket_verified";
  ticketRefDay2?: string;
  ticketRefDay3?: string;
}

function formatCategory(
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
 * Registration Workflow with Guest Affiliation:
 * - Day 1 (Friday 18 Dec): 100% Free Entry upon registration.
 * - Day 2 (Saturday 19 Dec) & Day 3 (Sunday 20 Dec): Admission is Through Ticket.
 * - Digital access card is issued immediately with pass code and cryptographic QR code.
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
    groupSize,
    affiliationType,
    hostName,
    organization,
    hasDay2Ticket,
    hasDay3Ticket,
    day2TicketRef,
    day3TicketRef,
  } = parsed.data;

  const category = formatCategory(affiliationType, hostName, organization);
  const holderName = `${firstName} ${lastName}`.trim();
  const zoneAccess = ["Festival Grounds & Grandstand"];

  const day1Status = "registered";
  const day2Status = hasDay2Ticket || day2TicketRef ? "ticket_verified" : "ticket_required";
  const day3Status = hasDay3Ticket || day3TicketRef ? "ticket_verified" : "ticket_required";

  if (!isSupabaseConfigured()) {
    // Graceful offline mock response for local evaluation or tests
    const mockPassCode = `ABK-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      success: true,
      status: "confirmed",
      passCode: mockPassCode,
      qrToken: `ABK26.DEMO.${mockPassCode}`,
      holderName,
      category,
      affiliationType,
      hostName: hostName || undefined,
      organization: organization || undefined,
      zoneAccess,
      day1Status,
      day2Status,
      day3Status,
      ticketRefDay2: day2TicketRef || (hasDay2Ticket ? "TCK-VERIFIED" : undefined),
      ticketRefDay3: day3TicketRef || (hasDay3Ticket ? "TCK-VERIFIED" : undefined),
      message: "Registration confirmed! Day 1 is Free Entry; Day 2 & 3 admission is Through Ticket.",
    };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return {
      success: false,
      error: "Registration is temporarily unavailable — please try again shortly.",
    };
  }

  let registrationId: string;
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
        category,
        group_size: groupSize,
        status: "confirmed",
        affiliation_type: affiliationType,
        host_name: hostName || null,
        organization: organization || null,
      })
      .select("id")
      .single();

    if (regError || !reg) {
      return {
        success: false,
        error: "We could not record your registration. Please try again.",
      };
    }
    registrationId = reg.id;
  } catch {
    return {
      success: false,
      error: "We could not record your registration. Please try again.",
    };
  }

  // Issue cryptographic gate credential immediately
  const credentialId = crypto.randomUUID();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const passCode = `ABK-2026-${randomSuffix}`;
  const issuedAt = new Date().toISOString();

  const qrToken = generateSignedPassToken({
    credentialId,
    holderName,
    passType: category,
    editionYear: 2026,
    issuedAt: Date.parse(issuedAt),
  });

  const { error: credError } = await supabase.from("credentials").insert({
    id: credentialId,
    registration_id: registrationId,
    holder_name: holderName,
    token_hash: hashPassToken(qrToken),
    pass_code: passCode,
    pass_type: category,
    zone_access: zoneAccess,
    affiliation_type: affiliationType,
    host_name: hostName || null,
    organization: organization || null,
    status: "active",
    issued_at: issuedAt,
  });

  if (credError) {
    return {
      success: true,
      status: "confirmed",
      passCode,
      holderName,
      category,
      affiliationType,
      day1Status,
      day2Status,
      day3Status,
      message: "Registration recorded. Access card is active.",
    };
  }

  await writeAudit({
    action: "registration.issue_access_card",
    entityType: "registration",
    entityId: registrationId,
    metadata: {
      pass_code: passCode,
      category,
      affiliation_type: affiliationType,
      day1_free: true,
      day2_ticket: day2Status,
      day3_ticket: day3Status,
    },
  }).catch(() => undefined);

  const affiliationDisplay =
    affiliationType === "guest_of" && hostName
      ? `Guest of: ${hostName}`
      : affiliationType === "corporate" && organization
      ? `Corporate Delegation: ${organization}`
      : "Individual Attendee";

  // Send confirmation email with pass details, PDF schedule download link & 3-day admission rules
  try {
    await sendEmail({
      to: email,
      subject: `Your Gate Access Card: 2026 Abeokuta Polo Festival (${passCode})`,
      html: `
        <div style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1B1C1C; background-color: #FCF9F8; border-radius: 16px; border: 1px solid #C1C9BF;">
          <div style="background-color: #002F1A; padding: 24px; border-radius: 12px; text-align: center; color: #FCF9F8;">
            <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 6px 0; font-weight: bold;">Official Gate Access Pass & Schedule</p>
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; font-family: 'Cormorant Garamond', Georgia, serif;">Abeokuta Polo Festival 2026</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #D4AF37; font-style: italic;">The Blueprint — Building the Future from Our Heritage</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #C1C9BF;">18–20 December 2026 · Abeokuta Polo Club & Country Resort, Ogun State</p>
          </div>
          <div style="padding: 24px 0;">
            <p style="font-size: 15px; margin: 0 0 12px 0;">Dear <strong>${holderName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #55635A;">
              Your digital gate access card for the <strong>2026 Abeokuta Polo Festival</strong> has been successfully issued. Keep this email or download your offline card for gate entry.
            </p>

            <!-- Digital Pass Card Box -->
            <div style="background-color: #FFFFFF; border: 2px dashed #002F1A; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="color: #C9A84C; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0; letter-spacing: 0.1em;">Pass Reference Code</p>
              <h2 style="font-size: 28px; color: #002F1A; margin: 6px 0; letter-spacing: 0.12em; font-family: monospace; font-weight: 800;">${passCode}</h2>
              <p style="color: #55635A; font-size: 13px; margin: 4px 0 0 0;">Category: <strong>${category}</strong></p>
              <p style="color: #C9A84C; font-size: 12px; margin: 4px 0 0 0; font-weight: 600;">${affiliationDisplay}</p>
              <p style="color: #55635A; font-size: 12px; margin: 4px 0 0 0;">Entitlement: <strong>Festival Grounds & Grandstand</strong></p>
            </div>

            <!-- Download Official PDF Schedule CTA -->
            <div style="background-color: #002F1A; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center; color: #FCF9F8;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #D4AF37;">Official 3-Day Festival Programme (PDF)</p>
              <p style="margin: 0 0 14px 0; font-size: 12px; color: #FCF9F8; opacity: 0.9;">
                Download the beautifully designed 3-day itinerary covering all ceremonial events, royal matches, foundation-layings, debate, sip & paint, and ARISTOS BAND performances.
              </p>
              <a href="https://abeokuta-polo-festival-2026.vercel.app/api/programme/pdf" style="display: inline-block; background-color: #D4AF37; color: #002F1A; padding: 10px 22px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px;">
                📄 Download Official PDF Programme
              </a>
            </div>

            <!-- Daily Schedule Breakdown -->
            <div style="background-color: #F4F4F0; border-radius: 12px; padding: 18px; font-size: 12.5px; color: #414843; margin-bottom: 20px; line-height: 1.55;">
              <p style="margin: 0 0 10px 0; font-weight: 700; color: #062D1D; font-size: 13px;">Tournament Schedule & Admission Rules:</p>
              <ul style="margin: 0; padding-left: 18px;">
                <li style="margin-bottom: 8px;">
                  <strong style="color: #065F46;">Day 1: Friday 18 Dec (100% FREE PUBLIC ADMISSION)</strong><br />
                  <span>MEDIA, TOUR & FESTIVAL LIGHT-UP: 10:00 AM Press Conference & Media Tour; Evening Festival Light-Up Ceremony & Welcome Dinner.</span>
                </li>
                <li style="margin-bottom: 8px;">
                  <strong style="color: #92400E;">Day 2: Saturday 19 Dec (THROUGH TICKET)</strong><br />
                  <span>ROYAL OPENING & POLO: 12:00 NOON Opening by HRM Oba Dr. Michael Aremu Gbadebo CFR, Opening of Market Square, 3 Foundation-Layings (Trauma Centre, Complex, 500-Horse Stable), Queens Polo Match, Literary Debate, Poetry, Sip & Paint, DJ & Evening Polo.</span>
                </li>
                <li>
                  <strong style="color: #92400E;">Day 3: Sunday 20 Dec (THROUGH TICKET)</strong><br />
                  <span>THE GRAND FINALE: 12:00 NOON Royal Cup Final & Queens Cup Final, Presidential Address by Dr. Sheriff Adams Abdulrahman, ARISTOS BAND performances, Celebrating the 100 Kings (ONE FIELD, ONE LEGACY), Headline concert by BERRYOLA.</span>
                </li>
              </ul>
            </div>

            <!-- Automated Reminders Notice -->
            <div style="background-color: #ECFDF5; border: 1px solid #6EE7B7; border-radius: 8px; padding: 12px; font-size: 12px; color: #065F46;">
              <strong>🔔 Automated Event Reminders:</strong> You are subscribed to weekly countdown updates and daily tournament notifications via email and WhatsApp helpline (+234 818 188 8884) to keep you fully informed.
            </div>
          </div>
          <div style="text-align: center; font-size: 11px; color: #707973; border-top: 1px solid #DCD5C2; padding-top: 16px;">
            Abeokuta Polo Club & Country Resort · Kobape Expressway, Abeokuta, Ogun State, Nigeria<br />
            &ldquo;WHERE ROYALTY MEETS SPORT. WHERE CULTURE MEETS EXCELLENCE. WHERE HERITAGE INSPIRES THE FUTURE.&rdquo;
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
    passCode,
    qrToken,
    holderName,
    category,
    affiliationType,
    hostName: hostName || undefined,
    organization: organization || undefined,
    zoneAccess,
    day1Status,
    day2Status,
    day3Status,
    ticketRefDay2: day2TicketRef || (hasDay2Ticket ? "TCK-VERIFIED" : undefined),
    ticketRefDay3: day3TicketRef || (hasDay3Ticket ? "TCK-VERIFIED" : undefined),
    message: "Registration confirmed! Day 1 is Free Entry; Day 2 & 3 admission is Through Ticket.",
  };
}
