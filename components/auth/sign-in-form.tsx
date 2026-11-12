"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Staff sign-in.
 *
 * Two simple routes:
 *   • "Email me a code" — the club's own mailer sends a one-time 6-digit code
 *     to the member's club address. No app, no phone, nothing to remember.
 *   • "Use my password" — the fallback when email is not to hand.
 */

type Mode = "code" | "password";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Sends the club member to the right place once they are signed in. */
  async function routeOnward(userEmail?: string) {
    const next = searchParams.get("next");
    if (next && next.startsWith("/")) {
      router.push(next);
      return;
    }
    try {
      const supabase = createClient();
      const { data: roleRows } = await supabase
        .from("user_role_assignments")
        .select("role_key, expires_at, revoked_at")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");

      const now = Date.now();
      const activeRoles = (roleRows || [])
        .filter((r) => !r.revoked_at && (!r.expires_at || new Date(r.expires_at).getTime() > now))
        .map((r) => r.role_key);

      const normalizedEmail = (userEmail || email).toLowerCase().trim();
      const isAbawoleRole =
        activeRoles.some((r) =>
          ["super_admin", "president", "general_secretary", "finance_officer", "accreditation_officer"].includes(r)
        ) ||
        normalizedEmail === "secretary@abeokutapolo2026.ng" ||
        normalizedEmail === "president@abeokutapolo2026.ng" ||
        normalizedEmail === "superadmin@abeokutapolo2026.ng" ||
        normalizedEmail === "finsec@abeokutapolo2026.ng" ||
        normalizedEmail === "finance@abeokutapolo2026.ng" ||
        normalizedEmail === "admin@abeokutapolo2026.ng";

      const isScanRole =
        activeRoles.includes("security_checkin_officer") ||
        normalizedEmail.startsWith("gate@") ||
        normalizedEmail.startsWith("gate1@") ||
        normalizedEmail.startsWith("gate2@") ||
        normalizedEmail.startsWith("gate3@");

      if (isAbawoleRole) {
        router.push("/abawole");
      } else if (isScanRole) {
        router.push("/scan");
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    }
  }

  async function requestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "We could not send a code just now. Please try again shortly.");
        return;
      }

      setCodeSent(true);
      setNotice(
        `If ${email} belongs to a club account, a 6-digit sign-in code is on its way. It works once and expires in about 15 minutes.`,
      );
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function submitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });

      if (verifyError) {
        setError(
          "That code was not accepted. It may have expired or already been used — send yourself a new one.",
        );
        return;
      }

      await routeOnward(data.user?.email);
      router.refresh();
    } catch {
      setError("We could not confirm your code just now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const supabase = createClient();
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          "That email and password did not match. Check them and try again, or email yourself a code instead.",
        );
        return;
      }

      await routeOnward(authData.user?.email);
      router.refresh();
    } catch (err) {
      console.error("Sign-in error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Sign-in is unavailable until Supabase is configured (.env.local).",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "code" ? (
        <>
          {codeSent ? (
            <form onSubmit={submitCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">6-digit sign-in code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-[0.35em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              {notice ? (
                <p className="rounded border border-forest/30 bg-forest/5 px-3 py-2 text-sm text-forest">
                  {notice}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={pending || code.trim().length < 6} className="w-full">
                {pending ? "Checking…" : "Enter code"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                  setNotice(null);
                  setError(null);
                }}
                className="self-center text-xs font-medium text-forest-interactive underline-offset-4 hover:underline"
              >
                Send a new code
              </button>
            </form>
          ) : (
            <form onSubmit={requestCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Club email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {notice ? (
                <p className="rounded border border-forest/30 bg-forest/5 px-3 py-2 text-sm text-forest">
                  {notice}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Sending…" : "Email me a sign-in code"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setError(null);
                }}
                className="self-center text-xs font-medium text-forest-interactive underline-offset-4 hover:underline"
              >
                Use my password instead
              </button>
            </form>
          )}
        </>
      ) : (
        <form onSubmit={submitPassword} className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/forgot-password"
                className="text-xs font-medium text-forest-interactive underline-offset-4 hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setMode("code");
              setError(null);
            }}
            className="self-center text-xs font-medium text-forest-interactive underline-offset-4 hover:underline"
          >
            Email me a sign-in code instead
          </button>
        </form>
      )}
    </div>
  );
}
