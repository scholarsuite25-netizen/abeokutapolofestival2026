import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { can, type Role } from "@/lib/permissions/matrix";
import { dispatchRemindersBatch, ReminderRecipient } from "@/lib/reminders/engine";

/**
 * GET: Reports channel capabilities and WhatsApp readiness.
 * Public architectural status check (no PII returned).
 */
export async function GET() {
  const metaConfigured = Boolean(
    process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
  const termiiConfigured = Boolean(process.env.TERMII_API_KEY);

  return NextResponse.json({
    status: "active",
    channelArchitecture: {
      primaryChannel: "WhatsApp (Option 1)",
      fallbackChannel: "Email (Option 2)",
      scaleTarget: "2,500 attendees",
      automatedProviders: {
        metaWhatsAppCloudApi: {
          configured: metaConfigured,
          envVars: ["WHATSAPP_CLOUD_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
          throughput: "Up to 80 messages/sec (Tier 1-3)",
        },
        termiiWhatsAppApi: {
          configured: termiiConfigured,
          envVars: ["TERMII_API_KEY", "TERMII_SENDER_ID"],
          throughput: "Nigerian Local Aggregation (~50-100 msg/sec)",
        },
        zeroCostImmediateMethod: {
          available: true,
          type: "Direct wa.me Instant Click-to-Chat Deep Links",
          secretariatQueueReady: true,
        },
      },
    },
  });
}

/**
 * POST: Dispatches tournament brief & reminders to registered attendees.
 * Hardened with role authentication & CRON_SECRET verification.
 * Sanitizes response to avoid attendee PII leakage.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication & Authorization Check
    const authHeader = req.headers.get("authorization");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorizedCron =
      cronSecret &&
      ((authHeader && authHeader === `Bearer ${cronSecret}`) ||
        (cronSecretHeader && cronSecretHeader === cronSecret));

    let isAuthorizedAdmin = false;
    if (!isAuthorizedCron) {
      try {
        const supabase = await createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const userRole = (session.user.app_metadata?.role as Role) || "public";
          isAuthorizedAdmin = can({ userId: session.user.id, roles: [userRole] }, "cms.publish");
        }
      } catch {
        isAuthorizedAdmin = false;
      }
    }

    // In production, block unauthorized callers
    if (process.env.NODE_ENV === "production" && !isAuthorizedCron && !isAuthorizedAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized. Missing valid CRON_SECRET or executive administrator privileges.",
        },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const type: "weekly" | "daily" = body.type === "daily" ? "daily" : "weekly";
    const dayNumber = (body.dayNumber === 2 ? 2 : body.dayNumber === 3 ? 3 : 1) as 1 | 2 | 3;
    const testEmail = body.testEmail as string | undefined;
    const testPhone = body.testPhone as string | undefined;
    const maxRecipients =
      typeof body.limit === "number" ? Math.min(Math.max(body.limit, 1), 2500) : 2500;

    const recipients: ReminderRecipient[] = [];

    if (testPhone || testEmail) {
      recipients.push({
        name: body.testName || "Distinguished Polo Guest",
        email: testEmail || "guest@example.com",
        phone: testPhone || "+234 803 123 4567",
        passCode: "ABK-2026-TEST",
        category: "Individual Attendee",
        cadence: "weekly_and_daily",
      });
    } else if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: regs, error } = await supabase
        .from("registrations")
        .select(`
          first_name,
          last_name,
          email,
          phone,
          category,
          status,
          credentials ( pass_code )
        `)
        .eq("status", "confirmed")
        .limit(maxRecipients);

      if (!error && regs) {
        for (const reg of regs) {
          const passCode =
            (reg as unknown as { credentials?: { pass_code?: string }[] }).credentials?.[0]
              ?.pass_code ||
            `ABK-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          recipients.push({
            name: `${reg.first_name} ${reg.last_name}`,
            email: reg.email,
            phone: reg.phone,
            passCode,
            category: reg.category,
            cadence: "weekly_and_daily",
          });
        }
      }
    } else {
      // Offline / Preview default attendees
      recipients.push(
        {
          name: "Dr. Babatunde Adeleke",
          email: "adeleke@example.com",
          phone: "+234 803 123 4567",
          passCode: "ABK-2026-0042",
          category: "Individual Attendee",
          cadence: "weekly_and_daily",
        },
        {
          name: "Folashade Balogun",
          email: "folashade.b@firstbank.com.ng",
          phone: "+234 802 987 6543",
          passCode: "ABK-VVIP-FB02",
          category: "Day 3 VVIP Grand Finale Pass",
          cadence: "weekly_and_daily",
        },
      );
    }

    const result = await dispatchRemindersBatch(recipients, type, dayNumber);

    // Sanitize response: do NOT expose attendee PII or raw direct links unless explicitly requested by an admin
    const sanitizedResult = {
      success: true,
      channelStrategy: "whatsapp_primary_email_fallback",
      type,
      dayNumber: type === "daily" ? dayNumber : undefined,
      totalProcessed: result.totalProcessed,
      whatsappPrimarySent: result.whatsappPrimarySent,
      whatsappQueued: result.whatsappQueued,
      emailsSent: result.emailsSent,
      emailsFailed: result.emailsFailed,
      channelPriority: result.channelPriority,
      // Only include direct links if authorized admin explicitly requested them
      ...(isAuthorizedAdmin && body.includeLinks
        ? { whatsappDirectLinks: result.whatsappDirectLinks }
        : {}),
    };

    return NextResponse.json(sanitizedResult);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during dispatch processing." },
      { status: 500 },
    );
  }
}
