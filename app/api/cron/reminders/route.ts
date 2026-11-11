import { NextRequest, NextResponse } from "next/server";
import { dispatchRemindersBatch, ReminderRecipient } from "@/lib/reminders/engine";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  // Authorization: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
  // Fail closed — an unconfigured or mismatched secret must never expose an
  // open relay that lets anyone trigger reminder dispatches.
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!cronSecret) {
    if (isProduction) {
      return NextResponse.json(
        { error: "Unauthorized: CRON_SECRET is not configured." },
        { status: 401 },
      );
    }
    // Local development only: allow unauthenticated invocation.
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const type: "weekly" | "daily" = typeParam === "daily" ? "daily" : "weekly";

  // Determine day number if in December 2026
  const now = new Date();
  let dayNumber: 1 | 2 | 3 = 1;
  const dateNum = now.getDate();
  const monthNum = now.getMonth(); // 11 is Dec
  if (monthNum === 11 && dateNum === 19) dayNumber = 2;
  if (monthNum === 11 && dateNum === 20) dayNumber = 3;

  const recipients: ReminderRecipient[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: regs } = await supabase
        .from("registrations")
        .select(`
          first_name,
          last_name,
          email,
          phone,
          category,
          credentials ( pass_code )
        `)
        .eq("status", "confirmed")
        .limit(200);

      if (regs) {
        for (const reg of regs) {
          const passCode =
            (reg as unknown as { credentials?: { pass_code?: string }[] }).credentials?.[0]?.pass_code ||
            `ABK-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          recipients.push({
            name: `${reg.first_name} ${reg.last_name}`,
            email: reg.email,
            phone: reg.phone,
            passCode,
            category: reg.category,
          });
        }
      }
    } catch {
      // Non-blocking
    }
  }

  if (recipients.length === 0) {
    recipients.push({
      name: "Distinguished Patron",
      email: "guest@example.com",
      phone: "+2348181888884",
      passCode: "ABK-2026-CRON",
      category: "Individual Attendee",
    });
  }

  const result = await dispatchRemindersBatch(recipients, type, dayNumber);

  return NextResponse.json({
    success: true,
    triggeredAt: new Date().toISOString(),
    type,
    dayNumber: type === "daily" ? dayNumber : undefined,
    ...result,
  });
}
