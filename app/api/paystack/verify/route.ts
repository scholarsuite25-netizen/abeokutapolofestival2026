import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const requestedQty = parseInt(searchParams.get("quantity") || searchParams.get("qty") || "1", 10) || 1;

    if (!reference) {
      return NextResponse.json({ error: "Reference is required." }, { status: 400 });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (paystackSecret) {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      });

      const data = await response.json();
      if (data.status && data.data?.status === "success") {
        const paidAmount = data.data.amount / 100;
        const verifiedQty = Math.max(1, Math.round(paidAmount / 50000));
        return NextResponse.json({
          verified: true,
          reference,
          amount: paidAmount,
          quantity: verifiedQty,
          customer: data.data.customer,
        });
      }

      return NextResponse.json({
        verified: false,
        error: data.message || "Payment verification failed",
      });
    }

    // Local development or simulated sandbox payment
    const totalAmount = requestedQty * 50000;
    return NextResponse.json({
      verified: true,
      reference,
      amount: totalAmount,
      quantity: requestedQty,
      simulated: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment verification error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
