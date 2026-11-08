"use server";

import { z } from "zod";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { verifyPassToken, hashPassToken } from "@/lib/qr/token";
import { isPassPendingVerification } from "@/lib/storage/unverified-passes";

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
    // If Next.js redirect was thrown, re-throw it immediately
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    if (error instanceof PermissionError) {
      // In local preview allow testing
      if (process.env.NODE_ENV !== "production") {
        officerId = "local-dev-officer";
      } else {
        return rejected("Scanner access denied. Insufficient role for credential validation.");
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        return rejected("Scanner access denied. Please sign in as an authorized Gate Marshal.");
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

  // 2b. Check in-memory unverified pass registry (Anti-Fraud Gate Guard)
  if (isPassPendingVerification(identifier) || isPassPendingVerification(passIdentifier)) {
    return rejected("Admission Pending Bursary Verification — Please proceed to Secretariat accreditation desk.");
  }

  // 3. Database check
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // Check credentials status directly
      const { data: directCred, error: credQueryError } = await supabase
        .from("credentials")
        .select("id, status, holder_name, pass_type, check_in_count, first_checked_in_at, last_checked_in_at, last_check_in_gate")
        .or(`token_hash.eq.${identifier},pass_code.eq.${identifier}`)
        .maybeSingle();

      if (directCred) {
        if (
          directCred.status === "pending_verification" ||
          directCred.status === "pending_bank_verification" ||
          directCred.status === "pending_approval"
        ) {
          try {
            await supabase.from("check_in_events").insert({
              credential_id: directCred.id,
              gate,
              officer_id: officerId === "local-dev-officer" ? null : officerId,
              result: "unverified",
              details: { reason: "Admission Pending Bursary Verification", eventDay },
            });
          } catch {}

          return {
            status: "invalid",
            result: "rejected",
            holderName: directCred.holder_name,
            passType: directCred.pass_type,
            eventDay,
            gate,
            message: "Admission Pending Bursary Verification — Please proceed to Secretariat accreditation desk.",
          };
        }

        if (directCred.status === "revoked") {
          try {
            await supabase.from("check_in_events").insert({
              credential_id: directCred.id,
              gate,
              officer_id: officerId === "local-dev-officer" ? null : officerId,
              result: "revoked",
              details: { reason: "Revoked pass", eventDay },
            });
          } catch {}

          return {
            status: "revoked",
            result: "rejected",
            holderName: directCred.holder_name,
            passType: directCred.pass_type,
            eventDay,
            gate,
            message: "This pass has been officially revoked by security protocol.",
          };
        }

        if (directCred.status === "active") {
          // If already checked in within the last 4 hours on the same gate/day, alert duplicate
          const lastCheckIn = directCred.last_checked_in_at ? new Date(directCred.last_checked_in_at).getTime() : 0;
          const isRecentCheckIn = (Date.now() - lastCheckIn) < (4 * 3600 * 1000) && directCred.check_in_count > 0;

          if (isRecentCheckIn) {
            try {
              await supabase.from("check_in_events").insert({
                credential_id: directCred.id,
                gate,
                officer_id: officerId === "local-dev-officer" ? null : officerId,
                result: "duplicate",
                details: { eventDay, passType: directCred.pass_type, note: "Already admitted today" },
              });
            } catch {}

            return {
              status: "duplicate",
              result: "already_admitted",
              holderName: directCred.holder_name,
              passType: directCred.pass_type,
              eventDay,
              day1CheckedIn: true,
              day2CheckedIn: directCred.check_in_count > 1,
              day3CheckedIn: directCred.check_in_count > 2,
              lastGate: directCred.last_check_in_gate || gate,
              message: `Notice: This pass has already been admitted at ${directCred.last_check_in_gate || gate}.`,
            };
          }

          // Mark pass as admitted
          const nowIso = new Date().toISOString();
          await supabase
            .from("credentials")
            .update({
              check_in_count: (directCred.check_in_count || 0) + 1,
              first_checked_in_at: directCred.first_checked_in_at || nowIso,
              last_checked_in_at: nowIso,
              last_check_in_gate: gate,
            })
            .eq("id", directCred.id);

          try {
            await supabase.from("check_in_events").insert({
              credential_id: directCred.id,
              gate,
              officer_id: officerId === "local-dev-officer" ? null : officerId,
              result: "admitted",
              details: { eventDay, passType: directCred.pass_type, holderName: directCred.holder_name },
            });
          } catch {}

          const dayAdmissionMessage =
            eventDay === 1
              ? "Day 1 (Fri 18 Dec): Free Public Admission Confirmed. Welcome!"
              : eventDay === 2
              ? "Day 2 (Sat 19 Dec): Admission Verified. Welcome to Semi-Finals Day!"
              : "Day 3 (Sun 20 Dec): VVIP Admission Verified. Welcome to Royal Finals Day!";

          return {
            status: "valid",
            result: "admitted",
            holderName: directCred.holder_name,
            passType: directCred.pass_type,
            eventDay,
            day1CheckedIn: true,
            day2CheckedIn: eventDay >= 2,
            day3CheckedIn: eventDay === 3,
            gate,
            admittedAt: new Date().toLocaleTimeString(),
            message: dayAdmissionMessage,
          };
        }
      }
    } catch (dbErr) {
      console.error("Gate scan error:", dbErr);
    }
  }

  // 4. In production with database configured, refuse offline simulation fall-through
  if (process.env.NODE_ENV === "production" && isSupabaseConfigured()) {
    return rejected("Credential not recognized or pass code format invalid.");
  }

  // 4. Local simulation for testing valid demo codes
  if (identifier.startsWith("ABK-2026-") || decodedHolderName) {
    if (isPassPendingVerification(identifier) || isPassPendingVerification(passIdentifier)) {
      return rejected("Admission Pending Bursary Verification — Please proceed to Secretariat accreditation desk.");
    }
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
