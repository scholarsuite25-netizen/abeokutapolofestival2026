/**
 * scripts/registration_digest.ts
 *
 * Daily Midday Registration & Accreditation Digest (Runs 12:00 PM WAT / 11:00 AM UTC).
 * Computes:
 * - Total registered attendees
 * - Breakdown by category (General Public, Patron/VIP, Corporate, Media)
 * - Breakdown by affiliation (Individual, Guest of, Corporate)
 * - Daily gate check-in counts for Day 1, Day 2, Day 3
 * - Capacity warnings and pending VIP approvals
 */

import { isSupabaseConfigured } from "../lib/env";
import { createAdminClient } from "../lib/supabase/admin";

export interface RegistrationDigestReport {
  timestamp: string;
  totalRegistrations: number;
  confirmedCount: number;
  pendingReviewCount: number;
  categories: Record<string, number>;
  affiliations: {
    individual: number;
    guestOf: number;
    corporate: number;
  };
  dailyAttendance: {
    day1: number;
    day2: number;
    day3: number;
  };
  capacityAlerts: string[];
}

export async function generateRegistrationDigest(): Promise<RegistrationDigestReport> {
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    // Demonstration report when offline
    return {
      timestamp,
      totalRegistrations: 1420,
      confirmedCount: 1350,
      pendingReviewCount: 70,
      categories: {
        "Individual Attendee": 1050,
        "Guest of Member / Dignitary": 230,
        "Corporate Guest": 140,
      },
      affiliations: {
        individual: 1050,
        guestOf: 230,
        corporate: 140,
      },
      dailyAttendance: {
        day1: 940,
        day2: 1120,
        day3: 890,
      },
      capacityAlerts: [
        "Corporate Guest delegations are at 75% capacity.",
        "Grounds capacity tracking on schedule for all 3 days.",
      ],
    };
  }

  const supabase = createAdminClient();

  const { data: regs } = await supabase
    .from("registrations")
    .select("id, status, category, affiliation_type, group_size");

  const { data: creds } = await supabase
    .from("credentials")
    .select("id, day1_checked_in_at, day2_checked_in_at, day3_checked_in_at");

  const totalRegistrations = regs?.length || 0;
  const confirmedCount = regs?.filter((r) => r.status === "confirmed").length || 0;
  const pendingReviewCount = regs?.filter((r) => r.status === "pending_approval").length || 0;

  const categories: Record<string, number> = {};
  const affiliations = { individual: 0, guestOf: 0, corporate: 0 };

  regs?.forEach((r) => {
    categories[r.category] = (categories[r.category] || 0) + (r.group_size || 1);
    if (r.affiliation_type === "guest_of") affiliations.guestOf += 1;
    else if (r.affiliation_type === "corporate") affiliations.corporate += 1;
    else affiliations.individual += 1;
  });

  const dailyAttendance = {
    day1: creds?.filter((c) => c.day1_checked_in_at !== null).length || 0,
    day2: creds?.filter((c) => c.day2_checked_in_at !== null).length || 0,
    day3: creds?.filter((c) => c.day3_checked_in_at !== null).length || 0,
  };

  const capacityAlerts: string[] = [];
  if ((categories["Patron / VIP Guest"] || 0) > 200) {
    capacityAlerts.push("WARNING: VIP & Patron registrations exceed 200 guests.");
  }

  return {
    timestamp,
    totalRegistrations,
    confirmedCount,
    pendingReviewCount,
    categories,
    affiliations,
    dailyAttendance,
    capacityAlerts,
  };
}

if (require.main === module) {
  generateRegistrationDigest().then((report) => {
    console.log("=== 2026 ABEOKUTA POLO FESTIVAL: REGISTRATION DIGEST ===");
    console.log(`Generated: ${report.timestamp}`);
    console.log(`Total Registrations: ${report.totalRegistrations}`);
    console.log(`Confirmed: ${report.confirmedCount} | Pending Review: ${report.pendingReviewCount}`);
    console.log("Categories:", JSON.stringify(report.categories, null, 2));
    console.log("Affiliations:", JSON.stringify(report.affiliations, null, 2));
    console.log("Daily Attendance:", JSON.stringify(report.dailyAttendance, null, 2));
    console.log("Alerts:", report.capacityAlerts);
  });
}

