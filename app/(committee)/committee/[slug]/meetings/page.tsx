import { requireCommittee, isCommitteeOfficer } from "@/lib/auth/committee";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { MeetingForm } from "@/components/committee/meeting-form";
import { MinutesForm } from "@/components/committee/minutes-form";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function CommitteeMeetingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Meetings params={params} />
    </Suspense>
  );
}

async function Meetings({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  const { slug } = await params;
  const { committee, session } = await requireCommittee(slug);
  const officer = await isCommitteeOfficer(committee.id, session);
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("committee_meetings")
    .select("id, title, agenda, starts_at, location, status")
    .eq("committee_id", committee.id)
    .order("starts_at", { ascending: false, nullsFirst: false });

  // Minutes are officer/grant-visible (RLS); members simply get an empty list.
  const meetingIds = (meetings ?? []).map((m) => m.id);
  const { data: minutes } = meetingIds.length
    ? await supabase
        .from("meeting_minutes")
        .select("id, meeting_id, body, created_at")
        .in("meeting_id", meetingIds)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; meeting_id: string; body: string; created_at: string }[] };

  const minutesByMeeting = new Map<string, { id: string; body: string; created_at: string }[]>();
  for (const entry of minutes ?? []) {
    const list = minutesByMeeting.get(entry.meeting_id) ?? [];
    list.push({ id: entry.id, body: entry.body, created_at: entry.created_at });
    minutesByMeeting.set(entry.meeting_id, list);
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-semibold text-forest">Meetings</h2>

      {officer ? <MeetingForm slug={slug} /> : null}

      {meetings?.length ? (
        <ul className="space-y-3">
          {meetings.map((meeting) => {
            const meetingMinutes = minutesByMeeting.get(meeting.id) ?? [];

            return (
              <li key={meeting.id} className="rounded-lg border border-line bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{meeting.title}</p>
                    {meeting.agenda ? (
                      <p className="mt-1 text-sm text-muted-brand">{meeting.agenda}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-brand">
                    {meeting.starts_at ? (
                      <time dateTime={meeting.starts_at}>
                        {new Date(meeting.starts_at).toLocaleString("en-GB")}
                      </time>
                    ) : null}
                    <StatusBadge tone={meeting.status === "held" ? "success" : "info"}>
                      {meeting.status}
                    </StatusBadge>
                  </div>
                </div>

                {meetingMinutes.length ? (
                  <ul className="mt-3 space-y-2 border-t border-line pt-3">
                    {meetingMinutes.map((entry) => (
                      <li key={entry.id} className="text-sm text-ink">
                        <p className="whitespace-pre-wrap">{entry.body}</p>
                        <time className="mt-1 block text-xs text-muted-brand">
                          {new Date(entry.created_at).toLocaleString("en-GB")}
                        </time>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {officer ? <MinutesForm slug={slug} meetingId={meeting.id} /> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="No meetings scheduled"
          description="Officers schedule meetings; agendas and minutes appear here."
        />
      )}
    </div>
  );
}
