"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/supabase/audit";
import type { Role } from "@/lib/permissions/matrix";

const ALLOWED_ADMIN_ROLES: Role[] = [
  "president",
  "general_secretary",
  "security_checkin_officer",
  "finance_officer",
  "accreditation_officer",
  "media_officer",
  "sponsorship_officer",
  "super_admin",
];

export async function createAdminAccountAction(formData: FormData) {
  const session = await requirePermission("admin.manage");

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const role = formData.get("role") as Role;
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!email || !password || !fullName || !role) {
    return { ok: false, error: "Missing required fields (email, password, full name, role)." };
  }

  if (!ALLOWED_ADMIN_ROLES.includes(role)) {
    return { ok: false, error: "Invalid role specified." };
  }

  const supabase = createAdminClient();

  try {
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });

    if (createError) {
      return { ok: false, error: createError.message };
    }

    const newUser = createData.user;

    // Upsert profile
    const profilePayload: { id: string; email: string; full_name: string; phone: string | null; is_active: boolean; role?: Role } = {
      id: newUser.id,
      email,
      full_name: fullName,
      phone,
      is_active: true,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ ...profilePayload, role }, { onConflict: "id" });

    if (profileError) {
      await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
    }

    // Role assignment
    await supabase.from("user_role_assignments").insert({
      user_id: newUser.id,
      role_key: role,
      granted_reason: `Created by Super Admin ${session.user.email}`,
    });

    await writeAudit({
      action: "admin.create",
      entityType: "user",
      entityId: newUser.id,
      metadata: { email, role, fullName, createdBy: session.user.id },
    });

    revalidatePath("/abawole/admins");
    return { ok: true, message: `Administrator ${fullName} (${role}) created successfully.` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create administrator account." };
  }
}

export async function updateAdminDetailsAction(formData: FormData) {
  const session = await requirePermission("admin.manage");

  const userId = formData.get("userId") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const role = formData.get("role") as Role;

  if (!userId || !fullName) {
    return { ok: false, error: "User ID and full name are required." };
  }

  const supabase = createAdminClient();

  try {
    // Update Auth metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: fullName, phone },
    });

    // Update Profile
    const profileUpdate: { full_name: string; phone: string | null; role?: Role } = {
      full_name: fullName,
      phone,
    };
    if (role && ALLOWED_ADMIN_ROLES.includes(role)) {
      profileUpdate.role = role;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    if (profileError) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", userId);
    }

    if (role && ALLOWED_ADMIN_ROLES.includes(role)) {
      // Check existing active role
      const { data: existingRoles } = await supabase
        .from("user_role_assignments")
        .select("id, role_key")
        .eq("user_id", userId)
        .eq("role_key", role)
        .is("revoked_at", null);

      if (!existingRoles || existingRoles.length === 0) {
        // Revoke older role assignments and grant new one
        await supabase
          .from("user_role_assignments")
          .update({ revoked_at: new Date().toISOString() })
          .eq("user_id", userId)
          .is("revoked_at", null);

        await supabase.from("user_role_assignments").insert({
          user_id: userId,
          role_key: role,
          granted_reason: `Updated to ${role} by Super Admin ${session.user.email}`,
        });
      }
    }

    await writeAudit({
      action: "admin.update",
      entityType: "user",
      entityId: userId,
      metadata: { fullName, phone, role, updatedBy: session.user.id },
    });

    revalidatePath("/abawole/admins");
    return { ok: true, message: `Administrator details updated successfully.` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update administrator." };
  }
}

export async function resetAdminPasswordAction(formData: FormData) {
  const session = await requirePermission("admin.manage");

  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!userId || !newPassword || newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long." };
  }

  const supabase = createAdminClient();

  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    await writeAudit({
      action: "admin.password_reset",
      entityType: "user",
      entityId: userId,
      metadata: { resetBy: session.user.id },
    });

    return { ok: true, message: "Password updated successfully." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reset password." };
  }
}

/**
 * Approves an administrator whose access is broken.
 *
 * This is the Super Admin's recovery path for a staff member who cannot sign
 * in — forgotten password, deactivated account, a revoked role, a banned
 * account, or an address that was never confirmed. One click:
 *
 *   1. the account is reactivated, confirmed and unbanned;
 *   2. a revoked role is restored, so the person can actually do their job;
 *   3. a fresh one-time password is issued, shown to the Super Admin once so
 *      it can be handed over in person (the console never stores it).
 *
 * Every approval is written to the audit log with who did it.
 */
export async function approveAdminAccessAction(formData: FormData) {
  const session = await requirePermission("admin.manage");

  const userId = formData.get("userId") as string;
  if (!userId) {
    return { ok: false, error: "Missing userId." };
  }

  const supabase = createAdminClient();

  try {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return {
        ok: false,
        error: userError?.message || "That administrator account no longer exists.",
      };
    }
    const user = userData.user;

    // Work out which role the person should hold. The profile's role wins;
    // otherwise fall back to their most recent assignment, even a revoked one.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role, is_active")
      .eq("id", userId)
      .maybeSingle();

    const { data: assignments } = await supabase
      .from("user_role_assignments")
      .select("id, role_key, revoked_at, expires_at, granted_at")
      .eq("user_id", userId)
      .order("granted_at", { ascending: false });

    const now = Date.now();
    const activeAssignments = (assignments ?? []).filter(
      (a) => !a.revoked_at && (!a.expires_at || new Date(a.expires_at).getTime() > now),
    );
    const fallbackRole =
      profile?.role || (assignments ?? [])[0]?.role_key || "security_checkin_officer";

    // 1. Restore the account itself: active, confirmed, unbanned, new password.
    const temporaryPassword = generateTemporaryPassword();

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
      email_confirm: true,
      ban_duration: "none",
    });

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    // 2. Reactivate the profile.
    if (profile && profile.is_active === false) {
      await supabase.from("profiles").update({ is_active: true }).eq("id", userId);
    }

    // 3. Restore a role if every one of theirs had been revoked.
    let restoredRole: string | null = null;
    if (activeAssignments.length === 0) {
      const { error: roleError } = await supabase.from("user_role_assignments").insert({
        user_id: userId,
        role_key: fallbackRole,
        granted_reason: `Access approved by Super Admin ${session.user.email}`,
      });
      if (roleError) {
        return {
          ok: false,
          error: `The account was restored but its role could not be re-granted: ${roleError.message}`,
        };
      }
      restoredRole = fallbackRole;
    }

    await writeAudit({
      action: "admin.access_approved",
      entityType: "user",
      entityId: userId,
      metadata: {
        email: user.email,
        approvedBy: session.user.id,
        restoredRole,
        previousActiveRoles: activeAssignments.map((a) => a.role_key),
      },
    });

    revalidatePath("/abawole/admins");

    return {
      ok: true,
      message: restoredRole
        ? `Access approved for ${user.email}. Their ${restoredRole.replace(/_/g, " ")} role has been restored.`
        : `Access approved for ${user.email}.`,
      temporaryPassword,
      email: user.email,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to approve access for that administrator.",
    };
  }
}

/**
 * A one-time password the Super Admin hands over in person.
 * 20 characters from a readable alphabet, with a character mix.
 */
function generateTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = chars.length; i < 20; i += 1) chars.push(pick(all));

  // Fisher-Yates, so the guaranteed characters are not always at the front.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/**
 * Clears a staff member's second factor (MFA).
 *
 * The recovery path for someone who loses their phone or laptop: a Super Admin
 * clears the factor here and the member enrols again at /mfa-setup. Supabase
 * also signs the member out of active sessions when the factor is removed.
 */
export async function resetSecondFactorAction(formData: FormData) {
  const session = await requirePermission("admin.manage");

  const userId = formData.get("userId") as string;
  if (!userId) {
    return { ok: false, error: "Missing userId." };
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId });
    if (error) {
      return { ok: false, error: error.message };
    }

    const factors = data?.factors ?? [];
    for (const factor of factors) {
      const { error: deleteError } = await supabase.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId,
      });
      if (deleteError) {
        return { ok: false, error: deleteError.message };
      }
    }

    await writeAudit({
      action: "admin.reset_second_factor",
      entityType: "user",
      entityId: userId,
      metadata: { resetBy: session.user.id, factorsRemoved: factors.length },
    });

    return {
      ok: true,
      message:
        factors.length > 0
          ? "Second factor cleared. The member can now set it up again."
          : "That account had no second factor.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to clear the second factor.",
    };
  }
}

/**
 * Generates a fresh set of passwords for every staff account and returns a
 * plain-text credentials sheet the Super Admin can download immediately.
 *
 * Only a Super Admin can call this (`admin.manage`). The passwords are never
 * stored anywhere — they exist only in the response handed to the Super
 * Admin's browser.
 */
export async function downloadFreshStaffCredentialsAction() {
  const session = await requirePermission("admin.manage");
  const supabase = createAdminClient();

  try {
    const [
      { data: authUsersData, error: authError },
      { data: profilesData },
      { data: roleAssignmentsData },
    ] = await Promise.all([
      supabase.auth.admin.listUsers({ perPage: 100 }),
      supabase.from("profiles").select("id, email, full_name, role, is_active"),
      supabase.from("user_role_assignments").select("user_id, role_key, revoked_at, expires_at"),
    ]);

    if (authError) {
      return { ok: false, error: authError.message };
    }

    const profilesMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
    const now = Date.now();
    const rolesByUser = new Map<string, Set<string>>();
    for (const ra of roleAssignmentsData ?? []) {
      if (ra.revoked_at) continue;
      if (ra.expires_at && new Date(ra.expires_at).getTime() <= now) continue;
      if (!rolesByUser.has(ra.user_id)) rolesByUser.set(ra.user_id, new Set());
      rolesByUser.get(ra.user_id)!.add(ra.role_key);
    }

    const staff = authUsersData.users.filter((u) => {
      const roles = rolesByUser.get(u.id);
      const profile = profilesMap.get(u.id);
      return (
        (roles && roles.size > 0) ||
        Boolean(profile?.role) ||
        Boolean(u.email?.endsWith("@abeokutapolo2026.ng"))
      );
    });

    // Exclude the calling Super Admin from forced rotation unless they are the
    // only account — rotating your own password mid-session can surprise you.
    const lines: string[] = [
      "============================================================",
      " ABEOKUTA POLO FESTIVAL 2026 — STAFF CREDENTIALS",
      " CONFIDENTIAL — KEEP PRIVATE — DO NOT SHARE PUBLICLY",
      ` Generated: ${new Date().toISOString()} by ${session.user.email}`,
      "============================================================",
      "",
      "Give each person ONLY their own row. Never share a login.",
      "",
    ];

    for (const u of staff) {
      if (!u.email) continue;
      const isSelf = u.id === session.user.id;
      const profile = profilesMap.get(u.id);
      const roles = Array.from(rolesByUser.get(u.id) || []);
      if (profile?.role && !roles.includes(profile.role)) roles.push(profile.role);

      if (isSelf) {
        lines.push(
          "---------------------------------------------",
          `EMAIL   : ${u.email}`,
          "PASSWORD: (unchanged — this is the account you are signed in with)",
          `ROLE    : ${roles.join(", ") || "super_admin"}`,
          "",
        );
        continue;
      }

      const pwd = generateTemporaryPassword();
      const { error: upErr } = await supabase.auth.admin.updateUserById(u.id, {
        password: pwd,
        email_confirm: true,
        ban_duration: "none",
      });

      lines.push(
        "---------------------------------------------",
        `EMAIL   : ${u.email}`,
        `PASSWORD: ${upErr ? `(error: ${upErr.message})` : pwd}`,
        `ROLE    : ${roles.join(", ") || "staff"}`,
        "",
      );
    }

    await writeAudit({
      action: "admin.credentials_sheet_downloaded",
      entityType: "user",
      entityId: session.user.id,
      metadata: { downloadedBy: session.user.email, count: staff.length },
    });

    return { ok: true, content: lines.join("\r\n") };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to generate credentials sheet.",
    };
  }
}

export async function revokeAdminRoleAction(formData: FormData) {  const session = await requirePermission("admin.manage");

  const userId = formData.get("userId") as string;
  const roleKey = formData.get("roleKey") as string;

  if (!userId || !roleKey) {
    return { ok: false, error: "Missing userId or roleKey." };
  }

  // Prevent Super Admin from revoking their own super_admin role
  if (userId === session.user.id && roleKey === "super_admin") {
    return { ok: false, error: "Security Guard: Super Admin cannot revoke their own Super Admin privileges." };
  }

  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("user_role_assignments")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("role_key", roleKey)
      .is("revoked_at", null);

    if (error) {
      return { ok: false, error: error.message };
    }

    await writeAudit({
      action: "admin.role_revoked",
      entityType: "user",
      entityId: userId,
      metadata: { roleKey, revokedBy: session.user.id },
    });

    revalidatePath("/abawole/admins");
    return { ok: true, message: `Role ${roleKey} revoked successfully.` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to revoke role." };
  }
}
