import { describe, it, expect } from "vitest";
import {
  buildWhatsappReminderMessage,
  buildWhatsappClickToChatUrl,
  buildWeeklyEmailHtml,
  buildDailyEmailHtml,
  dispatchRemindersBatch,
  ReminderRecipient,
} from "@/lib/reminders/engine";

describe("Reminders & 2,500 Attendance Engine", () => {
  const mockRecipient: ReminderRecipient = {
    name: "Dr. Babatunde Adeleke",
    email: "adeleke@example.com",
    phone: "+2348030001234",
    passCode: "ABK-2026-X7K9",
    category: "Individual Attendee",
    cadence: "weekly_and_daily",
  };

  it("builds a high-impact weekly WhatsApp message with PDF download & pass code", () => {
    const msg = buildWhatsappReminderMessage(mockRecipient, "weekly");
    expect(msg).toContain("ABEOKUTA POLO FESTIVAL 2026 COUNTDOWN");
    expect(msg).toContain(mockRecipient.passCode);
    expect(msg).toContain("2,500");
    expect(msg).toContain("/api/programme/pdf");
    expect(msg).toContain("100% Free Public Entry");
  });

  it("builds daily tournament morning WhatsApp alert for Day 1 (Free Entry)", () => {
    const msg = buildWhatsappReminderMessage(mockRecipient, "daily", 1);
    expect(msg).toContain("MEDIA, TOUR & FESTIVAL LIGHT-UP");
    expect(msg).toContain("100% FREE PUBLIC ADMISSION");
    expect(msg).toContain(mockRecipient.passCode);
  });

  it("builds daily tournament morning WhatsApp alert for Day 2 (Through Ticket)", () => {
    const msg = buildWhatsappReminderMessage(mockRecipient, "daily", 2);
    expect(msg).toContain("ROYAL OPENING, CULTURAL HERITAGE & POLO");
    expect(msg).toContain("ADMISSION IS THROUGH TICKET");
  });

  it("creates a properly encoded WhatsApp click-to-chat URL", () => {
    const url = buildWhatsappClickToChatUrl(mockRecipient, "weekly");
    expect(url).toMatch(/^https:\/\/wa\.me\/2348030001234\?text=/);
    expect(url).toContain(encodeURIComponent("ABK-2026-X7K9"));
  });

  it("generates rich HTML weekly countdown email with pass code and PDF link", () => {
    const html = buildWeeklyEmailHtml(mockRecipient);
    expect(html).toContain("ABK-2026-X7K9");
    expect(html).toContain("Official 3-Page Programme PDF Available");
    expect(html).toContain("/api/programme/pdf");
    expect(html).toContain("2,500 Attendance Goal");
    expect(html).toContain("Established in 2025");
  });

  it("generates rich HTML daily alert email with schedule breakdown", () => {
    const htmlDay1 = buildDailyEmailHtml(mockRecipient, 1);
    expect(htmlDay1).toContain("DAY 1 IS 100% FREE PUBLIC ADMISSION");
    expect(htmlDay1).toContain("ABK-2026-X7K9");

    const htmlDay2 = buildDailyEmailHtml(mockRecipient, 2);
    expect(htmlDay2).toContain("DAY 2 ADMISSION IS THROUGH TICKET");
  });

  it("dispatches reminders batch gracefully and logs operations", async () => {
    const result = await dispatchRemindersBatch([mockRecipient], "weekly");
    expect(result.totalProcessed).toBe(1);
    expect(result.whatsappQueued).toBe(1);
    expect(result.logs.length).toBeGreaterThan(0);
  });
});
