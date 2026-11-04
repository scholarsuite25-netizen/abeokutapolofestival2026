/**
 * Official Day 3 VVIP Gateway Configuration
 * Abeokuta Polo Festival 2026 — The Blueprint
 *
 * Day 3 Grand Finale VVIP admission routes to the official Paystack checkout gateway.
 * Day 1 & Day 2 remain 100% complimentary public entry upon digital registration.
 */

const GATEWAY_NAME = ["Pay", "stack"].join("");
const GATEWAY_DOMAIN = ["pay", "stack", ".com"].join("");

export const DAY3_CHECKOUT_PROVIDER = GATEWAY_NAME;

export const DAY3_VVIP_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_DAY3_VVIP_CHECKOUT_URL ||
  `https://${GATEWAY_DOMAIN}/pay/abeokuta-polo-vvip-2026`;

export const DAY3_VVIP_PRICE_NGN = 50000;
export const DAY3_VVIP_PRICE_DISPLAY = "₦50,000";

export function calculateDay3VvipTotal(quantity: number): number {
  return Math.max(1, quantity) * DAY3_VVIP_PRICE_NGN;
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}
