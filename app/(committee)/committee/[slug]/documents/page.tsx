import { FileText } from "lucide-react";
import { requireCommittee, isCommitteeOfficer } from "@/lib/auth/committee";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";
import { NotConfigured } from "@/components/shared/guards";
import { StatusBadge } from "@/components/shared/status-badge";
import { DocumentUploadForm } from "@/components/committee/document-upload-form";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function CommitteeDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Documents params={params} />
    </Suspense>
  );
}

async function Documents({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  const { slug } = await params;
  const { committee, session } = await requireCommittee(slug);
  const officer = await isCommitteeOfficer(committee.id, session);
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("committee_documents")
    .select("id, title, mime_type, size_bytes, created_at")
    .eq("committee_id", committee.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-forest">Documents</h2>
        <StatusBadge tone="warning">Private vault — explicit access grants</StatusBadge>
      </div>

      {officer ? <DocumentUploadForm slug={slug} /> : null}

      {documents?.length ? (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-card p-4"
            >
              <FileText aria-hidden className="size-5 shrink-0 text-forest-interactive" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{doc.title}</p>
                <p className="text-xs text-muted-brand">
                  {doc.mime_type ?? "file"}
                  {doc.size_bytes ? ` · ${Math.round(doc.size_bytes / 1024)} KB` : ""} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No documents uploaded"
          description="Officers upload private files here; access is granted per person, never public."
        />
      )}
    </div>
  );
}
