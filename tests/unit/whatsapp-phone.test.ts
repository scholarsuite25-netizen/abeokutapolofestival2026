import { describe, it, expect } from "vitest";
import {
  validateWhatsAppPhone,
  formatWhatsAppUrl,
  buildAttendeePassWhatsAppMessage,
} from "@/lib/utils/phone";

describe("WhatsApp Phone Normalization & Validation Utility", () => {
  it("normalizes standard Nigerian local numbers (08031234567)", () => {
    const res = validateWhatsAppPhone("08031234567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("2348031234567");
    expect(res.formatted).toBe("+234 803 123 4567");
  });

  it("normalizes spaced and dashed Nigerian numbers (0803 123 4567 / 0803-123-4567)", () => {
    const spaced = validateWhatsAppPhone("0803 123 4567");
    expect(spaced.isValid).toBe(true);
    expect(spaced.normalized).toBe("2348031234567");

    const dashed = validateWhatsAppPhone("0803-123-4567");
    expect(dashed.isValid).toBe(true);
    expect(dashed.normalized).toBe("2348031234567");
  });

  it("normalizes other Nigerian network prefixes (070, 090, 081, 091)", () => {
    expect(validateWhatsAppPhone("07031234567").normalized).toBe("2347031234567");
    expect(validateWhatsAppPhone("09081234567").normalized).toBe("2349081234567");
    expect(validateWhatsAppPhone("08121234567").normalized).toBe("2348121234567");
    expect(validateWhatsAppPhone("09151234567").normalized).toBe("2349151234567");
  });

  it("normalizes international Nigerian numbers (+234 803 123 4567 / +2348031234567)", () => {
    const res = validateWhatsAppPhone("+234 803 123 4567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("2348031234567");

    const res2 = validateWhatsAppPhone("2348031234567");
    expect(res2.isValid).toBe(true);
    expect(res2.normalized).toBe("2348031234567");
  });

  it("handles accidental redundant 0 after +234 (+23408031234567)", () => {
    const res = validateWhatsAppPhone("+23408031234567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("2348031234567");
  });

  it("handles 10-digit Nigerian mobile without leading zero (8031234567)", () => {
    const res = validateWhatsAppPhone("8031234567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("2348031234567");
  });

  it("handles global international phone numbers (e.g. UK +44, US +1)", () => {
    const uk = validateWhatsAppPhone("+44 7911 123456");
    expect(uk.isValid).toBe(true);
    expect(uk.normalized).toBe("447911123456");

    const us = validateWhatsAppPhone("+1 (555) 234-5678");
    expect(us.isValid).toBe(true);
    expect(us.normalized).toBe("15552345678");
  });

  it("rejects invalid inputs", () => {
    expect(validateWhatsAppPhone("").isValid).toBe(false);
    expect(validateWhatsAppPhone("123").isValid).toBe(false);
    expect(validateWhatsAppPhone("08012").isValid).toBe(false);
    expect(validateWhatsAppPhone("invalid-phone").isValid).toBe(false);
    expect(validateWhatsAppPhone("+234803").isValid).toBe(false);
  });

  it("generates correct wa.me link with encoded message", () => {
    const link = formatWhatsAppUrl("0803 123 4567", "Hello Abeokuta Polo 2026!");
    expect(link).toBe("https://wa.me/2348031234567?text=Hello%20Abeokuta%20Polo%202026!");
  });

  it("builds personalized attendee pass WhatsApp message with turnstile instructions", () => {
    const message = buildAttendeePassWhatsAppMessage({
      holderName: "Prince Adebayo",
      phone: "+234 803 123 4567",
      passCode: "ABK-2026-X7K9",
      category: "Day 3 VVIP Royal Cup Grand Finale",
      passUrl: "https://abeokuta-polo-festival-2026.vercel.app/pass/ABK-2026-X7K9",
    });

    expect(message).toContain("ABEOKUTA POLO FESTIVAL 2026");
    expect(message).toContain("Prince Adebayo");
    expect(message).toContain("ABK-2026-X7K9");
    expect(message).toContain("https://abeokuta-polo-festival-2026.vercel.app/pass/ABK-2026-X7K9");
    expect(message).toContain("Turnstile Entry");
  });
});
