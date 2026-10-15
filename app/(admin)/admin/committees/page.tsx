import Link from "next/link";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ReadinessPanel } from "@/components/committee/readiness-panel";
import { computeReadiness } from "@/lib/readiness";

export default function AdminCommitteesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Committees />
    </Suspense>
  );
}

async function Committees() {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  try {
    await requirePermission("roster.read_all");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  const supabase = await createClient();
  const { data: committees } = await supabase
    .from("committees")
    .select(
      `id, slug, name, status,
       committee_memberships ( id, person_records ( verified_status ) ),
       committee_tasks ( id, status ),
       committee_meetings ( id, status ),
       committee_decisions ( id, status ),
       committee_responsibilities ( id, status )`,
    )
    .order("name");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest">Committees</h1>
        <p className="text-xs text-muted-brand">
          Seven workspaces — names and rosters are private, never in public payloads.
        </p>
      </div>

      {committees?.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {committees.map((committee) => {
            const memberships = committee.committee_memberships as unknown as {
              person_records: { verified_status: string } | null;
            }[];
            const tasks = committee.committee_tasks as unknown as { status: string }[];
            const meetings = committee.committee_meetings as unknown as { status: string }[];
            const decisions = committee.committee_decisions as unknown as {
              status: string;
            }[];
            const responsibilities = committee.committee_responsibilities as unknown as {
              status: string;
            }[];

            const report = computeReadiness(
              {
                membersTotal: memberships.length,
                membersVerified: memberships.filter(
                  (m) => m.person_records?.verified_status === "verified",
                ).length,
                tasksTotal: tasks.length,
                tasksCompleted: tasks.filter((t) => t.status === "completed").length,
                meetingsTotal: meetings.length,
                meetingsHeld: meetings.filter((m) => m.status === "held").length,
                decisionsTotal: decisions.length,
                decisionsApproved: decisions.filter((d) => d.status === "approved").length,
              },
              responsibilities.filter((r) => r.status === "approved").length,
              responsibilities.length,
            );

            return (
              <Link
                key={committee.id}
                href={`/admin/committees/${committee.id}`}
                className="block rounded-lg border border-line bg-card p-4 transition-colors hover:border-forest-interactive/40 hover:bg-sage/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{committee.name}</p>
                    <p className="text-xs text-muted-brand">
                      {memberships.length} member{memberships.length === 1 ? "" : "s"} ·{" "}
                      {committee.slug}
                    </p>
                  </div>
                  <StatusBadge tone={committee.status === "active" ? "success" : "warning"}>
                    {committee.status === "active" ? "Active" : "Proposed"}
                  </StatusBadge>
                </div>
                <ReadinessPanel report={report} className="mt-4 border-0 bg-sage/30 p-3" />
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          title="No committees created yet"
          description="Super Admin creates edition-scoped committee workspaces here; rosters are imported provisionally."
        />
      )}
    </div>
  );
}
