import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // 2. Data Fetching from live Supabase database
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
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
          created_at,
          credentials (
            id,
            pass_code,
            pass_type,
            status,
            check_in_count,
            first_checked_in_at,
            last_checked_in_at,
            last_check_in_gate
          )
        `)
        .order("created_at", { ascending: false });

      if (data && !error) {
        participants = data.map((r: any) => {
          const cat = r.category || "";
          const isGuestOf = cat.toLowerCase().includes("guest of");
          const isCorporate = cat.toLowerCase().includes("corporate") || cat.toLowerCase().includes("sponsor");
          const affiliation_type: "individual" | "guest_of" | "corporate" = isGuestOf ? "guest_of" : isCorporate ? "corporate" : "individual";
          
          let host_name: string | null = null;
          let organization: string | null = null;
          if (isGuestOf) {
            const match = cat.match(/Guest of (.*)/i);
            host_name = match ? match[1] : null;
          }
          if (isCorporate) {
            const match = cat.match(/Corporate.*?\(?(.*?)\)?$/i);
            organization = match ? match[1] : null;
          }

          const creds = r.credentials || [];
          const passTypes = creds.map((c: any) => c.pass_type || "").join(" ") + " " + cat;
          const day1 = passTypes.includes("Day 1") || passTypes.includes("Dual Pass") || passTypes.includes("Royal");
          const day2 = passTypes.includes("Day 2") || passTypes.includes("Dual Pass") || passTypes.includes("Royal");
          const day3 = passTypes.includes("Day 3") || passTypes.includes("VVIP") || passTypes.includes("Royal");

          return {
            id: r.id,
            first_name: r.first_name,
            last_name: r.last_name,
            email: r.email,
            phone: r.phone,
            category: r.category,
            group_size: r.group_size || 1,
            status: r.status,
            affiliation_type,
            host_name,
            organization,
            created_at: r.created_at,
            day1,
            day2,
            day3,
            payment_method: cat.toLowerCase().includes("wire") ? "bank_transfer" : cat.toLowerCase().includes("pstk") ? "online_gateway" : "free",
            credentials: creds.map((c: any) => ({
              id: c.id,
              pass_code: c.pass_code,
              pass_type: c.pass_type,
              status: c.status,
              day1_checked_in_at: c.first_checked_in_at,
              day2_checked_in_at: c.check_in_count > 1 ? c.last_checked_in_at : null,
              day3_checked_in_at: c.check_in_count > 2 ? c.last_checked_in_at : null,
            })),
          };
        });
      }
    } catch {
      participants = [];
    }
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

      {/* Interactive Manager with ZERO Demo Data */}
      <RegistrationsManager initialParticipants={participants} />
    </div>
  );
}
