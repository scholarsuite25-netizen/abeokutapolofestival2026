import { sendEmail } from "@/lib/email/client";
import { OFFICIAL_PROGRAMME } from "@/lib/data/programme";

export interface ReminderRecipient {
  name: string;
  email: string;
  phone: string;
  passCode: string;
  category: string;
  cadence?: "weekly_and_daily" | "weekly_only" | "event_week_only";
  hasDay2Ticket?: boolean;
  hasDay3Ticket?: boolean;
}

export interface ReminderDispatchResult {
  totalProcessed: number;
  emailsSent: number;
  emailsFailed: number;
  whatsappQueued: number;
  logs: string[];
}

/**
 * Builds the WhatsApp message template for a registered attendee.
 */
export function buildWhatsappReminderMessage(
  recipient: ReminderRecipient,
  type: "weekly" | "daily",
  dayNumber?: 1 | 2 | 3,
): string {
  const festivalUrl = "https://abeokuta-polo-festival-2026.vercel.app";
  const pdfUrl = `${festivalUrl}/api/programme/pdf`;
  const passUrl = `${festivalUrl}/pass/${encodeURIComponent(recipient.passCode)}`;

  if (type === "daily" && dayNumber) {
    const day = OFFICIAL_PROGRAMME.find((d) => d.dayNumber === dayNumber) || OFFICIAL_PROGRAMME[0];
    const ticketRule =
      day.admission === "100% Free Entry"
        ? "✅ DAY 1 IS 100% FREE PUBLIC ADMISSION — All Registered Patrons Welcome!"
        : "🎟️ ADMISSION IS THROUGH TICKET — Ensure you have your ticket ready at the gate.";

    const dateLabel = `${day.dayName}, ${day.dateStr}`;

    return (
      `🏇 *ABEOKUTA POLO FESTIVAL 2026 — TODAY'S TOURNAMENT BRIEF*\n\n` +
      `Hello ${recipient.name},\n` +
      `Today is *Day ${day.dayNumber}: ${day.theme}* (${dateLabel})!\n\n` +
      `📍 *Venue:* Abeokuta Polo Club & Country Resort, Kobape Expressway\n` +
      `🎫 *Your Gate Pass:* ${recipient.passCode} (${recipient.category})\n` +
      `📌 *Admission Rule:* ${ticketRule}\n\n` +
      `*Today's Highlights:*\n` +
      day.schedule
        .slice(0, 4)
        .map((s) => `• *${s.time}:* ${s.title}`)
        .join("\n") +
      `\n\n📱 *View Pass on Mobile:* ${passUrl}\n` +
      `📄 *Download 3-Day PDF Schedule:* ${pdfUrl}\n\n` +
      `_Abeokuta Polo Club (Est. 2025) · Under the Royal Patronage of HRM Oba Dr. Michael Aremu Gbadebo CFR_`
    );
  }

  // Weekly Countdown Template
  return (
    `👑 *ABEOKUTA POLO FESTIVAL 2026 COUNTDOWN*\n\n` +
    `Hello ${recipient.name},\n` +
    `This is your official countdown update for the *Abeokuta Polo Festival 2026: The Blueprint* (18–20 Dec 2026).\n\n` +
    `🎫 *Your Registered Pass:* ${recipient.passCode}\n` +
    `🎯 *Attendance Goal:* Joining 2,500 sovereign patrons at Kobape Polo Grounds!\n\n` +
    `*Tournament Quick Summary:*\n` +
    `• *Friday 18 Dec (Day 1):* 100% Free Public Entry · Media Tour, Light-Up & Dinner\n` +
    `• *Saturday 19 Dec (Day 2):* Royal Opening by HRM The Alake of Egbaland · 3 Foundation Layings · Queens Polo · Literary Debate & Sip/Paint (Through Ticket)\n` +
    `• *Sunday 20 Dec (Day 3):* Grand Finale · Royal Cup & Queens Cup · 100 Kings Celebration · Aristos Band & Berryola (Through Ticket)\n\n` +
    `📄 *Official 3-Page PDF Schedule:* ${pdfUrl}\n` +
    `📱 *Access Your Pass:* ${passUrl}\n\n` +
    `Invite friends on WhatsApp: ${festivalUrl}/register`
  );
}

/**
 * Builds direct WhatsApp click-to-chat URL.
 */
export function buildWhatsappClickToChatUrl(recipient: ReminderRecipient, type: "weekly" | "daily", dayNumber?: 1 | 2 | 3): string {
  const text = buildWhatsappReminderMessage(recipient, type, dayNumber);
  const cleanPhone = recipient.phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds rich HTML weekly countdown reminder email.
 */
export function buildWeeklyEmailHtml(recipient: ReminderRecipient): string {
  const passUrl = `https://abeokuta-polo-festival-2026.vercel.app/pass/${recipient.passCode}`;
  const pdfUrl = `https://abeokuta-polo-festival-2026.vercel.app/api/programme/pdf`;
  const inviteUrl = `https://abeokuta-polo-festival-2026.vercel.app/register`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #111827; background-color: #FAF9F5; border-radius: 16px; border: 1px solid #DCD5C2;">
      <div style="background-color: #062D1D; padding: 24px; border-radius: 12px; text-align: center; color: #FAF9F5;">
        <p style="color: #DFBE75; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 6px 0; font-weight: bold;">Weekly Tournament Brief</p>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Abeokuta Polo Festival 2026</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #DFBE75; font-style: italic;">“The Blueprint: Celebrating Heritage, Empowering Tomorrow”</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #DCD5C2;">18–20 December 2026 · Kobape Grounds, Ogun State</p>
      </div>

      <div style="padding: 24px 0;">
        <p style="font-size: 15px; margin: 0 0 12px 0;">Dear <strong>${recipient.name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #414843;">
          This is your weekly festival countdown reminder. Preparations are in full stride at the Abeokuta Polo Club & Country Resort as we prepare to welcome over 2,500 accredited guests.
        </p>

        <!-- Pass Reference Card -->
        <div style="background-color: #FFFFFF; border: 2px dashed #062D1D; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
          <p style="color: #795910; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0;">Your Registered Gate Pass</p>
          <h2 style="font-size: 26px; color: #062D1D; margin: 4px 0; font-family: monospace; font-weight: 800;">${recipient.passCode}</h2>
          <p style="color: #414843; font-size: 12px; margin: 2px 0 0 0;">Category: <strong>${recipient.category}</strong></p>
          <a href="${passUrl}" style="display: inline-block; margin-top: 10px; background-color: #062D1D; color: #DFBE75; padding: 7px 16px; border-radius: 6px; font-size: 12px; font-weight: bold; text-decoration: none;">
            Open Pass on Mobile →
          </a>
        </div>

        <!-- 3-Page PDF Download Box -->
        <div style="background-color: #062D1D; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center; color: #FAF9F5;">
          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #DFBE75;">📄 Official 3-Page Programme PDF Available</p>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #FAF9F5; opacity: 0.9;">
            Download the official schedule directly to your phone or desktop to preview all chukkas, 3 foundation-layings, debate, sip & paint, and ARISTOS BAND performances.
          </p>
          <a href="${pdfUrl}" style="display: inline-block; background-color: #DFBE75; color: #062D1D; padding: 10px 22px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px;">
            Download Official PDF Schedule
          </a>
        </div>

        <!-- Key Tournament Reminders -->
        <div style="background-color: #F4F4F0; border-radius: 12px; padding: 16px; font-size: 12.5px; color: #414843; margin-bottom: 20px;">
          <strong style="color: #062D1D;">Admission Architecture:</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.55;">
            <li><strong>Day 1 (Fri 18 Dec):</strong> 100% Free Public Admission · Media Tour & Festival Light-Up.</li>
            <li><strong>Day 2 (Sat 19 Dec):</strong> Through Ticket · Royal Opening by HRM Oba Dr. Michael Aremu Gbadebo CFR & Queens Polo Match.</li>
            <li><strong>Day 3 (Sun 20 Dec):</strong> Through Ticket · Royal Cup Final, 100 Kings Celebration, ARISTOS BAND & BERRYOLA.</li>
          </ul>
        </div>

        <!-- Viral Entourage Sharing -->
        <div style="background-color: #ECFDF5; border: 1px solid #6EE7B7; border-radius: 10px; padding: 14px; font-size: 12.5px; color: #065F46; text-align: center;">
          <strong style="font-size: 13px;">🎯 Help Reach Our 2,500 Attendance Goal:</strong><br />
          Invite family, colleagues, and equestrian enthusiasts to secure their free passes:
          <div style="margin-top: 10px;">
            <a href="${inviteUrl}" style="background-color: #065F46; color: #FFFFFF; padding: 8px 16px; border-radius: 6px; font-size: 12px; text-decoration: none; font-weight: bold;">
              Share Registration Link
            </a>
          </div>
        </div>
      </div>

      <div style="text-align: center; font-size: 11px; color: #707973; border-top: 1px solid #DCD5C2; padding-top: 16px;">
        Abeokuta Polo Club & Country Resort · Established in 2025 · Kobape, Ogun State<br />
        To adjust your reminder preferences, manage your card via <a href="${passUrl}" style="color: #062D1D; font-weight: bold;">Pass Dashboard</a>.
      </div>
    </div>
  `;
}

/**
 * Builds rich HTML daily tournament morning alert email.
 */
export function buildDailyEmailHtml(recipient: ReminderRecipient, dayNumber: 1 | 2 | 3): string {
  const day = OFFICIAL_PROGRAMME.find((d) => d.dayNumber === dayNumber) || OFFICIAL_PROGRAMME[0];
  const passUrl = `https://abeokuta-polo-festival-2026.vercel.app/pass/${recipient.passCode}`;
  const pdfUrl = `https://abeokuta-polo-festival-2026.vercel.app/api/programme/pdf`;
  const dateLabel = `${day.dayName}, ${day.dateStr}`;

  const admissionNotice =
    day.admission === "100% Free Entry"
      ? `<div style="background-color: #ECFDF5; border: 1px solid #10B981; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #065F46; font-size: 13px;">
          <strong>✅ DAY 1 IS 100% FREE PUBLIC ADMISSION:</strong> All registered members of the public are warmly invited! Show your digital pass code <strong>${recipient.passCode}</strong> at the gate.
        </div>`
      : `<div style="background-color: #FFFBEB; border: 1px solid #F59E0B; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #92400E; font-size: 13px;">
          <strong>🎟️ DAY ${dayNumber} ADMISSION IS THROUGH TICKET:</strong> Please ensure your ticket credentials or VIP reservation confirmation is ready alongside your pass code <strong>${recipient.passCode}</strong>.
        </div>`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #111827; background-color: #FAF9F5; border-radius: 16px; border: 1px solid #DCD5C2;">
      <div style="background-color: #062D1D; padding: 24px; border-radius: 12px; text-align: center; color: #FAF9F5;">
        <p style="color: #DFBE75; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 6px 0; font-weight: bold;">Official Tournament Day Alert</p>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Day ${day.dayNumber}: ${day.theme}</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #DFBE75; font-weight: 600;">${dateLabel} · Abeokuta Polo Club, Kobape</p>
      </div>

      <div style="padding: 24px 0;">
        <p style="font-size: 15px; margin: 0 0 12px 0;">Good morning <strong>${recipient.name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #414843;">
          Welcome to Day ${day.dayNumber} of the <strong>Abeokuta Polo Festival 2026: The Blueprint</strong>! Here are today's scheduled proceedings and gate entry details:
        </p>

        ${admissionNotice}

        <!-- Pass Credentials Box -->
        <div style="background-color: #FFFFFF; border: 2px dashed #062D1D; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
          <p style="color: #795910; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0;">Your Gate Credentials</p>
          <h2 style="font-size: 28px; color: #062D1D; margin: 4px 0; font-family: monospace; font-weight: 800;">${recipient.passCode}</h2>
          <p style="color: #414843; font-size: 12px; margin: 2px 0 0 0;">Holder: <strong>${recipient.name}</strong> (${recipient.category})</p>
          <div style="margin-top: 12px;">
            <a href="${passUrl}" style="background-color: #062D1D; color: #DFBE75; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: bold; text-decoration: none;">
              Show Gate Pass on Phone
            </a>
          </div>
        </div>

        <!-- Today's Schedule -->
        <div style="background-color: #F4F4F0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <strong style="color: #062D1D; font-size: 13px;">Today's Official Timetable:</strong>
          <div style="margin-top: 10px; font-size: 12.5px; color: #414843;">
            ${day.schedule
              .map(
                (item) => `
              <div style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="font-weight: bold; color: #062D1D;">${item.time}</span> — <strong>${item.title}</strong><br />
                <span style="font-size: 11.5px; color: #6B7280;">${item.items.join("; ")}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${pdfUrl}" style="background-color: #DFBE75; color: #062D1D; padding: 10px 20px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px;">
            📄 Download Full 3-Day PDF Programme
          </a>
        </div>
      </div>

      <div style="text-align: center; font-size: 11px; color: #707973; border-top: 1px solid #DCD5C2; padding-top: 16px;">
        Abeokuta Polo Club & Country Resort · Kobape Expressway, Abeokuta, Ogun State<br />
        Gate Enquiries & VIP Helpdesk: +234 818 188 8884 · Established in 2025
      </div>
    </div>
  `;
}

/**
 * Dispatches reminders to a list of recipients via Email and generates WhatsApp payloads.
 */
export async function dispatchRemindersBatch(
  recipients: ReminderRecipient[],
  type: "weekly" | "daily",
  dayNumber?: 1 | 2 | 3,
): Promise<ReminderDispatchResult> {
  let emailsSent = 0;
  let emailsFailed = 0;
  let whatsappQueued = 0;
  const logs: string[] = [];

  for (const r of recipients) {
    // 1. Email Dispatch
    try {
      const subject =
        type === "daily" && dayNumber
          ? `[TODAY] Day ${dayNumber} Brief: Abeokuta Polo Festival (${r.passCode})`
          : `[Countdown] Your Weekly Update: Abeokuta Polo Festival 2026 (${r.passCode})`;

      const html =
        type === "daily" && dayNumber
          ? buildDailyEmailHtml(r, dayNumber)
          : buildWeeklyEmailHtml(r);

      const emailResult = await sendEmail({
        to: r.email,
        subject,
        html,
      });

      if (emailResult.success) {
        emailsSent++;
        logs.push(`Email sent to ${r.email} (${r.passCode})`);
      } else {
        emailsFailed++;
        logs.push(`Email skipped/failed for ${r.email}: ${emailResult.error}`);
      }
    } catch (err) {
      emailsFailed++;
      logs.push(`Email exception for ${r.email}: ${String(err)}`);
    }

    // 2. WhatsApp payload queued/logged
    whatsappQueued++;
    logs.push(`WhatsApp reminder queued for ${r.phone} (${r.name})`);
  }

  return {
    totalProcessed: recipients.length,
    emailsSent,
    emailsFailed,
    whatsappQueued,
    logs,
  };
}
