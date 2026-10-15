import { requireCommittee, isCommitteeOfficer } from "@/lib/auth/committee";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReadinessPanel } from "@/components/committee/readiness-panel";
import { computeReadiness } from "@/lib/readiness";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function CommitteeOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  const { slug } = await params;
  const { committee, session } = await requireCommittee(slug);
  const officer = await isCommitteeOfficer(committee.id, session);
  const supabase = await createClient();

  const [
    { data: responsibilities },
    { data: tasks },
    { data: meetings },
    { data: decisions },
    { data: memberships },
  ] = await Promise.all([
    supabase
      .from("committee_responsibilities")
      .select("id, title, body, status")
      .eq("committee_id", committee.id)
      .order("title"),
    supabase
      .from("committee_tasks")
      .select("id, status")
      .eq("committee_id", committee.id),
    supabase
      .from("committee_meetings")
      .select("id, status")
      .eq("committee_id", committee.id),
    supabase
      .from("committee_decisions")
      .select("id, status")
      .eq("committee_id", committee.id),
    supabase
      .from("committee_memberships")
      .select("id, verified_status, person_records ( verified_status )")
      .eq("committee_id", committee.id),
  ]);

  const membersVerified = (memberships ?? []).filter((m) => {
    const person = m.person_records as unknown as { verified_status?: string } | null;
    return person?.verified_status === "verified";
  }).length;

  const report = computeReadiness(
    {
      membersTotal: memberships?.length ?? 0,
      membersVerified,
      tasksTotal: tasks?.length ?? 0,
      tasksCompleted: (tasks ?? []).filter((t) => t.status === "completed").length,
      meetingsTotal: meetings?.length ?? 0,
      meetingsHeld: (meetings ?? []).filter((m) => m.status === "held").length,
      decisionsTotal: decisions?.length ?? 0,
      decisionsApproved: (decisions ?? []).filter((d) => d.status === "approved").length,
    },
    (responsibilities ?? []).filter((r) => r.status === "approved").length,
    responsibilities?.length ?? 0,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-forest">
            Responsibilities
          </h2>
          {officer ? (
            <StatusBadge tone="info">Officer access</StatusBadge>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-warning">
          Proposed — pending approval by leadership.
        </p>
        {responsibilities?.length ? (
          <ul className="mt-4 space-y-3">
            {responsibilities.map((item) => (
              <li key={item.id} className="rounded-lg border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{item.title}</p>
                  <StatusBadge tone={item.status === "approved" ? "success" : "warning"}>
                    {item.status}
                  </StatusBadge>
                </div>
                {item.body ? (
                  <p className="mt-1 text-sm text-muted-brand">{item.body}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-4"
            title="No responsibilities published yet"
            description="Officers add approved responsibilities here once leadership signs off."
          />
        )}
      </section>

      <aside className="space-y-6">
        <ReadinessPanel report={report} />
      </aside>
    </div>
  );
}
