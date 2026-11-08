import Link from "next/link";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import { RegistrationApprovals } from "@/components/admin/registration-approvals";

export default function AdminMembersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MembersQueue />
    </Suspense>
  );
}

async function MembersQueue() {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  try {
    await requirePermission("registration.manage");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  const supabase = createAdminClient();
  const [{ data: people }, { data: pendingRaw }] = await Promise.all([
    supabase
      .from("person_records")
      .select("id, source_spelling, verified_status, created_at")
      .in("verified_status", ["unverified", "provisional"])
      .order("created_at", { ascending: false }),
    supabase
      .from("registrations")
      .select("id, first_name, last_name, email, phone, category, group_size, status, created_at")
      .in("status", ["pending_approval", "pending_bank_verification", "pending_verification"])
      .order("created_at", { ascending: false }),
  ]);

  const pending = (pendingRaw || []).map((p: any) => {
    const isWire = (p.category || "").toLowerCase().includes("wire") || (p.category || "").toLowerCase().includes("wema");
    return {
      ...p,
      bank_transfer_ref: isWire ? "WEMA-WIRE-REF" : null,
      payment_method: isWire ? "bank_transfer" : "free",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest">
          Verification &amp; Treasury Reconciliation Queue
        </h1>
        <p className="mt-1 text-sm text-muted-brand">
          Registration approvals and Day 3 direct bank wire payment reconciliations. The Financial Secretary, General Secretary, President, and Super Admin review bank transfers and activate accredited passes.
        </p>
      </div>

      <RegistrationApprovals
        pending={(pending ?? []) as Array<{
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          category: string;
          group_size: number;
          status: string;
          bank_transfer_ref?: string | null;
          payment_method?: string | null;
          created_at: string;
        }>}
      />

      {people?.length ? (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sage/60 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium text-ink">Source spelling</th>
                <th className="px-4 py-2.5 font-medium text-ink">Status</th>
                <th className="px-4 py-2.5 font-medium text-ink">Imported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((person) => (
                <tr key={person.id}>
                  <td className="px-4 py-3 font-medium text-ink">{person.source_spelling}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      tone={person.verified_status === "provisional" ? "warning" : "neutral"}
                    >
                      {person.verified_status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-brand">
                    {new Date(person.created_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Queue is clear"
          description="No provisional records are waiting for verification."
        />
      )}

      <div>
        <Button asChild variant="outline">
          <Link href="/abawole/registrations">Open Participant Console</Link>
        </Button>
      </div>
    </div>
  );
}
