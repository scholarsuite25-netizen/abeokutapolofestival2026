"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile`,
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("sent");
      setMessage("If that email has an account, a reset link has been sent.");
    } catch {
      setStatus("error");
      setMessage("Password reset is unavailable until Supabase is configured.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
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
        {status === "pending" ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
