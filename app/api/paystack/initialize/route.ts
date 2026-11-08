import { NextResponse } from "next/server";
import { z } from "zod";
import {
  DAY3_REFERENCE_PREFIX,
  DAY3_VVIP_MAX_TICKETS,
  DAY3_VVIP_PRICE_NGN,
} from "@/lib/config/checkout-config";

const attendeeSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

const bodySchema = z.object({
  email: z.string().trim().email("A valid email is required."),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  day1: z.boolean().optional(),
  day2: z.boolean().optional(),
  quantity: z.coerce.number().int().min(1).max(DAY3_VVIP_MAX_TICKETS).default(1),
  attendees: z.array(attendeeSchema).optional(),
  affiliateCode: z.string().trim().optional(),
});

function newReference(simulatedQuantity?: number): string {
  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return simulatedQuantity
    ? `${DAY3_REFERENCE_PREFIX}SIM-${simulatedQuantity}-${suffix}`
    : `${DAY3_REFERENCE_PREFIX}${suffix}`;
}

/**
 * Starts a Day 3 VVIP checkout. The price and quantity are fixed here, on the
 * server. Nothing returned from this route is proof of payment — the registration
 * action verifies the reference with Paystack before issuing any pass.
 */
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { email, firstName, lastName, phone, day1, day2, quantity, attendees, affiliateCode } = parsed.data;
  const amountNgn = quantity * DAY3_VVIP_PRICE_NGN;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const secret = process.env.PAYSTACK_SECRET_KEY;

  // The return URL only carries the registrant's form details. Paystack appends
  // `reference` itself; the server re-verifies it, so nothing here can grant a pass.
  const callback = new URL("/register", origin);
  callback.searchParams.set("day1", day1 ? "1" : "0");
  callback.searchParams.set("day2", day2 ? "1" : "0");
  callback.searchParams.set("fn", firstName ?? "");
  callback.searchParams.set("ln", lastName ?? "");
  callback.searchParams.set("em", email);
  callback.searchParams.set("ph", phone ?? "");
  callback.searchParams.set("qty", String(quantity));
  if (affiliateCode) {
    callback.searchParams.set("ref", affiliateCode);
  }
  if (attendees && attendees.length > 0) {
    callback.searchParams.set("attendees", JSON.stringify(attendees));
  }

  if (!secret) {
    const isDemo = process.env.NODE_ENV !== "production" || process.env.PAYSTACK_DEMO_MODE === "true";
    if (!isDemo) {
      return NextResponse.json(
        { error: "Online payment is not available right now. Please contact the festival office." },
        { status: 503 },
      );
    }
    const reference = newReference(quantity);
    callback.searchParams.set("payment_ref", reference);
    return NextResponse.json({
      status: "success",
      authorization_url: callback.toString(),
      reference,
      amount: amountNgn,
      quantity,
      simulated: true,
      message: "Demo mode: payment simulated (PAYSTACK_DEMO_MODE active).",
    });
  }

  const reference = newReference();
  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountNgn * 100,
        currency: "NGN",
        reference,
        callback_url: callback.toString(),
        metadata: {
          custom_fields: [
            { display_name: "Event", variable_name: "event", value: "Abeokuta Polo Festival 2026" },
            { display_name: "Pass Type", variable_name: "pass_type", value: "Day 3 VVIP Grand Finale" },
            { display_name: "Ticket Quantity", variable_name: "ticket_quantity", value: String(quantity) },
            ...(affiliateCode
              ? [{ display_name: "Affiliate Referral", variable_name: "affiliate_code", value: affiliateCode }]
              : []),
            ...(attendees && attendees.length > 0
              ? [{ display_name: "Attendees", variable_name: "attendees", value: JSON.stringify(attendees) }]
              : []),
          ],
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data?.status && data.data?.authorization_url) {
      return NextResponse.json({
        status: "success",
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference,
        amount: amountNgn,
        quantity,
        simulated: false,
      });
    }

    // A Paystack failure is a failure — it must never fall back to a fake success.
    return NextResponse.json(
      { error: "Could not start payment with Paystack. Please try again." },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach Paystack. Please try again." },
      { status: 502 },
    );
  }
}
