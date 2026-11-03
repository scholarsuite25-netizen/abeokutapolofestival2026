import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchRemindersBatch, ReminderRecipient } from "@/lib/reminders/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type: "weekly" | "daily" = body.type === "daily" ? "daily" : "weekly";
    const dayNumber = (body.dayNumber === 2 ? 2 : body.dayNumber === 3 ? 3 : 1) as 1 | 2 | 3;
    const testEmail = body.testEmail as string | undefined;

    const recipients: ReminderRecipient[] = [];

    if (testEmail) {
      recipients.push({
        name: body.testName || "Distinguished Guest",
        email: testEmail,
        phone: body.testPhone || "+2348181888884",
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
        .limit(100);

      if (!error && regs) {
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
            cadence: "weekly_and_daily",
          });
        }
      }
    } else {
      // Mock recipients for offline / local validation
      recipients.push({
        name: "Dr. Babatunde Adeleke",
        email: "guest@example.com",
        phone: "+2348030000001",
        passCode: "ABK-2026-0042",
        category: "Individual Attendee",
        cadence: "weekly_and_daily",
      });
    }

    const result = await dispatchRemindersBatch(recipients, type, dayNumber);

    return NextResponse.json({
      success: true,
      type,
      dayNumber: type === "daily" ? dayNumber : undefined,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
