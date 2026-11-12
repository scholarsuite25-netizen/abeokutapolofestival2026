/**
 * Day 3 VVIP checkout configuration — single source of truth for price and limits.
 * Abeokuta Polo Festival 2026 — The Blueprint
 *
 * Day 1 and Day 2 are complimentary upon registration. Day 3 Grand Finale VVIP
 * admission is paid through Paystack (or granted by a Special Invitation Code).
 *
 * Server code (`lib/paystack/*`, `app/api/paystack/*`, `submitRegistration`) MUST
 * derive price, quantity and reference rules from this file. Never trust a price,
 * quantity or "paid" flag that arrives from the browser.
 *
 * PRICING POLICY — the ₦100 pilot testing fee has been PERMANENTLY CONCLUDED.
 * Official brochure prices are the only active pricing model:
 *   - The Kings Table: ₦5,000,000 (10 Guests)
 *   - The Royal Table: ₦3,000,000 (8 Guests)
 *   - The Queens Table: ₦2,000,000 (6 Guests)
 *   - The Premium Table: ₦500,000 (5 Guests)
 *   - The Regular Section: ₦50,000 Per Person (1 Guest)
 * There is no toggle, no test-price constant and no client-supplied fee flag:
 * pricing is decided on the server and cannot be lowered by a browser payload.
 */

export const DAY3_CHECKOUT_PROVIDER = "Paystack";

/** Official prestige price for Day 3 individual VVIP pass */
export const DAY3_VVIP_OFFICIAL_PRICE_NGN = 50_000;
export const DAY3_VVIP_OFFICIAL_PRICE_DISPLAY = "₦50,000";

/** Price of one Day 3 VVIP pass (₦50,000) */
export const DAY3_VVIP_PRICE_NGN = 50_000;
export const DAY3_VVIP_PRICE_DISPLAY = "₦50,000";

/** Most Day 3 VVIP passes one payment can cover. */
export const DAY3_VVIP_MAX_TICKETS = 20;

/** Most Day 3 VVIP passes one Special Invitation Code can issue. */
export const DAY3_INVITATION_MAX_TICKETS = 1;

/**
 * Official Abeokuta Polo Club Bank Account for Direct Wire Transfers.
 * Primary payment channel for table and pass reservations.
 */
export const CLUB_BANK_DETAILS = {
  bankName: "WEMA BANK",
  accountName: "ABEOKUTA POLO CLUB",
  accountNumber: "0126769779",
  feePerTicketNgn: 50_000,
  secretariatWhatsApp: "2348181888884",
  secretariatPhoneFormatted: "+234 818 188 8884",
  referencePrefix: "ABK-WEMA-",
} as const;

/**
 * Generates a distinct reference code e.g. ABK-WEMA-4B1C for bank transfer narration.
 */
export function generateWemaTransferReference(): string {
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `${CLUB_BANK_DETAILS.referencePrefix}${hex}`;
}

/**
 * Every Paystack reference created by `/api/paystack/initialize` starts with this
 * prefix. Verification rejects any other reference, so an unrelated transaction on
 * the same Paystack account (for example a sponsorship payment) cannot be reused
 * to obtain a pass.
 */
export const DAY3_REFERENCE_PREFIX = "ABK-VVIP-";

export function calculateDay3VvipTotal(quantity: number): number {
  return Math.max(1, quantity) * DAY3_VVIP_PRICE_NGN;
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}
