"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "./password-strength-meter";

export function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "pending" | "success" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasValidSession, setHasValidSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    try {
      // 1. Inspect URL search params and hash fragment for Supabase auth errors
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const rawError =
        searchParams.get("error_description") ||
        searchParams.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");

      if (rawError) {
        const decoded = decodeURIComponent(rawError.replace(/\+/g, " "));
        setErrorMessage(
          decoded === "auth_callback_failed" || decoded === "otp_failed"
            ? "Your password reset link is invalid or has expired. Please request a new one."
            : decoded,
        );
        setHasValidSession(false);
        setStatus("ready");
        return;
      }

      const supabase = createClient();
      const code = searchParams.get("code");

      const initAuthSession = async () => {
        // If query param carries a code, exchange it directly
        if (code) {
          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (!mounted) return;
            if (exchangeError) {
              setErrorMessage(exchangeError.message);
              setHasValidSession(false);
              setStatus("ready");
              return;
            }
          } catch {
            // Already exchanged or handled
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session) {
          const hash = window.location.hash;
          if (!hash || (!hash.includes("access_token") && !hash.includes("type=recovery"))) {
            setHasValidSession(false);
          }
        } else {
          setHasValidSession(true);
        }
        setStatus("ready");
      };

      initAuthSession();

      // Listen for PASSWORD_RECOVERY or SIGNED_IN event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (event === "PASSWORD_RECOVERY" || session) {
          setHasValidSession(true);
          setStatus("ready");
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch {
      setStatus("ready");
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!hasValidSession) {
      setErrorMessage("No active password reset session was detected. Please request a fresh reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both entries.");
      return;
    }

    setStatus("pending");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Password reset service is currently unavailable. Please try again later.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-forest">
            Password Reset Complete
          </h3>
          <p className="text-sm text-muted-brand leading-relaxed max-w-sm mx-auto">
            Your new password has been securely saved. You can now access your account using your updated credentials.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/sign-in"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-5 py-2.5 text-xs font-semibold text-ivory hover:bg-forest-light transition-colors"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/abawole"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-card px-5 py-2.5 text-xs font-semibold text-forest hover:bg-sage/40 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-gold-deep" />
            <span>Operations Console (/abawole)</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hasValidSession && status === "ready" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Reset session not detected</p>
            <p className="text-amber-800 leading-relaxed">
              Password reset links are single-use and time-sensitive. If you did not click a valid recovery link or it has expired, you can request a new one at{" "}
              <Link href="/forgot-password" className="font-semibold underline text-amber-950 hover:text-forest">
                Forgot Password
              </Link>.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="newPassword">New Password</Label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-1 text-xs text-muted-brand hover:text-forest"
            >
              {showPassword ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordStrengthMeter password={newPassword} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="flex items-center gap-1 text-xs text-muted-brand hover:text-forest"
            >
              {showConfirmPassword ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-[11px] text-red-600">Passwords do not match</p>
          )}
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
          >
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          disabled={status === "pending" || newPassword.length < 8 || newPassword !== confirmPassword}
          className="w-full gap-2"
        >
          <KeyRound className="h-4 w-4" />
          <span>{status === "pending" ? "Updating Password…" : "Save New Password"}</span>
        </Button>
      </form>
    </div>
  );
}

