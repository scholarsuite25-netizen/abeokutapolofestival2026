import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, phone, day1, day2, quantity, demo } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const ticketCount = Math.max(1, Math.min(20, parseInt(String(quantity || 1), 10) || 1));
    const pricePerTicket = 50000;
    const amountNgn = ticketCount * pricePerTicket;
    const amountInKobo = amountNgn * 100;

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const reference = `ABK-VVIP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // If live Paystack secret exists and demo mode is not forced
    if (paystackSecret && !demo) {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          reference,
          callback_url: `${origin}/register?payment_ref=${reference}&day1=${day1 ? "1" : "0"}&day2=${day2 ? "1" : "0"}&day3=1&qty=${ticketCount}&fn=${encodeURIComponent(firstName || "")}&ln=${encodeURIComponent(lastName || "")}&em=${encodeURIComponent(email)}&ph=${encodeURIComponent(phone || "")}`,
          metadata: {
            custom_fields: [
              { display_name: "Event", variable_name: "event", value: "Abeokuta Polo Festival 2026" },
              { display_name: "Pass Type", variable_name: "pass_type", value: "Day 3 VVIP Grand Finale" },
              { display_name: "Ticket Quantity", variable_name: "ticket_quantity", value: String(ticketCount) },
              { display_name: "Total Amount NGN", variable_name: "total_amount", value: `₦${amountNgn.toLocaleString("en-NG")}` },
              { display_name: "First Name", variable_name: "first_name", value: firstName },
              { display_name: "Last Name", variable_name: "last_name", value: lastName },
            ],
          },
        }),
      });

      const data = await response.json();
      if (data.status && data.data?.authorization_url) {
        return NextResponse.json({
          status: "success",
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference,
          amount: amountNgn,
          quantity: ticketCount,
          simulated: false,
        });
      }
    }

    // Demo/Simulated payment gateway pending live Paystack keys
    const fallbackUrl = `${origin}/register?payment_ref=${reference}&status=success&paid=true&day1=${day1 ? "1" : "0"}&day2=${day2 ? "1" : "0"}&day3=1&qty=${ticketCount}&fn=${encodeURIComponent(firstName || "")}&ln=${encodeURIComponent(lastName || "")}&em=${encodeURIComponent(email)}&ph=${encodeURIComponent(phone || "")}`;

    return NextResponse.json({
      status: "success",
      authorization_url: fallbackUrl,
      reference,
      amount: amountNgn,
      quantity: ticketCount,
      simulated: true,
      message: "Paystack Demo Mode: payment simulated successfully pending live API keys.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment initialization error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
