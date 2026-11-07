import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Single-use guard for verified Paystack references.
 *
 * A reference can be turned into passes exactly once. In production the claim is
 * a row in `day3_payment_claims` (primary key = reference), so concurrent or
 * repeated attempts hit a unique violation. Without Supabase (local development
 * only) an in-memory set is used; in production that case refuses the claim.
 */

export type ClaimResult =
  | { ok: true }
  | { ok: false; reason: "already_used" | "unavailable"; message: string };

const memoryClaims = new Set<string>();

const ALREADY_USED = "That payment has already been used to issue passes.";
const UNAVAILABLE = "We could not record your payment right now. Please try again shortly.";

export async function claimPaymentReference(input: {
  reference: string;
  email: string;
  amountNgn: number;
  quantity: number;
}): Promise<ClaimResult> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production" && process.env.PAYSTACK_DEMO_MODE !== "true") {
      return { ok: false, reason: "unavailable", message: UNAVAILABLE };
    }
    if (memoryClaims.has(input.reference)) {
      return { ok: false, reason: "already_used", message: ALREADY_USED };
    }
    memoryClaims.add(input.reference);
    return { ok: true };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("day3_payment_claims").insert({
      reference: input.reference,
      email: input.email,
      amount_ngn: input.amountNgn,
      quantity: input.quantity,
    });
    if (!error) return { ok: true };
    if (error.code === "23505") {
      return { ok: false, reason: "already_used", message: ALREADY_USED };
    }
    return { ok: false, reason: "unavailable", message: UNAVAILABLE };
  } catch {
    return { ok: false, reason: "unavailable", message: UNAVAILABLE };
  }
}

/** Best-effort link from a claimed payment to the registration it produced. */
export async function attachClaimToRegistration(
  reference: string,
  registrationId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createAdminClient();
    await supabase
      .from("day3_payment_claims")
      .update({ registration_id: registrationId })
      .eq("reference", reference);
  } catch {
    // Non-blocking: the claim itself already prevents reuse.
  }
}

/** Test helper — clears the in-memory development claims. */
export function resetMemoryClaimsForTests(): void {
  memoryClaims.clear();
}
