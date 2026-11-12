import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { PermissionDenied } from "@/components/shared/guards";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { RegistrationsManager, type ParticipantRecord } from "@/components/admin/registrations-manager";
import { connection } from "next/server";

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
    // Prerender fix: defer the session read to request time. The auth-js
    // session load calls Date.now() for token expiry, which Next rejects as an
    // unstable value while prerendering.
    await connection();

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
          *,
          credentials (
            *
          )
        `)
        .order("created_at", { ascending: false });

      if (data && !error) {
        participants = data.map((r: any) => {
          const cat = r.category || "";
          const isGuestOf = cat.toLowerCase().includes("guest of");
          const isCorporate = cat.toLowerCase().includes("corporate") || cat.toLowerCase().includes("sponsor");
          const affiliation_type: "individual" | "guest_of" | "corporate" =
            r.affiliation_type || (isGuestOf ? "guest_of" : isCorporate ? "corporate" : "individual");
          
          let host_name: string | null = r.host_name || null;
          let organization: string | null = r.organization || null;
          if (!host_name && isGuestOf) {
            const match = cat.match(/Guest of (.*)/i);
            host_name = match ? match[1] : null;
          }
          if (!organization && isCorporate) {
            const match = cat.match(/Corporate.*?\(?(.*?)\)?$/i);
            organization = match ? match[1] : null;
          }

          const creds = r.credentials || [];
          const passTypes = creds.map((c: any) => c.pass_type || "").join(" ") + " " + cat;
          const day1 = passTypes.includes("Day 1") || passTypes.includes("Dual Pass");
          const day2 = passTypes.includes("Day 2") || passTypes.includes("Dual Pass");
          const day3 =
            Boolean(r.has_day3_ticket) ||
            passTypes.includes("Day 3") ||
            passTypes.includes("VVIP") ||
            passTypes.includes("Table") ||
            passTypes.includes("Regular Section") ||
            passTypes.includes("Kings") ||
            passTypes.includes("Royal") ||
            passTypes.includes("Queens") ||
            passTypes.includes("Premium");

          const inferredPaymentMethod =
            r.payment_method ||
            (r.bank_transfer_ref || cat.toLowerCase().includes("wire") || cat.toLowerCase().includes("provisional")
              ? "bank_transfer"
              : r.day3_ticket_ref?.startsWith("ABK-VVIP-") || cat.toLowerCase().includes("pstk")
              ? "online_gateway"
              : "free");

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
            payment_method: inferredPaymentMethod,
            bank_transfer_ref: r.bank_transfer_ref || creds[0]?.bank_transfer_ref || null,
            day3_ticket_ref: r.day3_ticket_ref || creds[0]?.day3_ticket_ref || null,
            credentials: creds.map((c: any) => ({
              id: c.id,
              pass_code: c.pass_code,
              pass_type: c.pass_type,
              status: c.status,
              bank_transfer_ref: c.bank_transfer_ref || r.bank_transfer_ref || null,
              day3_ticket_ref: c.day3_ticket_ref || r.day3_ticket_ref || null,
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
