/**
 * WhatsApp Phone Validation, Normalization and Deep-Link Utility
 * Supports Nigerian local (080..., 070..., 090..., 081..., 091...),
 * Nigerian international (+234..., 234...), and global international numbers.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // Pure digits without '+', e.g. "2348031234567" for wa.me
  formatted: string;  // Human-readable format, e.g. "+234 803 123 4567"
  error?: string;
}

/**
 * Validates and normalizes an input phone string strictly for WhatsApp messaging.
 */
export function validateWhatsAppPhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== "string") {
    return {
      isValid: false,
      normalized: "",
      formatted: "",
      error: "WhatsApp phone number is required.",
    };
  }

  const raw = input.trim();
  if (!raw) {
    return {
      isValid: false,
      normalized: "",
      formatted: "",
      error: "WhatsApp phone number is required.",
    };
  }

  // Remove common spacing and punctuation characters: spaces, hyphens, parens, dots
  const stripped = raw.replace(/[\s\-\(\)\.]/g, "");

  // Must only contain digits or a leading '+'
  if (!/^\+?[0-9]+$/.test(stripped)) {
    return {
      isValid: false,
      normalized: "",
      formatted: raw,
      error: "Phone number contains invalid characters. Enter numbers only.",
    };
  }

  const digits = stripped.startsWith("+") ? stripped.substring(1) : stripped;

  // 1. Nigerian Local format: e.g. 08031234567 (11 digits starting with 0)
  if (digits.startsWith("0")) {
    if (digits.length === 11) {
      // 0 followed by 10 digits (e.g., 070, 080, 081, 090, 091)
      const national = digits.substring(1);
      const normalized = `234${national}`;
      const formatted = `+234 ${national.substring(0, 3)} ${national.substring(3, 6)} ${national.substring(6)}`;
      return { isValid: true, normalized, formatted };
    }
    return {
      isValid: false,
      normalized: "",
      formatted: raw,
      error: "Nigerian mobile number starting with 0 must have exactly 11 digits (e.g. 0803 123 4567).",
    };
  }

  // 2. Nigerian International format with 234: e.g. +2348031234567 or 2348031234567
  if (digits.startsWith("234")) {
    let national = digits.substring(3);
    // Remove accidental leading zero e.g. +23408031234567 -> 2348031234567
    if (national.startsWith("0")) {
      national = national.substring(1);
    }
    if (national.length === 10) {
      const normalized = `234${national}`;
      const formatted = `+234 ${national.substring(0, 3)} ${national.substring(3, 6)} ${national.substring(6)}`;
      return { isValid: true, normalized, formatted };
    }
    return {
      isValid: false,
      normalized: "",
      formatted: raw,
      error: "Nigerian international number must contain 10 subscriber digits after +234 (e.g. +234 803 123 4567).",
    };
  }

  // 3. Nigerian local without leading 0: 10 digits starting with 7, 8, or 9
  if (digits.length === 10 && /^[789]/.test(digits)) {
    const normalized = `234${digits}`;
    const formatted = `+234 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
    return { isValid: true, normalized, formatted };
  }

  // 4. Global International formats (E.164): Total digits between 8 and 15
  if (stripped.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return {
      isValid: true,
      normalized: digits,
      formatted: `+${digits}`,
    };
  }

  // Non-prefixed numbers between 8 and 15 digits
  if (digits.length >= 8 && digits.length <= 15) {
    return {
      isValid: true,
      normalized: digits,
      formatted: `+${digits}`,
    };
  }

  return {
    isValid: false,
    normalized: "",
    formatted: raw,
    error: "Please enter a valid WhatsApp phone number (e.g. 0803 123 4567 or +234 803 123 4567).",
  };
}

/**
 * Builds direct WhatsApp click-to-chat URL using a validated, normalized phone number.
 */
export function formatWhatsAppUrl(phone: string, message: string): string {
  const result = validateWhatsAppPhone(phone);
  const cleanPhone = result.isValid ? result.normalized : phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates the attendee's personal WhatsApp Ticket Delivery Card message.
 */
export function buildAttendeePassWhatsAppMessage(params: {
  holderName: string;
  phone: string;
  passCode: string;
  category?: string;
  passUrl: string;
  isMultiple?: boolean;
  totalPasses?: number;
}): string {
  const { holderName, passCode, category, passUrl, isMultiple, totalPasses } = params;

  if (isMultiple && totalPasses && totalPasses > 1) {
    return (
      `🏇 *ABEOKUTA POLO FESTIVAL 2026 — OFFICIAL PASS DISPATCH*\n\n` +
      `Hello *${holderName}*,\n\n` +
      `Your registration for the *2026 Abeokuta Polo Festival: The Blueprint* (18–20 Dec 2026) has been confirmed!\n\n` +
      `🎫 *Primary Pass Code:* ${passCode}\n` +
      `🎟️ *Total Passes Issued:* ${totalPasses} Digital Turnstile Badges\n` +
      `🏷️ *Category:* ${category || "Festival Pass"}\n` +
      `📍 *Venue:* Abeokuta Polo Club & Country Resort, Kobape Expressway\n\n` +
      `👉 *Click here to open and save your passes directly in your phone:* \n${passUrl}\n\n` +
      `🛡️ *Gate Instructions:* Keep this message pinned in your WhatsApp. Present the digital QR badge at the security turnstiles for fast, contactless gate clearance.\n\n` +
      `_Abeokuta Polo Club · Under Royal Patronage of HRM Oba Dr. Michael Aremu Gbadebo CFR_`
    );
  }

  return (
    `🏇 *ABEOKUTA POLO FESTIVAL 2026 — OFFICIAL GATE PASS*\n\n` +
    `Hello *${holderName}*,\n\n` +
    `Your official accreditation pass for the *2026 Abeokuta Polo Festival: The Blueprint* (18–20 Dec 2026) is ready!\n\n` +
    `🔑 *Pass Code:* ${passCode}\n` +
    `👤 *Pass Holder:* ${holderName}\n` +
    `🏷️ *Admission Tier:* ${category || "Festival Pass"}\n` +
    `📍 *Venue:* Abeokuta Polo Club & Country Resort, Kobape Expressway\n\n` +
    `👉 *Click here to open and save your digital gate pass:* \n${passUrl}\n\n` +
    `🛡️ *Turnstile Entry:* Show this pass on your phone screen upon arrival at the gate turnstile for instant scanning.\n\n` +
    `_Abeokuta Polo Club (Est. 2025) · Under the Royal Patronage of HRM Oba Dr. Michael Aremu Gbadebo CFR_`
  );
}
