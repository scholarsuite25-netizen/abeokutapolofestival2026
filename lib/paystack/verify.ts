import "server-only";
import {
  DAY3_REFERENCE_PREFIX,
  DAY3_VVIP_MAX_TICKETS,
  DAY3_VVIP_PRICE_NGN,
} from "@/lib/config/checkout-config";

/**
 * Server-side Paystack verification for Day 3 VVIP payments.
 *
 * A payment counts only when ALL of these hold:
 *  1. the reference was created by our own checkout (DAY3_REFERENCE_PREFIX);
 *  2. Paystack reports the transaction as `success` for exactly that reference;
 *  3. the currency is NGN and the amount covers at least one VVIP pass;
 *  4. the Paystack customer email matches the registrant's email.
 *
 * Every failure (including network errors and a missing secret key) is a refusal.
 * Simulated payments exist only outside production and only when no
 * PAYSTACK_SECRET_KEY is set.
 */

const PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify/";
const REFERENCE_PATTERN = /^[A-Za-z0-9._=-]{6,100}$/;
const SIMULATED_PATTERN = /^ABK-VVIP-SIM-(\d{1,2})-/;

export type PaymentFailureReason =
  | "invalid_reference"
  | "not_configured"
  | "not_found"
  | "not_successful"
  | "wrong_currency"
  | "amount_too_low"
  | "email_mismatch"
  | "gateway_error";

export type PaymentVerification =
  | {
      ok: true;
      reference: string;
      amountNgn: number;
      quantity: number;
      simulated: boolean;
    }
  | { ok: false; reason: PaymentFailureReason; message: string };

const MESSAGES: Record<PaymentFailureReason, string> = {
  invalid_reference: "That payment reference is not valid.",
  not_configured: "Online payment is not available right now. Please contact the festival office.",
  not_found: "We could not find that payment. Please check the reference and try again.",
  not_successful: "That payment has not been completed.",
  wrong_currency: "That payment was not made in naira (NGN).",
  amount_too_low: "That payment does not cover a Day 3 VVIP pass.",
  email_mismatch: "Please register with the same email address you used to pay.",
  gateway_error: "We could not confirm your payment with Paystack. Please try again shortly.",
};

function fail(reason: PaymentFailureReason): PaymentVerification {
  return { ok: false, reason, message: MESSAGES[reason] };
}

/** Simulated payments are allowed only outside production and only without a live key. */
export function isSimulationAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && !process.env.PAYSTACK_SECRET_KEY;
}

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

interface PaystackVerifyBody {
  status?: boolean;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    customer?: { email?: string } | null;
  } | null;
}

export async function verifyDay3Payment(
  referenceInput: string | null | undefined,
  options: { expectedEmail?: string } = {},
): Promise<PaymentVerification> {
  const reference = (referenceInput ?? "").trim();
  if (!REFERENCE_PATTERN.test(reference) || !reference.startsWith(DAY3_REFERENCE_PREFIX)) {
    return fail("invalid_reference");
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    if (!isSimulationAllowed()) return fail("not_configured");
    const match = SIMULATED_PATTERN.exec(reference);
    if (!match) return fail("invalid_reference");
    const quantity = Math.min(DAY3_VVIP_MAX_TICKETS, Math.max(1, Number(match[1])));
    return {
      ok: true,
      reference,
      amountNgn: quantity * DAY3_VVIP_PRICE_NGN,
      quantity,
      simulated: true,
    };
  }

  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_VERIFY_URL}${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return fail("gateway_error");
  }

  if (response.status === 404) return fail("not_found");
  if (!response.ok) return fail("gateway_error");

  const body = (await response.json().catch(() => null)) as PaystackVerifyBody | null;
  const data = body?.data;
  if (!body?.status || !data) return fail("not_found");
  if (data.status !== "success") return fail("not_successful");
  if (data.reference !== reference) return fail("invalid_reference");
  if (data.currency !== "NGN") return fail("wrong_currency");

  const amountKobo = Number(data.amount);
  if (!Number.isFinite(amountKobo) || amountKobo <= 0) return fail("amount_too_low");
  const quantity = Math.floor(amountKobo / (DAY3_VVIP_PRICE_NGN * 100));
  if (quantity < 1) return fail("amount_too_low");

  if (options.expectedEmail) {
    const paidBy = data.customer?.email?.trim().toLowerCase();
    if (!paidBy || paidBy !== options.expectedEmail.trim().toLowerCase()) {
      return fail("email_mismatch");
    }
  }

  return {
    ok: true,
    reference,
    amountNgn: amountKobo / 100,
    quantity: Math.min(quantity, DAY3_VVIP_MAX_TICKETS),
    simulated: false,
  };
}
