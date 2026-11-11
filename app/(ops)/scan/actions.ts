"use server";

import { z } from "zod";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { verifyPassToken, hashPassToken } from "@/lib/qr/token";
import { verifyInvitationToken, ROYAL_SECURITY_SEAL } from "@/lib/invitations/issuance";
import { getInvitationByCode } from "@/lib/invitations/storage";
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

/**
 * Normalizes input from turnstile scanners (extracts raw code or token if URL was scanned).
 */
function normalizeTurnstileInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("?") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(trimmed, "https://abeokuta-polo.local");
      const sigParam = url.searchParams.get("sig") || url.searchParams.get("token");
      if (sigParam) return decodeURIComponent(sigParam).trim();

      const idParam = url.searchParams.get("id") || url.searchParams.get("code");
      if (idParam) return decodeURIComponent(idParam).trim().toUpperCase();

      const match = url.pathname.match(/ABK-2026-INV-[2-9A-HJ-NP-Z]{4}/i);
      if (match) return match[0].toUpperCase();
    } catch {
      // Return trimmed
    }
  }

  // Handle direct format "ABK-2026-INV-XXXX::Aare Elesin"
  if (trimmed.includes("::")) {
    const parts = trimmed.split("::");
    const codePart = parts.find((p) => p.toUpperCase().includes("ABK-2026-INV-"));
    if (codePart) return codePart.trim().toUpperCase();
  }

  return trimmed;
}

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

  const { passIdentifier: rawPassIdentifier, gate, eventDay } = parsed.data;
  const passIdentifier = normalizeTurnstileInput(rawPassIdentifier);

  // 2. Token cryptographic validation
  let identifier: string;
  let decodedHolderName: string | undefined;
  let decodedPassType: string | undefined;
  let isComplimentaryInvite = false;
  let inviteCategory: string | undefined;
  let inviteDesignation: string | undefined;

  if (passIdentifier.startsWith("ABK26.")) {
    // 2a. Check if this is a signed Complimentary Invitation Token with "Aare Elesin" seal
    const inviteCheck = verifyInvitationToken(passIdentifier);
    if (inviteCheck.valid && inviteCheck.payload) {
      identifier = inviteCheck.payload.credentialId.toUpperCase();
      decodedHolderName = inviteCheck.payload.holderName;
      decodedPassType = `Complimentary (${inviteCheck.payload.category})`;
      isComplimentaryInvite = true;
      inviteCategory = inviteCheck.payload.category;
      inviteDesignation = inviteCheck.payload.designation;
    } else {
      // 2b. Standard pass token
      const tokenCheck = verifyPassToken(passIdentifier);
      if (!tokenCheck.valid) {
        return rejected(tokenCheck.error || "Cryptographic pass signature is invalid or forged.");
      }
      identifier = hashPassToken(passIdentifier);
      decodedHolderName = tokenCheck.payload?.holderName;
      decodedPassType = tokenCheck.payload?.passType;
    }
  } else {
    identifier = passIdentifier.toUpperCase().trim();
    if (identifier.startsWith("ABK-2026-INV-") || identifier.startsWith("ABK-COMP-")) {
      isComplimentaryInvite = true;
    }
  }

  // 2b. Check in-memory unverified pass registry (Anti-Fraud Gate Guard)
  if (isPassPendingVerification(identifier) || isPassPendingVerification(passIdentifier)) {
    return rejected("Admission Pending Bursary Verification — Please proceed to Secretariat accreditation desk.");
  }

  // 3. Handle Complimentary Invitation Gate Admission (ABK-2026-INV- / "Aare Elesin")
  if (isComplimentaryInvite || identifier.startsWith("ABK-2026-INV-")) {
    const inv = await getInvitationByCode(identifier);
    if (inv) {
      if (inv.status === "revoked") {
        return {
          status: "revoked",
          result: "rejected",
          holderName:
            decodedHolderName ||
            [inv.firstName, inv.surname].filter(Boolean).join(" ") ||
            inv.designation,
          passType: `Complimentary (${inv.category})`,
          eventDay,
          gate,
          message: "This complimentary invitation has been officially revoked by tournament security.",
        };
      }

      const holderName =
        decodedHolderName ||
        [inv.firstName, inv.surname].filter(Boolean).join(" ") ||
        inv.designation ||
        "Distinguished Guest";
      const passCategory = inviteCategory || inv.category;
      const passDesignation = inviteDesignation || inv.designation;

      // Duplicate prevention for complimentary guest — in-memory fast path
      const passKey = inv.invitationCode.toUpperCase();
      const history = localAttendanceCache.get(passKey) || {};
      const dayKey = eventDay === 1 ? "day1" : eventDay === 2 ? "day2" : "day3";

      if (history[dayKey]) {
        return {
          status: "duplicate",
          result: "already_admitted",
          holderName,
          passType: `Complimentary (${passCategory})`,
          affiliationType: passCategory,
          organization: passDesignation,
          eventDay,
          day1CheckedIn: !!history.day1,
          day2CheckedIn: !!history.day2,
          day3CheckedIn: !!history.day3,
          lastGate: gate,
          message: `Notice: This complimentary invitation has already been admitted on Day ${eventDay} at ${gate}.`,
        };
      }

      // DB-backed duplicate check: the in-memory ledger is lost on cold starts
      // and is invisible to other serverless instances, so consult persisted
      // admission history before admitting. Invitations are stored in the
      // `credentials` table (see lib/invitations/storage.ts), so inv.id
      // satisfies the check_in_events FK.
      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient();
          const { data: priorAdmissions, error: priorError } = await supabase
            .from("check_in_events")
            .select("gate, event_day, details")
            .eq("credential_id", inv.id)
            .eq("result", "admitted")
            .order("scanned_at", { ascending: false })
            .limit(50);

          if (priorError) {
            console.error("Gate scan: duplicate lookup failed:", priorError.message);
          } else {
            const priorAdmission = (priorAdmissions ?? []).find((row: {
              gate: string | null;
              event_day: number | null;
              details: { eventDay?: number } | null;
            }) => {
              // Prefer the day recorded in details (written by the app); the
              // event_day column defaults to 1 and may be stale on old rows.
              const admissionDay =
                typeof row.details?.eventDay === "number" ? row.details.eventDay : row.event_day;
              return admissionDay === eventDay;
            });

            if (priorAdmission) {
              history[dayKey] = true;
              localAttendanceCache.set(passKey, history);
              const priorGate = priorAdmission.gate || gate;
              return {
                status: "duplicate",
                result: "already_admitted",
                holderName,
                passType: `Complimentary (${passCategory})`,
                affiliationType: passCategory,
                organization: passDesignation,
                eventDay,
                day1CheckedIn: !!history.day1,
                day2CheckedIn: !!history.day2,
                day3CheckedIn: !!history.day3,
                lastGate: priorGate,
                message: `Notice: This complimentary invitation has already been admitted on Day ${eventDay} at ${priorGate}.`,
              };
            }
          }
        } catch (dbErr) {
          // Non-blocking: fall through to the in-memory ledger only.
          console.error("Gate scan: duplicate lookup error:", dbErr);
        }
      }

      // Record admission
      history[dayKey] = true;
      localAttendanceCache.set(passKey, history);

      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient();
          const { error: logError } = await supabase.from("check_in_events").insert({
            credential_id: inv.id,
            gate,
            officer_id: officerId === "local-dev-officer" ? null : officerId,
            result: "admitted",
            event_day: eventDay,
            details: {
              eventDay,
              passType: `Complimentary (${passCategory})`,
              holderName,
              securitySeal: ROYAL_SECURITY_SEAL,
            },
          });
          if (logError) {
            console.error("Gate scan: failed to persist admission event:", logError.message);
          }
        } catch (err) {
          console.error("Gate scan: failed to persist admission event:", err);
        }
      }

      const dayAdmissionMessage =
        eventDay === 1
          ? `Day 1 (Fri 18 Dec): Complimentary Guest Admission Confirmed (${passCategory}). Welcome!`
          : eventDay === 2
          ? `Day 2 (Sat 19 Dec): Dignitary Access Verified (${passCategory}). Welcome to Semi-Finals Day!`
          : `Day 3 (Sun 20 Dec): Royal Dignitary Admission Verified (${passCategory} · Aare Elesin Seal). Welcome to Royal Finals Day!`;

      return {
        status: "valid",
        result: "admitted",
        holderName,
        passType: `Complimentary (${passCategory})`,
        affiliationType: passCategory,
        organization: passDesignation,
        eventDay,
        day1CheckedIn: true,
        day2CheckedIn: eventDay >= 2,
        day3CheckedIn: eventDay === 3,
        gate,
        admittedAt: new Date().toLocaleTimeString(),
        message: dayAdmissionMessage,
      };
    } else if (decodedHolderName && isComplimentaryInvite) {
      // Offline validated token admission
      const passKey = identifier;
      const history = localAttendanceCache.get(passKey) || {};
      const dayKey = eventDay === 1 ? "day1" : eventDay === 2 ? "day2" : "day3";

      if (history[dayKey]) {
        return {
          status: "duplicate",
          result: "already_admitted",
          holderName: decodedHolderName,
          passType: decodedPassType || "Complimentary Dignitary",
          eventDay,
          day1CheckedIn: !!history.day1,
          day2CheckedIn: !!history.day2,
          day3CheckedIn: !!history.day3,
          lastGate: gate,
          message: `Notice: This pass has already been admitted on Day ${eventDay}.`,
        };
      }

      history[dayKey] = true;
      localAttendanceCache.set(passKey, history);

      return {
        status: "valid",
        result: "admitted",
        holderName: decodedHolderName,
        passType: decodedPassType || "Complimentary Dignitary",
        eventDay,
        day1CheckedIn: true,
        day2CheckedIn: eventDay >= 2,
        day3CheckedIn: eventDay === 3,
        gate,
        admittedAt: new Date().toLocaleTimeString(),
        message: `Royal Dignitary Admission Verified (Aare Elesin Seal). Welcome to Day ${eventDay}!`,
      };
    }
  }

  // 4. Standard Pass Database check
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // Check credentials status directly
      const { data: directCred } = await supabase
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

  // 5. In production with database configured, refuse offline simulation fall-through
  if (process.env.NODE_ENV === "production" && isSupabaseConfigured()) {
    return rejected("Credential not recognized or pass code format invalid.");
  }

  // 6. Local simulation for testing valid demo codes
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
