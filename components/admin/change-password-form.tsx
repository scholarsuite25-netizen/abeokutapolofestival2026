"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { changeOwnPasswordAction } from "@/app/(admin)/abawole/change-password/actions";

interface ChangePasswordFormProps {
  userEmail: string;
  userRole?: string;
}

export function ChangePasswordForm({ userEmail, userRole }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("New passwords do not match. Please verify both fields.");
      return;
    }

    setStatus("submitting");

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    try {
      const res = await changeOwnPasswordAction(formData);
      if (res.ok) {
        setStatus("success");
        setMessage(res.message || "Your password has been changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus("error");
        setMessage(res.error || "Failed to change password.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      {status === "success" && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-display font-semibold text-emerald-900 text-sm">
                Password Successfully Updated
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {message} All subsequent logins for <span className="font-mono font-medium">{userEmail}</span> must use this new passphrase.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStatus("idle")}
                  className="text-xs bg-white text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                >
                  Change Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border border-line bg-sage/20 p-3 text-xs text-muted-brand flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-forest" />
            <span>Authenticated account: <strong className="text-forest font-mono">{userEmail}</strong></span>
          </div>
          {userRole && (
            <span className="rounded bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest uppercase tracking-wider">
              {userRole.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="currentPassword" className="text-xs font-semibold text-forest">
              Current Password (Optional)
            </Label>
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="flex items-center gap-1 text-[11px] text-muted-brand hover:text-forest"
            >
              {showCurrent ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showCurrent ? "Hide" : "Show"}</span>
            </button>
          </div>
          <Input
            id="currentPassword"
            type={showCurrent ? "text" : "password"}
            placeholder="Enter existing password if known"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="text-sm"
          />
          <p className="text-[10px] text-muted-brand">
            Optional verification step for extra account security.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="newPassword" className="text-xs font-semibold text-forest">
              New Password
            </Label>
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="flex items-center gap-1 text-[11px] text-muted-brand hover:text-forest"
            >
              {showNew ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showNew ? "Hide" : "Show"}</span>
            </button>
          </div>
          <Input
            id="newPassword"
            type={showNew ? "text" : "password"}
            required
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="text-sm"
          />
          <PasswordStrengthMeter password={newPassword} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-forest">
            Confirm New Password
          </Label>
          <Input
            id="confirmPassword"
            type={showNew ? "text" : "password"}
            required
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="text-sm"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-[11px] text-red-600">Passwords do not match.</p>
          )}
        </div>

        {status === "error" && message && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs text-red-800"
          >
            {message}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/abawole"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-brand hover:text-forest"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </Link>

          <Button
            type="submit"
            disabled={status === "submitting" || newPassword.length < 8 || newPassword !== confirmPassword}
            className="gap-2 bg-forest text-ivory hover:bg-forest-light"
          >
            <Lock className="h-4 w-4 text-gold" />
            <span>{status === "submitting" ? "Updating..." : "Update Password"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
