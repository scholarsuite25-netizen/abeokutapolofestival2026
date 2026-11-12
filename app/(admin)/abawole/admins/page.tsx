import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Users, ArrowLeft } from "lucide-react";
import { PermissionError, requirePermission } from "@/lib/auth/require";
import { isSupabaseConfigured } from "@/lib/env";
import { NotConfigured } from "@/components/shared/guards";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminManagementClient, type AdminUserRecord } from "@/components/admin/admin-management-client";
import { connection } from "next/server";

export const metadata = {
  title: "Administrator Governance & Access Console | 2026 Abeokuta Polo Festival",
  description: "Super Admin console for managing President, General Secretary, and Gate Marshal credentials.",
};

export default function AdminManagementPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminsContent />
    </Suspense>
  );
}

async function AdminsContent() {
  if (!isSupabaseConfigured()) return <NotConfigured />;

  // 1. Authoritative Super Admin permission guard
  let session;
  try {
    // Prerender fix: defer the session read to request time. The auth-js
    // session load calls Date.now() for token expiry, which Next rejects as an
    // unstable value while prerendering.
    await connection();

    session = await requirePermission("admin.manage");
  } catch (error) {
    if (error instanceof PermissionError) {
      return (
        <div className="mx-auto max-w-2xl py-12 text-center">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-forest">
              Super Admin Authorization Required
            </h1>
            <p className="mt-2 text-sm text-muted-brand leading-relaxed">
              This administrative management console is reserved exclusively for the Super Administrator. As President or General Secretary, you hold full operational permissions across the festival, but you cannot create, edit, or remove administrators.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/abawole"
                className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-ivory hover:bg-forest-light transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Executive Command Centre</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
    throw error;
  }

  // 2. Fetch all administrators
  const supabase = createAdminClient();

  const [
    { data: authUsersData, error: authError },
    { data: profilesData },
    { data: roleAssignmentsData }
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 100 }),
    supabase.from("profiles").select("id, email, full_name, phone, role, is_active, created_at"),
    supabase.from("user_role_assignments").select("id, user_id, role_key, revoked_at, expires_at"),
  ]);

  if (authError) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-800">
        Failed to load administrators: {authError.message}
      </div>
    );
  }

  const profilesMap = new Map((profilesData ?? []).map((p) => [p.id, p]));

  // Active roles by user_id
  const now = Date.now();
  const rolesByUser = new Map<string, Set<string>>();
  for (const ra of roleAssignmentsData ?? []) {
    if (ra.revoked_at) continue;
    if (ra.expires_at && new Date(ra.expires_at).getTime() <= now) continue;
    if (!rolesByUser.has(ra.user_id)) {
      rolesByUser.set(ra.user_id, new Set());
    }
    rolesByUser.get(ra.user_id)!.add(ra.role_key);
  }

  // Filter only users that have admin or officer roles, or profiles marked with roles
  const ADMIN_ROLE_SET = new Set([
    "super_admin",
    "president",
    "general_secretary",
    "security_checkin_officer",
    "finance_officer",
    "accreditation_officer",
    "media_officer",
    "sponsorship_officer",
  ]);

  const adminList: AdminUserRecord[] = [];

  for (const u of authUsersData.users) {
    const assignedRoles = Array.from(rolesByUser.get(u.id) || []);
    const profile = profilesMap.get(u.id);
    const profileRole = profile?.role;

    const allRoles = new Set(assignedRoles);
    if (profileRole) allRoles.add(profileRole);

    const hasAdminRole = Array.from(allRoles).some((r) => ADMIN_ROLE_SET.has(r));
    const isTargetDomain = u.email?.endsWith("@abeokutapolo2026.ng") || u.email?.includes("admin");

    if (hasAdminRole || isTargetDomain) {
      // An account is "approved" when it can actually be used: it is
      // confirmed, not banned, active, and still holds a live role.
      const isBanned = Boolean(u.banned_until && new Date(u.banned_until).getTime() > now);
      const isConfirmed = Boolean(u.email_confirmed_at);
      const isActive = profile?.is_active ?? true;
      const hasLiveRole = Array.from(rolesByUser.get(u.id) || []).length > 0 || Boolean(profileRole);

      adminList.push({
        id: u.id,
        email: u.email || "",
        fullName:
          (u.user_metadata?.full_name as string) ||
          profile?.full_name ||
          u.email?.split("@")[0] ||
          "Administrator",
        phone: (u.user_metadata?.phone as string) || profile?.phone || null,
        roles: Array.from(allRoles),
        createdAt: u.created_at,
        isActive,
        isApproved: isConfirmed && !isBanned && isActive && hasLiveRole,
        accessProblem:
          !isConfirmed
            ? "Email address was never confirmed"
            : isBanned
              ? "Account is suspended"
              : !isActive
                ? "Account has been deactivated"
                : !hasLiveRole
                  ? "All roles have been revoked"
                  : null,
      });
    }
  }

  // Sort: Super Admin first, then President, then General Secretary, then Financial Secretary, then Gate Marshal
  const ROLE_PRIORITY: Record<string, number> = {
    super_admin: 1,
    president: 2,
    general_secretary: 3,
    finance_officer: 4,
    security_checkin_officer: 5,
  };

  adminList.sort((a, b) => {
    const aPri = Math.min(...a.roles.map((r) => ROLE_PRIORITY[r] || 99));
    const bPri = Math.min(...b.roles.map((r) => ROLE_PRIORITY[r] || 99));
    return aPri - bPri;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-forest">
              Super Admin Exclusive Governance
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
            Administrator Hierarchy &amp; Access Control
          </h1>
          <p className="mt-1 text-sm text-muted-brand">
            Manage executive clearances, credentials passphrases, and turnstile gate marshals for the 2026 Abeokuta Polo Festival.
          </p>
        </div>

        <Link
          href="/abawole"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-xs font-medium text-forest shadow-xs hover:bg-sage/40 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>← Back to Command Centre</span>
        </Link>
      </div>

      <AdminManagementClient admins={adminList} currentUserId={session.user.id} />
    </div>
  );
}
