import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function AdminCommitteeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CommitteeDetail params={params} />
    </Suspense>
  );
}

async function CommitteeDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  try {
    await requirePermission("roster.read_all");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: committee } = await supabase
    .from("committees")
    .select("id, slug, name, status, edition_id")
    .eq("id", id)
    .maybeSingle();

  if (!committee) notFound();

  const { data: memberships } = await supabase
    .from("committee_memberships")
    .select(
      `id, role_key, verified_status,
       person_records ( id, source_spelling, verified_status )`,
    )
    .eq("committee_id", committee.id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-forest">
            {committee.name}
          </h1>
          <StatusBadge tone={committee.status === "active" ? "success" : "warning"}>
            {committee.status}
          </StatusBadge>
        </div>
        <Link
          href={`/committee/${committee.slug}`}
          className="text-sm font-medium text-forest-interactive underline-offset-4 hover:underline"
        >
          Open workspace →
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-forest">Roster</h2>
        {memberships?.length ? (
          <ul className="mt-3 space-y-2">
            {memberships.map((row) => {
              const person = row.person_records as unknown as {
                source_spelling: string;
                verified_status: string;
              } | null;

              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded border border-line bg-card px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-ink">
                    {person?.source_spelling ?? "—"}
                  </span>
                  <span className="flex items-center gap-2 text-muted-brand">
                    {row.role_key.replace(/_/g, " ")}
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
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState className="mt-3" title="No members imported yet" />
        )}
      </section>
    </div>
  );
}
