import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { can, type Actor, type Permission, type Role } from "@/lib/permissions/matrix";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role | null;
  is_active: boolean;
}

export interface SessionUser {
  user: User;
  profile: Profile | null;
  actor: Actor;
}

/** Reads the authenticated user plus profile. Returns null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, is_active")
    .eq("id", user.id)
    .single();

  const profile = (profileRow as Profile | null) ?? null;

  return {
    user,
    profile,
    actor: await buildActor(user.id, profile?.role ?? null),
  };
}

/**
 * Builds the Actor from active `user_role_assignments` (authoritative once
 * granted) with `profiles.role` as the bootstrap fallback.
 */
export async function buildActor(
  userId: string,
  fallbackRole: Role | null = null,
): Promise<Actor> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_role_assignments")
    .select("role_key, expires_at, revoked_at")
    .eq("user_id", userId);

  const now = Date.now();
  const roles = new Set<Role>();

  for (const row of data ?? []) {
    if (row.revoked_at) continue;
    if (row.expires_at && new Date(row.expires_at).getTime() <= now) continue;
    roles.add(row.role_key as Role);
  }

  if (fallbackRole) roles.add(fallbackRole);

  return { userId, roles: [...roles] };
}

/** Server-side permission check (defence layer 3). Default-deny. */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const session = await getSessionUser();
  if (!session) return false;
  return can(session.actor, permission);
}
