import type { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resilient insert helper that handles remote database schema drift gracefully.
 * If PostgREST returns PGRST204 / "column does not exist" (PGRST204-style
 * errors), it automatically prunes the missing column and retries until the
 * insertion succeeds or only the base columns remain.
 *
 * Review finding M1: schema drift must never be silent. Every pruned column is
 * logged as a warning and reported back in `prunedColumns`, so operators can
 * reconcile the remote schema instead of data quietly disappearing.
 */
export interface AdaptiveInsertResult<TData = any> {
  data: TData | null;
  error: any;
  /** Columns dropped from the payload because the remote table lacks them. */
  prunedColumns: string[];
}

export async function adaptiveInsert<T extends Record<string, unknown>>(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  payload: T,
  selectQuery = "id",
): Promise<AdaptiveInsertResult> {
  const currentPayload: Record<string, unknown> = { ...payload };
  const prunedColumns: string[] = [];
  const maxAttempts = Object.keys(payload).length + 1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await (supabase.from(table as any) as any)
      .insert(currentPayload)
      .select(selectQuery)
      .maybeSingle();

    if (!res.error) {
      return { data: res.data, error: null, prunedColumns };
    }
    const msg = res.error.message || "";
    const match =
      msg.match(/Could not find the '([^']+)' column/) ||
      msg.match(/column "?([^"'\s]+)"? of relation "[^"]+" does not exist/);
    if (match && match[1] && match[1] in currentPayload) {
      const missingColumn = match[1];
      delete currentPayload[missingColumn];
      prunedColumns.push(missingColumn);
      console.warn(
        `[adaptiveInsert] Remote schema drift on table "${table}": column "${missingColumn}" does not exist — value pruned and insert retried. Reconcile the remote schema (supabase/migrations) with supabase/APPLY_ALL_MIGRATIONS.sql.`,
      );
      continue;
    }
    return { data: null, error: res.error, prunedColumns };
  }
  return {
    data: null,
    error: new Error("Max insert attempts reached"),
    prunedColumns,
  };
}
