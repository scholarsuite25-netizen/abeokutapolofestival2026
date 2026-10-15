import Link from "next/link";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";

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

  const supabase = await createClient();
  const { data: people } = await supabase
    .from("person_records")
    .select("id, source_spelling, verified_status, created_at")
    .in("verified_status", ["unverified", "provisional"])
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">
            Verification queue
          </h1>
          <p className="mt-1 text-sm text-muted-brand">
            Provisional roster entries awaiting review. Identity is linked manually —
            name variants are never auto-merged.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/members/import">Import roster (CSV)</Link>
        </Button>
      </div>

      {people?.length ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-card">
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
                  <td className="px-4 py-3 font-medium text-ink">
                    {person.source_spelling}
                  </td>
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
          className="mt-6"
          title="Queue is clear"
          description="No provisional records are waiting for verification."
        />
      )}
    </div>
  );
}
