import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can, type Permission } from "@/lib/permissions/matrix";
import { PermissionError, requireUser } from "@/lib/auth/require";
import type { SessionUser } from "@/lib/auth/session";

export interface Committee {
  id: string;
  edition_id: string;
  slug: string;
  name: string;
  status: "proposed" | "active" | "archived";
}

/**
 * Loads a committee by slug through the RLS-scoped client.
 * Returns null when the row is invisible to this session (404 â€” no existence leak).
 */
export async function getCommitteeBySlug(slug: string): Promise<Committee | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("committees")
    .select("id, edition_id, slug, name, status")
    .eq("slug", slug)
    .maybeSingle();

  return (data as Committee | null) ?? null;
}

/**
 * Guard for `/committee/[slug]/**`.
 * RLS already hides invisible committees; this adds the app-layer check and
 * the permission gate for write-capable surfaces.
 */
export async function requireCommittee(
  slug: string,
  permission?: Permission,
): Promise<{ committee: Committee; session: SessionUser }> {
  const session = await requireUser(`/committee/${slug}`);
  const committee = await getCommitteeBySlug(slug);

  if (!committee) notFound();

  if (permission && !can(session.actor, permission)) {
    // Distinguish "no access to this workspace" from "missing fine-grained grant".
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from("committee_memberships")
      .select("id")
      .eq("committee_id", committee.id)
      .limit(1);

    if (!membership?.length) notFound();
    throw new Error("PERMISSION_DENIED");
  }

  return { committee, session };
}

/** Committee tab navigation (server-derived; never user-forgeable). */
export function committeeNav(slug: string) {
  return [
    { href: `/committee/${slug}`, label: "Overview" },
    { href: `/committee/${slug}/tasks`, label: "Tasks" },
    { href: `/committee/${slug}/members`, label: "Members" },
    { href: `/committee/${slug}/meetings`, label: "Meetings" },
    { href: `/committee/${slug}/decisions`, label: "Decisions" },
    { href: `/committee/${slug}/documents`, label: "Documents" },
  ] as const;
}

/**
 * App-layer officer check for write surfaces (defence layer 3; RLS enforces
 * again on every write). True for super_admin and anyone holding an active
 * `committee_officer` grant scoped to this committee (or unscoped), or a
 * committee_memberships row with role_key committee_officer linked to the
 * session user, or the profiles.role bootstrap fallback.
 */
export async function isCommitteeOfficer(
  committeeId: string,
  session: SessionUser,
): Promise<boolean> {
  if (session.actor.roles.includes("super_admin")) return true;

  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("role_key", "committee_officer")
    .or(`committee_id.eq.${committeeId},committee_id.is.null`)
    .is("revoked_at", null)
    .limit(1);

  if (assignments?.length) return true;

  const { data: person } = await supabase
    .from("person_records")
    .select("id")
    .eq("profile_id", session.user.id)
    .limit(1);

  if (person?.length) {
    const { data: membership } = await supabase
      .from("committee_memberships")
      .select("id")
      .eq("committee_id", committeeId)
      .eq("person_id", person[0]!.id)
      .eq("role_key", "committee_officer")
      .limit(1);

    if (membership?.length) return true;
  }

  return session.profile?.role === "committee_officer";
}

/** Guard for officer-only write surfaces. Throws PermissionError when not officer. */
export async function requireCommitteeOfficer(
  slug: string,
): Promise<{ committee: Committee; session: SessionUser }> {
  const { committee, session } = await requireCommittee(slug);

  if (!(await isCommitteeOfficer(committee.id, session))) {
    throw new PermissionError("Officer access required for this committee.");
  }

  return { committee, session };
}
