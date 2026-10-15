import { Suspense } from "react";
import { requireCommittee } from "@/lib/auth/committee";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function CommitteeMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Members params={params} />
    </Suspense>
  );
}

async function Members({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  const { slug } = await params;
  const { committee } = await requireCommittee(slug);
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("committee_memberships")
    .select(
      `id, role_key, verified_status,
       person_records ( id, source_spelling, verified_status ),
       committee_positions ( id, title )`,
    )
    .eq("committee_id", committee.id);

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-forest">Roster</h2>
      <p className="mt-1 text-xs text-muted-brand">
        Approved fields only — contact details stay in the accreditation record.
      </p>

      {memberships?.length ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sage/60 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium text-ink">Name (source spelling)</th>
                <th className="px-4 py-2.5 font-medium text-ink">Position</th>
                <th className="px-4 py-2.5 font-medium text-ink">Role</th>
                <th className="px-4 py-2.5 font-medium text-ink">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {memberships.map((row) => {
                const person = row.person_records as unknown as {
                  source_spelling: string;
                  verified_status: string;
                } | null;
                const position = row.committee_positions as unknown as {
                  title: string;
                } | null;

                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-ink">
                      {person?.source_spelling ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-brand">
                      {position?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-brand">
                      {row.role_key.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={
                          person?.verified_status === "verified"
                            ? "success"
                            : person?.verified_status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {person?.verified_status ?? row.verified_status}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          className="mt-4"
          title="No members imported yet"
          description="Secretariat imports provisional rosters; officers verify and link accounts."
        />
      )}
    </div>
  );
}
