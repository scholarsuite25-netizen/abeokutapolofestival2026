import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/supabase/audit";

/**
 * Nightly database backup.
 *
 * Exports every public table to a single JSON file and stores it in a PRIVATE
 * Supabase Storage bucket (`club-backups`), keeping the last 14 days. It runs
 * from the Vercel cron (see vercel.json) and can also be triggered by hand:
 *
 *   curl -X POST https://www.abeokutapolofestival2026.org.ng/api/ops/backup \
 *        -H "Authorization: Bearer $CRON_SECRET"
 *
 * Restore with: node scripts/restore-from-backup.mjs
 */

const BUCKET = "club-backups";
const KEEP = 14;

// Ephemeral / operational tables that are not worth restoring.
const SKIP = new Set(["rate_limit_windows"]);

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const query = req.nextUrl.searchParams.get("key") || "";
  return header === `Bearer ${secret}` || query === secret;
}

export async function POST(req: NextRequest) {
  return runBackup(req);
}

export async function GET(req: NextRequest) {
  return runBackup(req);
}

async function runBackup(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // 1. Ensure the private bucket exists.
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b: { name?: string }) => b.name === BUCKET)) {
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
        public: false,
      });
      if (bucketError && !/already exists/i.test(bucketError.message)) {
        throw bucketError;
      }
    }

    // 2. Discover the tables through PostgREST.
    const root = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
      },
    });
    const exposed = await root.json();
    const tableNames = Object.keys(exposed).filter((t) => !SKIP.has(t));

    // 3. Export each table.
    const payload: Record<string, unknown[]> = {};
    let totalRows = 0;
    for (const table of tableNames) {
      const { data, error } = await supabase.from(table).select("*").limit(20000);
      if (error) continue;
      payload[table] = data ?? [];
      totalRows += data?.length ?? 0;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${stamp}.json`;
    const body = JSON.stringify({
      created_at: new Date().toISOString(),
      source: "club-backups",
      tables: tableNames,
      row_count: totalRows,
      data: payload,
    });

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, body, { contentType: "application/json", upsert: false });
    if (uploadError) throw uploadError;

    // 4. Prune old backups (keep the most recent KEEP).
    const { data: files } = await supabase.storage.from(BUCKET).list();
    const backups = (files || [])
      .filter((f: { name?: string }) => f.name?.startsWith("backup-") && f.name?.endsWith(".json"))
      .sort((a: { name?: string }, b: { name?: string }) =>
        (a.name || "").localeCompare(b.name || ""),
      );
    const stale = backups.slice(0, Math.max(0, backups.length - KEEP));
    for (const file of stale) {
      if (file.name) await supabase.storage.from(BUCKET).remove([file.name]);
    }

    await writeAudit({
      action: "system.database_backup",
      entityType: "backup",
      entityId: fileName,
      metadata: { tables: tableNames.length, rows: totalRows, pruned: stale.length },
    }).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      file: fileName,
      tables: tableNames.length,
      rows: totalRows,
      pruned: stale.length,
    });
  } catch (err) {
    console.error("[backup] Backup failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backup failed" },
      { status: 500 },
    );
  }
}
