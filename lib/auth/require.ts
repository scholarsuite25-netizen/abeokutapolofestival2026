import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { can, type Permission, type Role } from "@/lib/permissions/matrix";

/**
 * Authoritative app-layer guards (ARCHITECTURE_PLAN.md §7.3, layer 3).
 * RLS remains the enforcement floor underneath these checks.
 */

/** Redirects signed-out users to /sign-in. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
  }
  return session;
}

/** Requires at least one of the given roles (super_admin always passes). */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await requireUser();
  const held = session.actor.roles.some(
    (role) => role === "super_admin" || roles.includes(role),
  );
  if (!held) {
    throw new PermissionError("This area requires a role you do not hold.");
  }
  return session;
}

/** Requires a specific permission. Throws PermissionError (render error boundary). */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await requireUser();
  if (!can(session.actor, permission)) {
    throw new PermissionError(`Missing permission: ${permission}`);
  }
  return session;
}

/** Non-throwing variant for conditional UI. */
export async function tryPermission(permission: Permission): Promise<SessionUser | null> {
  const session = await getSessionUser();
  if (!session) return null;
  return can(session.actor, permission) ? session : null;
}

export class PermissionError extends Error {
  readonly digest = "PERMISSION_DENIED";

  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionError";
  }
}
