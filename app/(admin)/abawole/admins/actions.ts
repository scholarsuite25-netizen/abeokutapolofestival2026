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

export async function revokeAdminRoleAction(formData: FormData) {
  const session = await requirePermission("admin.manage");

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
