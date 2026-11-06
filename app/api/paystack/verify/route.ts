import { NextResponse } from "next/server";
import { verifyDay3Payment } from "@/lib/paystack/verify";

/**
 * Read-only payment status check. It never issues passes and never claims the
 * reference — pass issuance happens only in `submitRegistration`. Amount and
 * quantity come from Paystack, never from the query string.
 */
export async function GET(req: Request) {
  const reference = new URL(req.url).searchParams.get("reference")?.trim();
  if (!reference) {
    return NextResponse.json({ error: "Reference is required." }, { status: 400 });
  }

  const result = await verifyDay3Payment(reference);
  if (!result.ok) {
    const status = result.reason === "gateway_error" || result.reason === "not_configured" ? 503 : 200;
    return NextResponse.json({ verified: false, error: result.message }, { status });
  }

  return NextResponse.json({
    verified: true,
    reference: result.reference,
    amount: result.amountNgn,
    quantity: result.quantity,
    simulated: result.simulated,
  });
}
