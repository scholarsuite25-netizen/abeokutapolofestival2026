import { describe, expect, it, vi, beforeEach } from "vitest";
import { evaluatePassword } from "@/components/auth/password-strength-meter";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock dependencies for changeOwnPasswordAction
vi.mock("@/lib/auth/require", () => ({
  requireUser: vi.fn().mockResolvedValue({
    user: { id: "user-123", email: "president@abeokutapolo2026.ng" },
    actor: { userId: "user-123", roles: ["president"] },
    profile: { id: "user-123", role: "president" },
  }),
}));

const mockUpdateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
  }),
}));

const mockSignInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: null });
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

const mockWriteAudit = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/supabase/audit", () => ({
  writeAudit: (...args: unknown[]) => mockWriteAudit(...args),
}));

describe("Password Management & Evaluation Rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Strength Meter & Evaluation (evaluatePassword)", () => {
    it("classifies empty string as Too Weak", () => {
      const res = evaluatePassword("");
      expect(res.score).toBe(0);
      expect(res.label).toBe("Too Weak");
      expect(res.criteria.minLength).toBe(false);
    });

    it("classifies short passwords (< 8 chars) as Weak regardless of complexity", () => {
      const res = evaluatePassword("Ab1!");
      expect(res.score).toBe(1);
      expect(res.label).toBe("Weak");
      expect(res.criteria.minLength).toBe(false);
    });

    it("classifies 8-character single-category password as Weak", () => {
      const res = evaluatePassword("password");
      expect(res.score).toBe(1);
      expect(res.label).toBe("Weak");
      expect(res.criteria.minLength).toBe(true);
      expect(res.criteria.hasMixedCase).toBe(false);
      expect(res.criteria.hasNumber).toBe(false);
      expect(res.criteria.hasSpecial).toBe(false);
    });

    it("classifies 8-character mixed-case password as Fair", () => {
      const res = evaluatePassword("Password");
      expect(res.score).toBe(2);
      expect(res.label).toBe("Fair");
      expect(res.criteria.minLength).toBe(true);
      expect(res.criteria.hasMixedCase).toBe(true);
      expect(res.criteria.hasNumber).toBe(false);
    });

    it("classifies 8-character mixed-case + number as Good", () => {
      const res = evaluatePassword("Password2026");
      expect(res.score).toBe(3);
      expect(res.label).toBe("Good");
      expect(res.criteria.minLength).toBe(true);
      expect(res.criteria.hasMixedCase).toBe(true);
      expect(res.criteria.hasNumber).toBe(true);
      expect(res.criteria.hasSpecial).toBe(false);
    });

    it("classifies 8+ characters mixed-case + number + special symbol as Strong", () => {
      const res = evaluatePassword("PoloPres2026!Executive");
      expect(res.score).toBe(4);
      expect(res.label).toBe("Strong");
      expect(res.criteria.minLength).toBe(true);
      expect(res.criteria.hasMixedCase).toBe(true);
      expect(res.criteria.hasNumber).toBe(true);
      expect(res.criteria.hasSpecial).toBe(true);
    });
  });

  describe("changeOwnPasswordAction Server Action", () => {
    it("rejects password shorter than 8 characters", async () => {
      const { changeOwnPasswordAction } = await import(
        "@/app/(admin)/abawole/change-password/actions"
      );

      const formData = new FormData();
      formData.append("newPassword", "short");
      formData.append("confirmPassword", "short");

      const res = await changeOwnPasswordAction(formData);
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/at least 8 characters/i);
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it("rejects mismatched confirm password", async () => {
      const { changeOwnPasswordAction } = await import(
        "@/app/(admin)/abawole/change-password/actions"
      );

      const formData = new FormData();
      formData.append("newPassword", "PoloSecure2026#");
      formData.append("confirmPassword", "DifferentPassword123!");

      const res = await changeOwnPasswordAction(formData);
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/do not match/i);
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it("successfully updates password for authenticated user and logs audit trail", async () => {
      const { changeOwnPasswordAction } = await import(
        "@/app/(admin)/abawole/change-password/actions"
      );

      const formData = new FormData();
      formData.append("newPassword", "NewSecurePolo2026#");
      formData.append("confirmPassword", "NewSecurePolo2026#");

      const res = await changeOwnPasswordAction(formData);
      expect(res.ok).toBe(true);
      expect(res.message).toMatch(/updated successfully/i);

      expect(mockUpdateUserById).toHaveBeenCalledWith("user-123", {
        password: "NewSecurePolo2026#",
      });

      expect(mockWriteAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "user.password_change",
          entityType: "user",
          entityId: "user-123",
        }),
      );
    });

    it("validates current password when provided", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: "Invalid login credentials" },
      });

      const { changeOwnPasswordAction } = await import(
        "@/app/(admin)/abawole/change-password/actions"
      );

      const formData = new FormData();
      formData.append("currentPassword", "WrongCurrentPassword123!");
      formData.append("newPassword", "NewSecurePolo2026#");
      formData.append("confirmPassword", "NewSecurePolo2026#");

      const res = await changeOwnPasswordAction(formData);
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/current password is incorrect/i);
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });
  });
});
