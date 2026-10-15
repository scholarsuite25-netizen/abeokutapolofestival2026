"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { verifyPassToken, hashPassToken } from "@/lib/qr/token";

const scanInputSchema = z.object({
  passIdentifier: z.string().trim().min(3, "Please enter or scan a pass code."),
  gate: z.string().default("Gate 2 - General Turnstile"),
});

export interface ScanResult {
  status: "valid" | "duplicate" | "revoked" | "invalid";
  result: "admitted" | "already_admitted" | "rejected";
  holderName?: string;
  passType?: string;
  gate?: string;
  admittedAt?: string;
  firstCheckedInAt?: string;
  lastGate?: string;
  message: string;
}

export async function processGateScan(rawInput: unknown): Promise<ScanResult> {
  const parsed = scanInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      status: "invalid",
      result: "rejected",
      message: parsed.error.issues[0]?.message || "Invalid pass format.",
    };
  }

  const { passIdentifier, gate } = parsed.data;

  // 1. If it's a signed JWT/Token, verify cryptographic HMAC signature first
  if (passIdentifier.startsWith("ABK26.")) {
    const tokenCheck = verifyPassToken(passIdentifier);
    if (!tokenCheck.valid) {
      return {
        status: "invalid",
        result: "rejected",
        message: tokenCheck.error || "Cryptographic pass signature is invalid or forged.",
      };
    }
  }

  // 2. Query Supabase RPC if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const tokenHash = passIdentifier.startsWith("ABK26.")
        ? hashPassToken(passIdentifier)
        : passIdentifier;

      const { data, error } = await supabase.rpc("process_gate_scan", {
        p_pass_identifier: tokenHash,
        p_gate: gate,
      });

      if (!error && data) {
        return {
          status: data.status || "valid",
          result: data.result || "admitted",
          holderName: data.holder_name,
          passType: data.pass_type,
          admittedAt: data.admitted_at,
          firstCheckedInAt: data.first_checked_in_at,
          lastGate: data.last_gate,
          message: data.message || "Credential verified.",
        };
      }
    } catch (dbErr) {
      console.warn("[Scanner] DB Scan error:", dbErr);
    }
  }

  // 3. Fallback / Test Gate Validation (for offline or local simulation)
  const normalized = passIdentifier.toUpperCase().trim();

  if (normalized.includes("REVOKED")) {
    return {
      status: "revoked",
      result: "rejected",
      message: "Security Notice: This credential was revoked by Chief Security Officer.",
    };
  }

  if (normalized.includes("USED") || normalized.includes("DUP")) {
    return {
      status: "duplicate",
      result: "already_admitted",
      holderName: "Tunde Balogun",
      passType: "General Admission",
      firstCheckedInAt: "Today at 11:24 AM",
      lastGate: "Gate 2",
      message: "Warning: Pass has already been checked in today.",
    };
  }

  return {
    status: "valid",
    result: "admitted",
    holderName: normalized.startsWith("ABK-") ? "Accredited Guest" : "Verified Attendee",
    passType: normalized.includes("VIP") ? "Royal Patrons Circle" : "General Lawn Pass",
    gate,
    admittedAt: new Date().toLocaleTimeString(),
    message: "Access Granted. Welcome to the 2026 Abeokuta Polo Festival.",
  };
}
