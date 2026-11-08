/**
 * Authoritative permission matrix — single source of truth.
 * Mirrors ARCHITECTURE_PLAN.md §7.4. Nothing else may invent permission logic.
 *
 * Defence in depth: navigation → route guard → `requirePermission()` → query
 * filters → RLS (floor) → audit logs.
 */

export const ROLES = [
  "public",
  "guest",
  "accreditation_officer",
  "finance_officer",
  "media_officer",
  "sponsorship_officer",
  "security_checkin_officer",
  "general_secretary",
  "president",
  "super_admin",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "content.read",
  "content.manage",
  "registration.read_own",
  "registration.manage",
  "roster.read",
  "roster.read_all",
  "finance.read",
  "sponsorship.read_public",
  "sponsorship.manage",
  "directory.read_own",
  "credential.issue",
  "credential.validate",
  "credential.override",
  "cms.publish",
  "grants.manage",
  "export.bulk",
  "admin.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Role → permission grants. Absence means "no access" (default-deny). */
const ROLE_GRANTS: Record<Role, readonly Permission[]> = {
  public: ["content.read", "sponsorship.read_public"],
  guest: ["content.read", "registration.read_own", "directory.read_own", "sponsorship.read_public"],
  accreditation_officer: [
    "content.read",
    "registration.manage",
    "roster.read",
    "credential.issue",
    "credential.override",
    "export.bulk",
  ],
  finance_officer: [
    "content.read",
    "content.manage",
    "registration.read_own",
    "registration.manage",
    "roster.read",
    "roster.read_all",
    "finance.read",
    "sponsorship.read_public",
    "sponsorship.manage",
    "directory.read_own",
    "credential.issue",
    "credential.validate",
    "credential.override",
    "cms.publish",
    "export.bulk",
  ],
  media_officer: ["content.read", "content.manage", "cms.publish", "export.bulk"],
  sponsorship_officer: [
    "content.read",
    "sponsorship.manage",
    "roster.read",
    "directory.read_own",
    "export.bulk",
  ],
  security_checkin_officer: [
    "content.read",
    "credential.validate",
    "credential.override",
    "directory.read_own",
  ],
  general_secretary: [
    "content.read",
    "content.manage",
    "registration.read_own",
    "registration.manage",
    "roster.read",
    "roster.read_all",
    "finance.read",
    "sponsorship.read_public",
    "sponsorship.manage",
    "directory.read_own",
    "credential.issue",
    "credential.validate",
    "credential.override",
    "cms.publish",
    "export.bulk",
  ],
  president: [
    "content.read",
    "content.manage",
    "registration.read_own",
    "registration.manage",
    "roster.read",
    "roster.read_all",
    "finance.read",
    "sponsorship.read_public",
    "sponsorship.manage",
    "directory.read_own",
    "credential.issue",
    "credential.validate",
    "credential.override",
    "cms.publish",
    "export.bulk",
  ],
  super_admin: [...PERMISSIONS],
} as const;

export interface Actor {
  userId: string;
  roles: readonly Role[];
}

export interface Scope {
  editionId?: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Default-deny authorisation check.
 */
export function can(actor: Actor, permission: Permission): boolean {
  return actor.roles.some((role) => ROLE_GRANTS[role].includes(permission));
}

export function roleGrants(role: Role): readonly Permission[] {
  return ROLE_GRANTS[role];
}

/** True when the actor holds privileged financial read access. */
export function canReadFinance(actor: Actor): boolean {
  return can(actor, "finance.read");
}
