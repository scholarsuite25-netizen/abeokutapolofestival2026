"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "./password-strength-meter";

/**
 * Forgot password — two plain steps.
 *
 * 1. Enter your club email address and ask for a reset code.
 * 2. Type the code from the email and choose a new password.
 *
 * Club addresses are login identities rather than mailboxes, so the code is
 * delivered to the club's shared mailbox. The reply never reveals whether an
 * address exists.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "choose" | "done">("request");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/password-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "We could not send a code just now. Please try again shortly.");
        return;
      }

      setStatus("sent");
      setStep("choose");
      setMessage(
        `If ${email} belongs to a club account, a reset code is on its way. It works once and expires in about 60 minutes.`,
      );
    } catch {
      setStatus("error");
      setMessage("We could not reach the server. Please check your connection and try again.");
    }
  }

  async function saveNewPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setMessage(null);

    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("Your new password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("The two passwords do not match. Please type them again.");
      return;
    }

    try {
      const supabase = createClient();

      // The code proves the requester controls the account's mailbox.
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "recovery",
      });

      if (verifyError) {
        setStatus("error");
        setMessage(
          "That code was not accepted. It may have expired or already been used — ask for a new one.",
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setStatus("error");
        setMessage(updateError.message);
        return;
      }

      setStatus("sent");
      setStep("done");
      setMessage("Your new password has been saved. You can now sign in with it.");
    } catch {
      setStatus("error");
      setMessage("We could not change the password just now. Please try again.");
    }
  }

  if (step === "done") {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
        <a
          href="/sign-in"
          className="w-full rounded-lg bg-forest px-5 py-2.5 text-center text-xs font-semibold text-ivory hover:bg-forest-light transition-colors"
        >
          Go to Sign In
        </a>
      </div>
    );
  }

  if (step === "choose") {
    return (
      <form onSubmit={saveNewPassword} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="resetCode">Reset code from the email</Label>
          <Input
            id="resetCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="00000000"
            className="text-center font-mono text-lg tracking-[0.3em]"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordStrengthMeter password={newPassword} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmNewPassword">Repeat the new password</Label>
          <Input
            id="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {message ? (
          <p
            role={status === "error" ? "alert" : "status"}
            className={
              status === "error"
                ? "rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                : "rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
            }
          >
            {message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={status === "pending" || newPassword.length < 8 || newPassword !== confirmPassword}
          className="w-full"
        >
          {status === "pending" ? "Saving…" : "Save new password"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("request");
            setCode("");
            setNewPassword("");
            setConfirmPassword("");
            setMessage(null);
            setStatus("idle");
          }}
          className="self-center text-xs font-medium text-forest-interactive underline-offset-4 hover:underline"
        >
          Use a different email address
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Your club email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {message ? (
        <p
          role={status === "error" ? "alert" : "status"}
          className={
            status === "error"
              ? "rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
              : "rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
          }
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={status === "pending"} className="w-full">
        {status === "pending" ? "Sending…" : "Email me a reset code"}
      </Button>

      <p className="text-xs text-muted-brand leading-relaxed">
        Club email addresses share one mailbox, so the code is sent to the club&rsquo;s shared
        mailbox. Ask the Secretariat if it does not arrive. A Super Admin can also reset your
        password for you.
      </p>
    </form>
  );
}
