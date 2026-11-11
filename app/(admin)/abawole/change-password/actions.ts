"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/supabase/audit";

export async function changeOwnPasswordAction(formData: FormData) {
  const session = await requireUser();
  const currentPassword = (formData.get("currentPassword") as string)?.trim();
  const newPassword = (formData.get("newPassword") as string)?.trim();
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: "New passwords do not match. Please verify both fields." };
  }

  // The current password is mandatory: a valid session alone must not be
  // enough to rotate credentials (protects against persisted access after
  // session theft).
  if (!currentPassword) {
    return { ok: false, error: "Current password is required." };
  }

  // Verify the current password against Supabase Auth before any change.
  if (session.user.email) {
    let verifyError: { message?: string } | null = null;
    try {
      const authClient = await createClient();
      const res = await authClient.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });
      verifyError = res.error;
    } catch {
      // Fail closed: if the check cannot complete (network/auth outage),
      // refuse the change instead of proceeding unverified.
      return {
        ok: false,
        error: "We could not verify your current password right now. Please try again shortly.",
      };
    }

    if (verifyError) {
      return {
        ok: false,
        error: "Current password is incorrect. Please check your existing password and try again.",
      };
    }
  }

  try {
    let updateError: { message: string } | null = null;

    try {
      const supabaseAdmin = createAdminClient();
      const res = await supabaseAdmin.auth.admin.updateUserById(session.user.id, {
        password: newPassword,
      });
      updateError = res.error;
    } catch {
      // Fallback to authenticated user client if service-role client is not configured
      const authClient = await createClient();
      const res = await authClient.auth.updateUser({ password: newPassword });
      updateError = res.error;
    }

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    // Write audit trail
    await writeAudit({
      action: "user.password_change",
      entityType: "user",
      entityId: session.user.id,
      metadata: {
        email: session.user.email,
        roles: session.actor.roles,
        changedAt: new Date().toISOString(),
      },
    });

    revalidatePath("/abawole");
    revalidatePath("/abawole/admins");
    revalidatePath("/abawole/change-password");
    return { ok: true, message: "Your password has been updated successfully." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update password.",
    };
  }
}
