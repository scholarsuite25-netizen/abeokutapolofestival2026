import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { PermissionDenied } from "@/components/shared/guards";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { RegistrationsManager, type ParticipantRecord } from "@/components/admin/registrations-manager";

export const metadata = {
  title: "Participants Management — 2026 Abeokuta Polo Festival Console",
  description: "Manage registered attendees, guest affiliations, credentials, and daily attendance.",
};

export default function AdminRegistrationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RegistrationsContent />
    </Suspense>
  );
}

async function RegistrationsContent() {
  // 1. Permission check
  try {
    await requirePermission("registration.manage");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  let participants: ParticipantRecord[] = [];

  // 2. Data Fetching
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          category,
          group_size,
          status,
          affiliation_type,
          host_name,
          organization,
          payment_method,
          bank_transfer_ref,
          day3_ticket_ref,
          created_at,
          credentials (
            id,
            pass_code,
            pass_type,
            status,
            bank_transfer_ref,
            day3_ticket_ref,
            day1_checked_in_at,
            day2_checked_in_at,
            day3_checked_in_at
          )
        `)
        .order("created_at", { ascending: false });

      if (data && !error) {
        participants = data as unknown as ParticipantRecord[];
      }
    } catch {
      // Fallback to sample data below
    }
  }

  // 3. Fallback sample data for local preview or unconfigured database
  if (participants.length === 0) {
    participants = [
      {
        id: "demo-1",
        first_name: "Oladipupo",
        last_name: "Adeleke",
        email: "oladipupo.adeleke@example.com",
        phone: "+234 803 123 4567",
        category: "Day 1 & Day 2 Dual Pass",
        group_size: 1,
        status: "confirmed",
        affiliation_type: "guest_of",
        host_name: "Chief Olumide (Tournament Patron)",
        organization: null,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        day1: true,
        day2: true,
        day3: false,
        credentials: [
          {
            id: "cred-1",
            pass_code: "ABK-D12-X7K9",
            pass_type: "Day 1 & Day 2 Dual Pass",
            status: "active",
            day1_checked_in_at: new Date(Date.now() - 3600000).toISOString(),
            day2_checked_in_at: null,
            day3_checked_in_at: null,
          },
        ],
      },
      {
        id: "demo-2",
        first_name: "Folashade",
        last_name: "Balogun",
        email: "folashade.b@firstbank.com.ng",
        phone: "+234 802 987 6543",
        category: "Day 3 VVIP Grand Finale Pass",
        group_size: 1,
        status: "confirmed",
        affiliation_type: "corporate",
        host_name: null,
        organization: "First Bank of Nigeria (Lead Sponsor)",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        day1: true,
        day2: true,
        day3: true,
        day3_payment_ref: "PSTK-ABK-992104",
        credentials: [
          {
            id: "cred-2a",
            pass_code: "ABK-D12-FB01",
            pass_type: "Day 1 & Day 2 Dual Pass",
            status: "active",
            day1_checked_in_at: new Date(Date.now() - 7200000).toISOString(),
            day2_checked_in_at: new Date(Date.now() - 3600000).toISOString(),
            day3_checked_in_at: null,
          },
          {
            id: "cred-2b",
            pass_code: "ABK-VVIP-FB02",
            pass_type: "Day 3 VVIP Grand Finale Pass",
            status: "active",
            day1_checked_in_at: null,
            day2_checked_in_at: null,
            day3_checked_in_at: null,
          },
        ],
      },
      {
        id: "demo-3",
        first_name: "Babatunde",
        last_name: "Ogunleye",
        email: "babatunde.ogunleye@gmail.com",
        phone: "+234 818 456 7890",
        category: "Day 1 Access Pass (Free Entry)",
        group_size: 1,
        status: "confirmed",
        affiliation_type: "individual",
        host_name: null,
        organization: null,
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        day1: true,
        day2: false,
        day3: false,
        credentials: [
          {
            id: "cred-3",
            pass_code: "ABK-D1-LAWN4",
            pass_type: "Day 1 Access Pass (Free Entry)",
            status: "active",
            day1_checked_in_at: null,
            day2_checked_in_at: null,
            day3_checked_in_at: null,
          },
        ],
      },
      {
        id: "demo-4",
        first_name: "Dr. Ngozi",
        last_name: "Chukwuma",
        email: "ngozi.chukwuma@channels.tv",
        phone: "+234 805 333 4444",
        category: "Day 2 Access Pass (Free Entry)",
        group_size: 1,
        status: "confirmed",
        affiliation_type: "corporate",
        host_name: null,
        organization: "Channels Television",
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        day1: false,
        day2: true,
        day3: false,
        credentials: [
          {
            id: "cred-4",
            pass_code: "ABK-D2-MED01",
            pass_type: "Day 2 Access Pass (Free Entry)",
            status: "active",
            day1_checked_in_at: null,
            day2_checked_in_at: null,
            day3_checked_in_at: null,
          },
        ],
      },
      {
        id: "demo-5",
        first_name: "Ibrahim",
        last_name: "Dantata",
        email: "ibrahim.d@kano-polo.com",
        phone: "+234 803 777 8888",
        category: "Day 3 VVIP Grand Finale Pass",
        group_size: 1,
        status: "confirmed",
        affiliation_type: "guest_of",
        host_name: "Col. Adebayo (Polo Captain)",
        organization: null,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        day1: false,
        day2: false,
        day3: true,
        day3_invitation_code: "SAMPLE-INVITE",
        credentials: [
          {
            id: "cred-5",
            pass_code: "ABK-VVIP-RY01",
            pass_type: "Day 3 VVIP Grand Finale Pass",
            status: "active",
            day1_checked_in_at: null,
            day2_checked_in_at: null,
            day3_checked_in_at: null,
          },
        ],
      },
    ];
  }

  return (
    <div className="space-y-6">
      {/* Page Title & KPI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest sm:text-3xl">
            Participants &amp; Access Cards
          </h1>
          <p className="mt-1 text-sm text-muted-brand">
            View registered participants, filter by category, manage guest &amp; corporate
            affiliations, edit details, and download CSV records.
          </p>
        </div>
      </div>

      {/* Interactive Manager */}
      <RegistrationsManager initialParticipants={participants} />
    </div>
  );
}

