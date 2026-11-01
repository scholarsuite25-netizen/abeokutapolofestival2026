"use server";

import { z } from "zod";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { verifyPassToken, hashPassToken } from "@/lib/qr/token";

const scanInputSchema = z.object({
  passIdentifier: z.string().trim().min(3, "Please enter or scan a pass code."),
  gate: z.string().default("Gate 2 - General Turnstiles"),
  eventDay: z.coerce.number().int().min(1).max(3).default(1),
});

export interface ScanResult {
  status: "valid" | "duplicate" | "revoked" | "invalid";
  result: "admitted" | "already_admitted" | "rejected";
  holderName?: string;
  passType?: string;
  affiliationType?: string;
  hostName?: string;
  organization?: string;
  eventDay?: number;
  day1CheckedIn?: boolean;
  day2CheckedIn?: boolean;
  day3CheckedIn?: boolean;
  gate?: string;
  admittedAt?: string;
  firstCheckedInAt?: string;
  lastGate?: string;
  message: string;
}

function rejected(message: string): ScanResult {
  return { status: "invalid", result: "rejected", message };
}

// In-memory fallback attendance ledger for demo/local mode when remote Supabase isn't connected
const localAttendanceCache = new Map<string, { day1?: boolean; day2?: boolean; day3?: boolean }>();

export async function processGateScan(rawInput: unknown): Promise<ScanResult> {
  // 1. Authorization check
  let officerId: string = "offline-officer";
  try {
    const session = await requirePermission("credential.validate");
    officerId = session.user.id;
  } catch (error) {
    if (error instanceof PermissionError) {
      // In local preview allow testing
      if (process.env.NODE_ENV !== "production") {
        officerId = "local-dev-officer";
      } else {
        return rejected("Scanner access denied. Insufficient role for credential validation.");
      }
    }
  }

  const parsed = scanInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return rejected(parsed.error.issues[0]?.message || "Invalid pass format.");
  }

  const { passIdentifier, gate, eventDay } = parsed.data;

  // 2. Token cryptographic validation
  let identifier: string;
  let decodedHolderName: string | undefined;
  let decodedPassType: string | undefined;

  if (passIdentifier.startsWith("ABK26.")) {
    const tokenCheck = verifyPassToken(passIdentifier);
    if (!tokenCheck.valid) {
      return rejected(tokenCheck.error || "Cryptographic pass signature is invalid or forged.");
    }
    identifier = hashPassToken(passIdentifier);
    decodedHolderName = tokenCheck.payload?.holderName;
    decodedPassType = tokenCheck.payload?.passType;
  } else {
    identifier = passIdentifier.toUpperCase().trim();
  }

  // 3. Database check via process_gate_scan RPC
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc("process_gate_scan", {
        p_pass_identifier: identifier,
        p_gate: gate,
        p_officer_id: officerId === "local-dev-officer" ? null : officerId,
        p_event_day: eventDay,
      });

      if (!error && data) {
        return {
          status: data.status || "invalid",
          result: data.result || "rejected",
          holderName: data.holder_name,
          passType: data.pass_type,
          affiliationType: data.affiliation_type,
          hostName: data.host_name,
          organization: data.organization,
          eventDay: data.event_day || eventDay,
          day1CheckedIn: !!data.day1_checked_in,
          day2CheckedIn: !!data.day2_checked_in,
          day3CheckedIn: !!data.day3_checked_in,
          gate: data.gate || gate,
          admittedAt: data.admitted_at,
          firstCheckedInAt: data.first_checked_in_at,
          lastGate: data.last_gate,
          message: data.message || "Credential verification complete.",
        };
      }
    } catch {
      // Fall through to offline validator
    }
  }

  // 4. Local simulation for testing valid demo codes
  if (identifier.startsWith("ABK-2026-") || decodedHolderName) {
    const passKey = identifier;
    const history = localAttendanceCache.get(passKey) || {};

    const dayKey = eventDay === 1 ? "day1" : eventDay === 2 ? "day2" : "day3";

    if (history[dayKey]) {
      return {
        status: "duplicate",
        result: "already_admitted",
        holderName: decodedHolderName || "Registered Attendee",
        passType: decodedPassType || "Individual Attendee",
        eventDay,
        day1CheckedIn: !!history.day1,
        day2CheckedIn: !!history.day2,
        day3CheckedIn: !!history.day3,
        lastGate: gate,
        message: `Notice: This pass has already been admitted on Day ${eventDay}.`,
      };
    }

    // Mark as admitted for today
    history[dayKey] = true;
    localAttendanceCache.set(passKey, history);

    const dayAdmissionMessage =
      eventDay === 1
        ? "Day 1 (Fri 18 Dec): Free Public Admission Confirmed. Welcome!"
        : eventDay === 2
        ? "Day 2 (Sat 19 Dec): Admission Through Ticket Verified. Welcome to Semi-Finals Day!"
        : "Day 3 (Sun 20 Dec): Admission Through Ticket Verified. Welcome to Royal Finals Day!";

    return {
      status: "valid",
      result: "admitted",
      holderName: decodedHolderName || "Registered Attendee",
      passType: decodedPassType || "Individual Attendee",
      eventDay,
      day1CheckedIn: !!history.day1,
      day2CheckedIn: !!history.day2,
      day3CheckedIn: !!history.day3,
      gate,
      admittedAt: new Date().toLocaleTimeString(),
      message: dayAdmissionMessage,
    };
  }

  return rejected("Credential not recognized or pass code format invalid.");
}
