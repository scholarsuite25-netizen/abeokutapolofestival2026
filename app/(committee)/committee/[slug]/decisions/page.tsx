import { requireCommittee, isCommitteeOfficer } from "@/lib/auth/committee";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured } from "@/components/shared/guards";
import { StatusBadge, type StatusBadgeTone } from "@/components/shared/status-badge";
import { DecisionForm } from "@/components/committee/decision-form";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";

const TONE: Record<string, StatusBadgeTone> = {
  proposed: "warning",
  approved: "success",
  rejected: "danger",
  superseded: "neutral",
};

export default function CommitteeDecisionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Decisions params={params} />
    </Suspense>
  );
}

async function Decisions({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  const { slug } = await params;
  const { committee, session } = await requireCommittee(slug);
  const officer = await isCommitteeOfficer(committee.id, session);
  const supabase = await createClient();

  const { data: decisions } = await supabase
    .from("committee_decisions")
    .select("id, title, body, decision_on, status")
    .eq("committee_id", committee.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-semibold text-forest">Decision register</h2>

      {officer ? <DecisionForm slug={slug} /> : null}

      {decisions?.length ? (
        <ul className="space-y-3">
          {decisions.map((decision) => (
            <li key={decision.id} className="rounded-lg border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{decision.title}</p>
                  {decision.body ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-brand">
                      {decision.body}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-brand">
                  {decision.decision_on ? (
                    <time dateTime={decision.decision_on}>
                      {new Date(decision.decision_on).toLocaleDateString("en-GB")}
                    </time>
                  ) : null}
                  <StatusBadge tone={TONE[decision.status] ?? "neutral"}>
                    {decision.status}
                  </StatusBadge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No decisions recorded"
          description="Approved decisions land here with their status trail."
        />
      )}
    </div>
  );
}
