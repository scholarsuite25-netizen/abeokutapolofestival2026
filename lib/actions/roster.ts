"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PermissionError } from "@/lib/auth/require";
import { parseRosterCsv } from "@/lib/import/roster";
import type { ActionState } from "@/lib/actions/committee";

export type ImportResult = ActionState & {
  imported?: number;
  skipped?: number;
};

/**
 * Roster CSV import (accreditation_officer / super_admin).
 * Creates provisional person_records + committee_memberships rows.
 * Never auto-merges identities; officers verify via the queue.
 */
export async function importRosterAction(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  try {
    await requirePermission("registration.manage");

    const slug = String(formData.get("slug") ?? "").trim();
    const file = formData.get("file");

    if (!slug) return { ok: false, message: "Choose a committee." };
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "Choose a CSV file to import." };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false, message: "CSV exceeds the 2 MB limit." };
    }

    const text = await file.text();
    const parsed = parseRosterCsv(text);
    if (!parsed.ok) return { ok: false, message: parsed.error };

    const supabase = await createClient();

    const { data: committee } = await supabase
      .from("committees")
      .select("id, edition_id, name")
      .eq("slug", slug)
      .maybeSingle();

    if (!committee) return { ok: false, message: "Committee not found or not visible." };

    const { data: existingPositions } = await supabase
      .from("committee_positions")
      .select("id, title")
      .eq("committee_id", committee.id);

    const positionByTitle = new Map(
      (existingPositions ?? []).map((p) => [p.title.toLowerCase(), p.id]),
    );

    let imported = 0;
    let skipped = 0;

    for (const row of parsed.rows) {
      let positionId: string | null = null;
      if (row.position) {
        positionId = positionByTitle.get(row.position.toLowerCase()) ?? null;
        if (!positionId) {
          const { data: created } = await supabase
            .from("committee_positions")
            .insert({
              committee_id: committee.id,
              title: row.position,
            })
            .select("id")
            .single();
          positionId = created?.id ?? null;
          if (positionId) positionByTitle.set(row.position.toLowerCase(), positionId);
        }
      }

      const { data: person } = await supabase
        .from("person_records")
        .insert({
          edition_id: committee.edition_id,
          source_spelling: row.name,
          email: row.email || null,
          phone: row.phone || null,
          verified_status: "provisional",
        })
        .select("id")
        .single();

      if (!person) {
        skipped++;
        continue;
      }

      const { error: membershipError } = await supabase.from("committee_memberships").insert({
        committee_id: committee.id,
        person_id: person.id,
        position_id: positionId,
        role_key: row.role,
        verified_status: "provisional",
      });

      if (membershipError) {
        skipped++;
        continue;
      }

      imported++;
    }

    await supabase.rpc("write_audit", {
      p_action: "roster.imported",
      p_resource_type: "committee",
      p_resource_id: committee.id,
      p_details: { imported, skipped, file: file.name },
    });

    revalidatePath(`/admin/members`);
    revalidatePath(`/committee/${slug}/members`);

    return {
      ok: true,
      imported,
      skipped,
      message: `Imported ${imported} record${imported === 1 ? "" : "s"} into ${committee.name}${skipped ? ` (${skipped} skipped)` : ""}. All rows are provisional — verify in the queue.`,
    };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: error.message };
    }
    console.error(error);
    return { ok: false, message: "Import failed. Check the file and try again." };
  }
}
