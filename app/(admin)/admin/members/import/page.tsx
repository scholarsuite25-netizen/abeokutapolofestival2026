import Link from "next/link";
import { Suspense } from "react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured, PermissionDenied } from "@/components/shared/guards";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { RosterImportForm } from "@/components/admin/roster-import-form";

export default function AdminRosterImportPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RosterImport />
    </Suspense>
  );
}

async function RosterImport() {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  try {
    await requirePermission("registration.manage");
  } catch (error) {
    if (error instanceof PermissionError) return <PermissionDenied />;
    throw error;
  }

  const supabase = await createClient();
  const { data: committees } = await supabase
    .from("committees")
    .select("slug, name")
    .order("name");

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">
            Import roster
          </h1>
          <p className="mt-1 text-sm text-muted-brand">
            Upload a CSV of provisional members. Everything lands in the verification
            queue — nothing is auto-verified or auto-merged.
          </p>
        </div>
        <Link
          href="/admin/members"
          className="text-sm font-medium text-forest-interactive underline-offset-4 hover:underline"
        >
          ← Back to queue
        </Link>
      </div>

      <RosterImportForm
        committees={(committees ?? []).map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </div>
  );
}
