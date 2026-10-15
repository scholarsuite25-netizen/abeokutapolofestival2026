import { requireCommittee, isCommitteeOfficer } from "@/lib/auth/committee";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured } from "@/components/shared/guards";
import { StatusBadge, type StatusBadgeTone } from "@/components/shared/status-badge";
import { TaskForm } from "@/components/committee/task-form";
import { TaskStatusSelect } from "@/components/committee/task-status-select";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";

const STATUS_TONE: Record<string, StatusBadgeTone> = {
  not_started: "neutral",
  in_progress: "info",
  awaiting_approval: "warning",
  completed: "success",
  blocked: "danger",
  cancelled: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  awaiting_approval: "Awaiting approval",
  completed: "Completed",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

export default function CommitteeTasksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Tasks params={params} />
    </Suspense>
  );
}

async function Tasks({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  const { slug } = await params;
  const { committee, session } = await requireCommittee(slug);
  const officer = await isCommitteeOfficer(committee.id, session);
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("committee_tasks")
    .select("id, title, body, status, priority, due_on")
    .eq("committee_id", committee.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-forest">Tasks</h2>
        <p className="text-xs text-muted-brand">
          Board, list and Gantt views arrive in Phase 3 — data layer is live now.
        </p>
      </div>

      {officer ? <TaskForm slug={slug} /> : null}

      {tasks?.length ? (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-lg border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{task.title}</p>
                  {task.body ? (
                    <p className="mt-1 text-sm text-muted-brand">{task.body}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {officer ? (
                    <TaskStatusSelect slug={slug} taskId={task.id} current={task.status} />
                  ) : (
                    <StatusBadge tone={STATUS_TONE[task.status] ?? "neutral"}>
                      {STATUS_LABEL[task.status] ?? task.status}
                    </StatusBadge>
                  )}
                  {task.due_on ? (
                    <span className="text-xs text-muted-brand">
                      Due {new Date(task.due_on).toLocaleDateString("en-GB")}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No tasks yet"
          description={
            officer
              ? "Create the first task using the form above."
              : "Officers create tasks for this committee; members see them here."
          }
        />
      )}
    </div>
  );
}
