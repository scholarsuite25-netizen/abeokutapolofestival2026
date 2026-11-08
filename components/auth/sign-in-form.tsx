"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const supabase = createClient();
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        router.push(next);
      } else {
        try {
          const { data: roleRows } = await supabase
            .from("user_role_assignments")
            .select("role_key, expires_at, revoked_at")
            .eq("user_id", authData.user?.id);

          const now = Date.now();
          const activeRoles = (roleRows || [])
            .filter((r) => !r.revoked_at && (!r.expires_at || new Date(r.expires_at).getTime() > now))
            .map((r) => r.role_key);

          const normalizedEmail = (authData.user?.email || email).toLowerCase().trim();
          const isAbawoleRole =
            activeRoles.some((r) =>
              ["super_admin", "president", "general_secretary", "finance_officer", "accreditation_officer"].includes(r)
            ) ||
            normalizedEmail === "secretary@abeokutapolo2026.ng" ||
            normalizedEmail === "president@abeokutapolo2026.ng" ||
            normalizedEmail === "superadmin@abeokutapolo2026.ng" ||
            normalizedEmail === "bursar@abeokutapolo2026.ng" ||
            normalizedEmail === "admin@abeokutapolo2026.ng";

          const isScanRole =
            activeRoles.includes("security_checkin_officer") ||
            normalizedEmail === "gate@abeokutapolo2026.ng";

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
    </form>
  );
}
